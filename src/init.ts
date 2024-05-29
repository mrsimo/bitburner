import { NS } from "@ns";
import { getRunnableServers } from "lib/explore";
import { h4ck } from "lib/break";

export async function main(ns: NS): Promise<void> {
  // First thing is we start the lsd-hack.js.
  ns.run("lsd/runner.js");

  // Wait until hacking level 10 to do anything else
  while (ns.getHackingLevel() < 10) {
    await ns.sleep(1000);
  }

  // First make sure we've broken the servers as far as we can
  getRunnableServers(ns).forEach((server) => {
    h4ck(ns, server);
    ns.killall(server);
  });

  // Now we should be able to re-target hack to joesnguns
  ns.killall("home", true);
  ns.run("lsd/runner.js");

  await ns.prompt("Now you should go buy Tor and a few programs. Do you want to continue?");

  ns.tprint("Now go run wild, my precious");
}
