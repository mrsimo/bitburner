import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  while (true) {
    await ns.sleep(1000 * 1800); // 30 minutes
    ns.run("lsd/runner.js");
    if (ns.getPurchasedServers().length == ns.getPurchasedServerLimit()) {
      if (!ns.scriptRunning("upgradeservers.js", "home")) {
        ns.run("upgradeservers.js");
      }
    }
  }
}
