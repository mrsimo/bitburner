import { getRunnableServers } from "lib/explore.js"
import { profitableServer } from "lib/profitable.js"
import { pkill } from "lib/kill.js";

/** @param {NS} ns */
export async function main(ns) {
  let ts = ns.args.length >= 1 ? ns.args[0] : (await profitableServer(ns)).server;
  let restart = ns.args.length >= 2 ? ns.args[1] == "please" : false;
  
  const runnableServers = await getRunnableServers(ns);

  ns.printf("Doing a clean shutdown");

  // Shut down all hack scripts
  for (var i = 0; i < runnableServers.length; i++) {
    pkill(ns, "hack-hack.js", runnableServers[i], ts);
  }

  ns.printf("Killed all hacks");

  ns.printf("Waiting for %s to have full money", ts);
  while (ns.getServerMoneyAvailable(ts) < ns.getServerMaxMoney(ts)) {
    await ns.sleep(1000);
  }

  // Shut down all grow scripts
  for (var i = 0; i < runnableServers.length; i++) {
    pkill(ns, "hack-grow.js", runnableServers[i], ts);
  }

  ns.printf("Killed all grows");

  ns.printf("Waiting for %s to have minimum security", ts);
  while (ns.getServerSecurityLevel(ts) > ns.getServerMinSecurityLevel(ts)) {
    await ns.sleep(1000);
  }

  // Shut down all grow scripts
  for (var i = 0; i < runnableServers.length; i++) {
    pkill(ns, "hack-weaken.js", runnableServers[i], ts);
  }

  ns.printf("Killed all weakens");

  // I was told to start the process again. Likely by the watchdog.
  if (restart) {
    ns.spawn("keta-hack.js", 1, ts, "please")
  }
}
