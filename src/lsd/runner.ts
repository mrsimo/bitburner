import { NS } from "@ns";

import { getRunnableServers } from "lib/explore";
import { profitableServer } from "lib/profitable";
import { h4ck } from "lib/break";

interface NumberDictionary {
  [index: string]: number;
}

interface NumberNumberDictionary {
  [index: string]: NumberDictionary;
}

export async function main(ns: NS): Promise<void> {
  const target = ns.args.length >= 1 ? ns.getServer(String(ns.args[0])) : profitableServer(ns);

  let useHome = true;
  if (ns.args.length >= 2) {
    useHome = !(String(ns.args[1]) == "dont");
  }

  ns.tprintf("Going to bootstrap against %s", target.hostname);

  const runnableServers = getRunnableServers(ns);

  // First make sure we've broken the servers as far as we can
  h4ck(ns, target.hostname);
  runnableServers.forEach((server) => h4ck(ns, server));

  useHome && runnableServers.push("home");

  // We count how many threads in total can we run in our network
  const { totalThreads, threadsPerServer } = calculateThreads(ns, runnableServers);

  const threadMultipliers = { grow: 25, weaken: 4, hack: 1 };

  const actualGroups =
    totalThreads / (threadMultipliers.grow + threadMultipliers.weaken + threadMultipliers.hack);
  let totalGroups = Math.floor(actualGroups);
  if (totalGroups < 1) {
    totalGroups = actualGroups;
  }
  let needs: NumberDictionary = {
    grow: Math.floor(totalGroups * threadMultipliers.grow),
    weaken: Math.floor(totalGroups * threadMultipliers.weaken),
    hack: Math.floor(totalGroups * threadMultipliers.hack),
  };

  const haves: NumberDictionary = { grow: 0, weaken: 0, hack: 0 };
  let toRun: NumberNumberDictionary = {};

  ns.tprintf("It should mean that we can run up to %s groups of threads", totalGroups);

  // Iterate over servers, ensuring we schedule enough threads in order, for a bit of consistency
  // TODO it would be better if we don't kill anything and instead... take what is and boot new stuff, killing only
  // what's necessary. Since we would only be growing, there shouldn't be a situation where we need to kill stuff,
  // unless we're changing the multipliers.

  runnableServers.forEach((server) => {
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
  });

  for (const server in toRun) {
    // Shut down previous version of hack if running and copy new hacks
    ns.scp(["lsd/grow.js", "lsd/weaken.js", "lsd/hack.js"], server);

    // First loop to shut down undesired processes so we can free memory
    let processes = ns.ps(server);
    for (const action in toRun[server]) {
      const threads = toRun[server][action];
      const script = "lsd/" + action + ".js";

      let process;
      for (let i = 0; i < processes.length; i++) {
        let proc = processes[i];
        if (proc.filename == script) process = proc;
      }

      if (
        process != null &&
        (process.threads != threads || String(process.args[0]) != target.hostname)
      ) {
        ns.tprintf("%s/%s: %s vs %s", server, action, threads, process?.threads || 0);
        ns.scriptKill(script, server);
      }
    }

    // Second loop to boot desired processes
    processes = ns.ps(server);
    for (const action in toRun[server]) {
      const threads = toRun[server][action];
      const script = "lsd/" + action + ".js";

      let process;
      for (let i = 0; i < processes.length; i++) {
        let proc = processes[i];
        if (proc.filename == script) process = proc;
      }

      if (process == null && threads > 0) {
        ns.tprintf("%s/%s: booting %s", server, action, threads);
        ns.exec(script, server, threads, target.hostname);
      }
    }
  }
}

/** @param {NS} ns */
function calculateThreads(
  ns: NS,
  runnableServers: string[],
): { threadsPerServer: NumberDictionary; totalThreads: number } {
  const scriptMemory = maxScriptMemory(ns);
  ns.tprintf("Seems like each script will need %s", ns.formatRam(scriptMemory));

  let totalThreads = 0;
  let threadsPerServer: NumberDictionary = {};

  for (var i = 0; i < runnableServers.length; i++) {
    const server = runnableServers[i];
    let availableMemory = ns.getServerMaxRam(server);
    if (server == "home") {
      const mr = ns.getServerMaxRam(server);
      const us = ns.getServerUsedRam(server);
      if (mr == 32) {
        availableMemory = mr - us - 16;
      } else {
        availableMemory = mr - us - 32;
      }
    }
    const threads = Math.floor(availableMemory / scriptMemory);

    threadsPerServer[server] = threads;
    totalThreads += threads;
  }

  ns.tprintf("We'd be able to run %s threads in total", totalThreads);

  return { threadsPerServer, totalThreads };
}

/** @param {NS} ns */
function maxScriptMemory(ns: NS) {
  let growScriptMemory = ns.getScriptRam("lsd/grow.js");
  let weakenScriptMemory = ns.getScriptRam("lsd/weaken.js");
  let hackScriptMemory = ns.getScriptRam("lsd/hack.js");

  return Math.max(growScriptMemory, weakenScriptMemory, hackScriptMemory);
}
