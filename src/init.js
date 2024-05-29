import { getRunnableServers } from "lib/explore.js";
import { h4ck } from "lib/break.js";

/** @param {NS} ns */
export async function main(ns) {
  // First thing is we start the lsd-hack.js.
  ns.run("lsd-hack.js");

  // Wait until hacking level 10 to do anything else
  while (ns.getHackingLevel() < 10) {
    await ns.sleep(1000);
  }

  let runnableServers = await getRunnableServers(ns);

  // First make sure we've broken the servers as far as we can
  for (var i = 0; i < runnableServers.length; i++) {
    await h4ck(ns, runnableServers[i]);
    ns.killall(runnableServers[i]);
  }

  // Now we should be able to re-target hack to joesnguns
  ns.killall("home", true);
  ns.run("lsd-hack.js");

  await ns.prompt("Now you should go buy Tor and a few programs. Do you want to continue?");

  ns.tprint("Now go run wild, my precious");
}
