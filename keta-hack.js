import { getRunnableServers } from "lib/explore.js";
import { profitableServer } from "lib/profitable.js";
import { h4ck } from "lib/break.js";
import { pkill } from "lib/kill.js";
import { parametersForPercent } from "lib/keta.js";

/** @param {NS} ns */
export async function main(ns) {
  let ts = ns.args[0];
  let watchdog = ns.args.length >= 2 ? ns.args[1] == "please" : false;

  ns.tprintf("Going to bootstrap against " + ts);

  pkill(ns, "watchserver.js", "home", ts);
  ns.run("watchserver.js", 1, ts);

  let target = ns.getServer(ts);
  let player = ns.getPlayer();

  if (target.moneyMax > target.moneyAvailable || target.minDifficulty < target.hackDifficulty) {
    ns.tprintf(
      "Target server isn't at minimum security and maximum money yet. Running the hackiest fixer",
    );

    await h4ck(ns, target.hostname);

    let availableMemory = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 32; // use all but 32GB

    ns.run(
      "hack-grow.js",
      Math.floor((availableMemory * 0.05) / ns.getScriptRam("hack-grow.js")),
      target.hostname,
    );
    ns.run(
      "hack-weaken.js",
      Math.floor((availableMemory * 0.05) / ns.getScriptRam("hack-weaken.js")),
      target.hostname,
    );

    ns.tprint("Waiting until server is primed");

    while (true) {
      await ns.sleep(200);

      let updatedTarget = ns.getServer(target.hostname);
      if (
        updatedTarget.moneyMax == updatedTarget.moneyAvailable &&
        updatedTarget.minDifficulty == updatedTarget.hackDifficulty
      ) {
        pkill(ns, "hack-grow.js", "home", ts);
        pkill(ns, "hack-weaken.js", "home", ts);

        break;
      }
    }
  }

  target = ns.getServer(ts);
  player = ns.getPlayer();

  const memPerThread = maxScriptMemory(ns);
  const runnableServers = await getRunnableServers(ns);

  // First make sure we've broken the servers as far as we can
  for (var i = 0; i < runnableServers.length; i++) {
    await h4ck(ns, runnableServers[i]);
  }

  runnableServers << ns.getServer("home");

  let slot = 0;
  for (var i = 0; i < runnableServers.length; i++) {
    const server = ns.getServer(runnableServers[i]);
    let maxThreads = Math.floor((server.maxRam - server.ramUsed) / memPerThread);

    if (server.hostname == "home") {
      maxThreads = Math.floor((server.maxRam - server.ramUsed - 32) / memPerThread);
    }

    ns.printf("%s: can run %s threads", server.hostname, maxThreads);

    // Find the maximum hack that fits.
    let lastParametersFound = { percent: 0 };
    let found = false;
    for (let percent = 25; percent <= 100; percent++) {
      let parameters = parametersForPercent(ns, percent, player, target);
      let necessaryThreads =
        parameters.growThreads +
        parameters.hackThreads +
        parameters.growWeakenThreads +
        parameters.hackWeakenThreads;

      if (necessaryThreads > maxThreads) {
        break;
      } else {
        lastParametersFound = parameters;
      }
    }

    if (lastParametersFound.percent > 0) {
      ns.printf(
        "%s: supports running hack for %s percent",
        server.hostname,
        lastParametersFound.percent,
      );
      await boot(ns, server, lastParametersFound, target, slot);
      slot++;
    } else {
      ns.printf("%s: skipping, can't support the minimum hack flow", server.hostname);
    }
  }

  const weakenTime = ns.formulas.hacking.weakenTime(target, player);
  ns.tprint(
    ns.sprintf(
      "%s - %s: I've booted %s slots in a cycle that lasts %s",
      new Date().toISOString(),
      ts,
      slot + 1,
      ns.tFormat(weakenTime + 2000),
    ),
  );

  // I was told to start the watchdog process. clean-shutdown.
  if (watchdog) {
    ns.spawn("keta-watchdog.js", 1, ts, "please");
  }
}

/** @param {NS} ns */
async function boot(ns, server, parameters, target, slot) {
  ns.printf("[%s] %s: booting processes", slot, server.hostname);

  // Shut down previous version of hack if running and copy new hacks
  ns.scriptKill("hack.js", server.hostname);
  ns.rm("hack.js", server.hostname);
  ns.scp(["hack-grow.js", "hack-weaken.js", "hack-hack.js", "lib/wait.js"], server.hostname);

  // Since it all depends on starting at an aligned time, we can't really maintain running processes
  // need to start them all from scratch.
  pkill(ns, "hack-grow.js", server.hostname, target.hostname);
  pkill(ns, "hack-weaken.js", server.hostname, target.hostname);
  pkill(ns, "hack-hack.js", server.hostname, target.hostname);

  ns.exec(
    "hack-hack.js",
    server.hostname,
    parameters.hackThreads,
    target.hostname,
    slot,
    parameters.hackStartTime,
    parameters.cycleTime,
  );
  ns.exec(
    "hack-weaken.js",
    server.hostname,
    parameters.hackWeakenThreads,
    target.hostname,
    slot,
    parameters.hackWeakenStartTime,
    parameters.cycleTime,
  );
  ns.exec(
    "hack-grow.js",
    server.hostname,
    parameters.growThreads,
    target.hostname,
    slot,
    parameters.growStartTime,
    parameters.cycleTime,
  );
  ns.exec(
    "hack-weaken.js",
    server.hostname,
    parameters.growWeakenThreads,
    target.hostname,
    slot,
    parameters.growWeakenStartTime,
    parameters.cycleTime,
  );
}

/** @param {NS} ns */
function maxScriptMemory(ns) {
  let growScriptMemory = ns.getScriptRam("hack-grow.js");
  let weakenScriptMemory = ns.getScriptRam("hack-weaken.js");
  let hackScriptMemory = ns.getScriptRam("hack-hack.js");

  return Math.max(growScriptMemory, weakenScriptMemory, hackScriptMemory);
}
