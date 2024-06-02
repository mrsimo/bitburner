import { NS } from "@ns";
import { toMoney } from "lib/money.js";

export async function main(ns: NS): Promise<void> {
  while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
    await ns.sleep(60000);
  }
  const servers = ns.getPurchasedServers();
  const ram = 2 * servers.map((server) => ns.getServerMaxRam(server)).sort()[0];

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
  } else if (ns.args.length >= 1 && String(ns.args[0]) == "better") {
    ns.spawn("upgradeservers.js", 1, "better");
  }
}

/** @param {NS} ns */
export async function upgradeServer(ns: NS, server: string, ram: number) {
  let cost = ns.getPurchasedServerUpgradeCost(server, ram);
  ns.tprintf("Going to upgrade %s to %s for %s", server, ns.formatRam(ram), toMoney(cost));

  while (true) {
    if (ns.getServerMoneyAvailable("home") >= cost) {
      ns.tprintf("Upgrading %s to %s for %s", server, ns.formatRam(ram), toMoney(cost));
      ns.upgradePurchasedServer(server, ram);
      break;
    } else {
      await ns.sleep(100);
    }
  }
}
