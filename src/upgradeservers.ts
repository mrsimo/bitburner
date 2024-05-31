import { NS } from "@ns";
import { toMoney } from "lib/money.js";

export async function main(ns: NS): Promise<void> {
  const servers = ns.getPurchasedServers();
  const ram = 2 * ns.getServerMaxRam(servers[0]);

  ns.tprintf("Upgrading servers to " + ns.formatRam(ram));

  for (var i = 0; i < servers.length; i++) {
    let server = servers[i];

    if (ns.getServerMaxRam(server) < ram) {
      await upgradeServer(ns, server, ram);
    } else {
      ns.tprint(server + " already at expected memory size.");
    }
  }

  if (ns.args.length >= 1 && String(ns.args[0]) == "please") {
    ns.spawn("upgradeservers.js");
  }
}

/** @param {NS} ns */
export async function upgradeServer(ns: NS, server: string, ram: number) {
  ns.tprint("Going to upgrade " + server + " to " + ram + "GB");

  let cost = ns.getPurchasedServerUpgradeCost(server, ram);
  while (true) {
    if (ns.getServerMoneyAvailable("home") >= cost) {
      ns.tprint("Upgrading server " + server + " for " + toMoney(cost));
      ns.upgradePurchasedServer(server, ram);
      break;
    } else {
      await ns.sleep(100);
    }
  }
}
