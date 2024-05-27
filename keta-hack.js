import { getRunnableServers } from "lib/explore.js";
import { profitableServer } from "lib/profitable.js";
import { h4ck } from "lib/break.js";
import { pkill } from "lib/kill.js";

// Tweak to spread a script finish times more or less.
const PadTime = 300;

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
    ns.tprintf("Target server isn't at minimum security and maximum money yet. Running the hackiest fixer");
    
    await h4ck(ns, target.hostname);

    let availableMemory = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 32; // use all but 32GB

    ns.run("hack-grow.js", Math.floor(availableMemory / 2 / ns.getScriptRam("hack-grow.js")), target.hostname);
    ns.run("hack-weaken.js", Math.floor(availableMemory / 2 / ns.getScriptRam("hack-weaken.js")), target.hostname);

    ns.tprint("Waiting until server is primed");

    while (true) {
      await ns.sleep(200);

      let updatedTarget = ns.getServer(target.hostname)
      if (updatedTarget.moneyMax == updatedTarget.moneyAvailable && updatedTarget.minDifficulty == updatedTarget.hackDifficulty) {
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
    await h4ck(ns, runnableServers[i])
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
      let necessaryThreads = parameters.growThreads + parameters.hackThreads + parameters.growWeakenThreads + parameters.hackWeakenThreads;

      if (necessaryThreads > maxThreads) {
        break;
      } else {
        lastParametersFound = parameters;
      }
    }

    if (lastParametersFound.percent > 0) {
      ns.printf("%s: supports running hack for %s percent", server.hostname, lastParametersFound.percent);
      await boot(ns, server, lastParametersFound, target, slot);
      slot++;
    } else {
      ns.printf("%s: skipping, can't support the minimum hack flow", server.hostname);
    }
  }

  const weakenTime = ns.formulas.hacking.weakenTime(target, player);
  ns.tprint(ns.sprintf("%s - %s: I've booted %s slots in a cycle that lasts %s", new Date().toISOString(), ts, slot + 1, ns.tFormat(weakenTime + 2000)));

  // I was told to start the watchdog process. clean-shutdown.
  if (watchdog) {
    ns.spawn("keta-watchdog.js", 1, ts, "please");
  }
}

/** @param {NS} ns */
function parametersForPercent(ns, percent, player, target) {
  // Get times for each of these. These only depend on target server and
  // player hack skill. Doesn't depend on the server that we run the hacks from.
  const hackTime = ns.formulas.hacking.hackTime(target, player);
  const growTime = ns.formulas.hacking.growTime(target, player);
  const weakenTime = ns.formulas.hacking.weakenTime(target, player);

  if (weakenTime < growTime || weakenTime < hackTime)
    ns.tprint("Weaken time isn't the slowest... this script won't work") && ns.exit();

  //                    |= hack ====================|
  // |=weaken 1======================================|
  //                |= grow ==========================|
  //   |=weaken 2======================================|

  // These should be the sleeps necessary for scripts to start at the right time.
  // Tweak padTime to spread them out some more.
  // They start at "0", so scripts will have to sleep some additional time based on batch go time.
  const hackStartTime = weakenTime - hackTime - PadTime;
  const hackWeakenStartTime = 0;
  const growStartTime = weakenTime - growTime + PadTime;
  const growWeakenStartTime = PadTime * 2;

  // This is how much % a single thread will steal from the server.
  const hackPercent = ns.formulas.hacking.hackPercent(target, player);

  // Threads necessary to steal at most N% of the money
  const hackThreads = Math.floor((percent / 100) / hackPercent);

  // Actual percent hacked with that many threads (not exactly 50%)
  const percentHacked = hackPercent * hackThreads;

  // Use this to calculate how many threads to use to return money to 100%
  let serverBeforeGrow = { ...target };
  serverBeforeGrow.moneyAvailable = target.moneyMax - (target.moneyMax * percentHacked);
  const growThreads = Math.ceil(
    ns.formulas.hacking.growThreads(serverBeforeGrow, player, target.moneyMax) * 1.2
  );

  // From the hack() docs:
  // A successful `hack()` on a server will raise that server’s security level by 0.002.
  const hackSecurityIncreasePerThread = 0.002;
  // Had to look this up in the source code...
  const growSecurityIncreasePerThread = 0.004;

  let hackSecurityIncrease = hackThreads * hackSecurityIncreasePerThread;
  let growSecurityIncrease = growThreads * growSecurityIncreasePerThread;

  // This is documented in the weaken() method.
  const weakenPerThread = 0.05;
  const hackWeakenThreads = Math.ceil((hackSecurityIncrease / weakenPerThread) * 1.2);
  const growWeakenThreads = Math.ceil((growSecurityIncrease / weakenPerThread) * 1.2);

  // Assume a cycle will last the weakenTime (known slowest).
  const cycleTime = weakenTime;

  return {
    hackThreads,
    hackWeakenThreads,
    growThreads,
    growWeakenThreads,
    hackStartTime,
    hackWeakenStartTime,
    growStartTime,
    growWeakenStartTime,
    cycleTime,
    percent,
  }
}

/** @param {NS} ns */
async function boot(ns, server, parameters, target, slot) {
  ns.printf("[%s] %s: booting processes", slot, server.hostname)

  // Shut down previous version of hack if running and copy new hacks
  ns.scriptKill("hack.js", server.hostname);
  ns.rm("hack.js", server.hostname);
  ns.scp(["hack-grow.js", "hack-weaken.js", "hack-hack.js", "lib/wait.js"], server.hostname);

  // Since it all depends on starting at an aligned time, we can't really maintain running processes
  // need to start them all from scratch.
  pkill(ns, "hack-grow.js", server.hostname, target.hostname);
  pkill(ns, "hack-weaken.js", server.hostname, target.hostname);
  pkill(ns, "hack-hack.js", server.hostname, target.hostname);

  ns.exec("hack-hack.js", server.hostname, parameters.hackThreads, target.hostname, parameters.hackStartTime, parameters.cycleTime, slot);
  ns.exec("hack-weaken.js", server.hostname, parameters.hackWeakenThreads, target.hostname, parameters.hackWeakenStartTime, parameters.cycleTime, slot);
  ns.exec("hack-grow.js", server.hostname, parameters.growThreads, target.hostname, parameters.growStartTime, parameters.cycleTime, slot);
  ns.exec("hack-weaken.js", server.hostname, parameters.growWeakenThreads, target.hostname, parameters.growWeakenStartTime, parameters.cycleTime, slot);
}

/** @param {NS} ns */
function maxScriptMemory(ns) {
  let growScriptMemory = ns.getScriptRam("hack-grow.js");
  let weakenScriptMemory = ns.getScriptRam("hack-weaken.js");
  let hackScriptMemory = ns.getScriptRam("hack-hack.js");

  return Math.max(growScriptMemory, weakenScriptMemory, hackScriptMemory);
}