import { getKnownServers, getRunnableServers } from "lib/explore.js"
import { isHackable } from "lib/hackable.js"
import { profitableServer } from "lib/profitable.js"
import { h4ck } from "lib/break.js"

/** @param {NS} ns */
export async function main(ns) {
  let mostProfitableServer;
  if (ns.args.length == 1) {
    mostProfitableServer = ns.args[0];
  } else {
    mostProfitableServer = (await profitableServer(ns)).server;
  }
  ns.tprint("Going to bootstrap against " + mostProfitableServer);

  const runnableServers = await getRunnableServers(ns);

  // First make sure we've broken the servers as far as we can
  for (var i = 0; i < runnableServers.length; i++) {
    await h4ck(ns, runnableServers[i])
  }

  for (var i = 0; i < runnableServers.length; i++) {
    let server = runnableServers[i];

    await boot(ns, server, mostProfitableServer);
  }
}

/** @param {NS} ns */
export async function boot(ns, target, serverToTarget) {
  ns.print("Bootstrapping " + target + ":");

  ns.scp("hack.js", target);

  let processes = ns.ps(target);
  let process = processes[0];

  let nothingRunning = (processes.length == 0);
  let hackRunningWithWrongArgs = (processes.length == 1 && process.filename == "hack.js" && process.args != serverToTarget);

  if (processes.length == 1) {
    ns.tprintf("%s: running %s with %s threads against %s", target.padStart(20), process.filename, process.threads, process.args);
  }

  let availableMemory = ns.getServerMaxRam(target);
  let hackScriptMemory = ns.getScriptRam("hack.js");
  let threads = Math.floor(availableMemory / hackScriptMemory);

  let couldRunWithMoreThreads = (processes.length == 1 && threads > process.threads);

  if (nothingRunning || hackRunningWithWrongArgs || couldRunWithMoreThreads) {
    ns.tprintf("%s: not running anything, or running against wrong server. (Re)Starting hack.js", target.padStart(20));
    ns.killall(target);

    if (threads >= 1) {
      ns.exec(
        "hack.js",
        target,
        threads,
        serverToTarget
      );
    } else {
      ns.tprintf("%s: skipping, doesn't seem to be able to run hack.js", target.padStart(20));
    }
  }
}