import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.killall("home", true);

  // First thing is we start the LSD.
  ns.run("lsd/runner.js");

  // Wait until hacking level 10 to do anything else
  while (ns.getHackingLevel() < 10) {
    await ns.sleep(1000);
  }

  // Now we should be able to re-target hack to joesnguns
  ns.killall("home", true);
  ns.run("lsd/runner.js");

  // Go back to main init runner to do whatever else it does
  ns.spawn("init/runner.js");
}
