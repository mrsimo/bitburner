import { getRunnableServers } from "lib/explore.js";
import { isHackable } from "lib/hackable.js";
import { profitableServer } from "lib/profitable.js";
import { h4ck } from "lib/break.js";

/** @param {NS} ns */
export async function main(ns) {
  let mostProfitableServer;
  if (ns.args.length >= 1) {
    mostProfitableServer = ns.args[0];
  } else {
    mostProfitableServer = (await profitableServer(ns)).server;
  }

  let useHome = true;
  if (ns.args.length >= 2) {
    useHome = !(ns.args[1] == "dont");
  }

  ns.tprint("Going to bootstrap against " + mostProfitableServer);

  const runnableServers = await getRunnableServers(ns);

  // First make sure we've broken the servers as far as we can
  for (var i = 0; i < runnableServers.length; i++) {
    await h4ck(ns, runnableServers[i]);
  }
  await h4ck(ns, mostProfitableServer);

  useHome && runnableServers.push("home");

  // We count how many threads in total can we run in our network
  const { totalThreads, threadsPerServer } = calculateThreads(ns, runnableServers);

  const threadMultipliers = { grow: 20, weaken: 4, hack: 1 };

  const totalGroups = Math.floor(
    totalThreads / (threadMultipliers.grow + threadMultipliers.weaken + threadMultipliers.hack),
  );
  const needs = {
    grow: totalGroups * threadMultipliers.grow,
    weaken: totalGroups * threadMultipliers.weaken,
    hack: totalGroups * threadMultipliers.hack,
  };
  const haves = { grow: 0, weaken: 0, hack: 0 };
  let toRun = {};

  ns.tprintf("It should mean that we can run up to %s groups of threads", totalGroups);

  // Iterate over servers, ensuring we schedule enough threads in order, for a bit of consistency
  // TODO it would be better if we don't kill anything and instead... take what is and boot new stuff, killing only
  // what's necessary. Since we would only be growing, there shouldn't be a situation where we need to kill stuff,
  // unless we're changing the multipliers.

  for (var i = 0; i < runnableServers.length; i++) {
    const server = runnableServers[i];
    let availableThreads = threadsPerServer[server];
    toRun[server] = { grow: 0, weaken: 0, hack: 0 };

    for (const action in needs) {
      const missing = needs[action] - haves[action];

      if (missing > 0) {
        let canRun = Math.min(missing, availableThreads);
        toRun[server][action] = canRun;
        availableThreads = availableThreads - canRun;
        haves[action] = haves[action] + canRun;
      }
    }
  }

  for (const server in toRun) {
    // Shut down previous version of hack if running and copy new hacks
    ns.scriptKill("hack.js", server);
    ns.rm("hack.js", server);
    ns.scp(["hack-grow.js", "hack-weaken.js", "hack-hack.js", "lib/wait.js"], server);

    // First loop to shut down undesired processes so we can free memory
    let processes = ns.ps(server);
    for (const action in toRun[server]) {
      const threads = toRun[server][action];
      const script = "hack-" + action + ".js";

      let process;
      for (let i = 0; i < processes.length; i++) {
        let proc = processes[i];
        if (proc.filename == script) process = proc;
      }

      if (process != null && (process.threads != threads || process.args != mostProfitableServer)) {
        ns.tprintf("%s/%s: %s vs %s", server, action, threads, process?.threads || 0);
        ns.scriptKill(script, server);
      }
    }

    // Second loop to boot desired processes
    processes = ns.ps(server);
    for (const action in toRun[server]) {
      const threads = toRun[server][action];
      const script = "hack-" + action + ".js";

      let process;
      for (let i = 0; i < processes.length; i++) {
        let proc = processes[i];
        if (proc.filename == script) process = proc;
      }

      if (process == null && threads > 0) {
        ns.tprintf("%s/%s: booting %s", server, action, threads);
        ns.exec(script, server, threads, mostProfitableServer);
      }
    }
  }
}

/** @param {NS} ns */
function calculateThreads(ns, runnableServers) {
  const scriptMemory = maxScriptMemory(ns);
  ns.tprintf("Seems like each script will need %sG", scriptMemory);

  let totalThreads = 0;
  let threadsPerServer = {};

  for (var i = 0; i < runnableServers.length; i++) {
    const server = runnableServers[i];
    let availableMemory = ns.getServerMaxRam(server);
    if (server == "home") {
      ns.getServerMaxRam(server) - ns.getServerUsedRam(server) - 32;
    }
    const threads = Math.floor(availableMemory / scriptMemory);

    threadsPerServer[server] = threads;
    totalThreads += threads;
  }

  ns.tprintf("We'd be able to run %s threads in total", totalThreads);

  return { threadsPerServer, totalThreads };
}

/** @param {NS} ns */
function maxScriptMemory(ns) {
  let growScriptMemory = ns.getScriptRam("hack-grow.js");
  let weakenScriptMemory = ns.getScriptRam("hack-weaken.js");
  let hackScriptMemory = ns.getScriptRam("hack-hack.js");

  return Math.max(growScriptMemory, weakenScriptMemory, hackScriptMemory);
}
