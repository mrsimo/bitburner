import { NS } from "@ns";
import { toMoney } from "lib/money.js";

export async function main(ns: NS): Promise<void> {
  while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
    await ns.sleep(60000);
  }

  const options = ns.flags([
    ["brief", false],
    ["continuous", false],
    ["twice", false],
  ]);
  const servers = ns.getPurchasedServers();
  const ram = 2 * Math.min(...servers.map((server) => ns.getServerMaxRam(server)));

  ns.tprintf("Upgrading servers to " + ns.formatRam(ram));

  for (var i = 0; i < servers.length; i++) {
    let server = servers[i];

    if (ns.getServerMaxRam(server) < ram) {
      await upgradeServer(ns, server, ram, Boolean(options.brief));
    } else {
      if (!options.brief) ns.tprint(server + " already at expected memory size.");
    }
  }

  if (options.twice) {
    ns.spawn("upgradeservers.js");
  } else if (options.continuous) {
    ns.spawn("upgradeservers.js", 1, "--continuous=true");
  }
}

/** @param {NS} ns */
export async function upgradeServer(ns: NS, server: string, ram: number, brief: boolean) {
  let cost = ns.getPurchasedServerUpgradeCost(server, ram);
  while (true) {
    if (ns.getServerMoneyAvailable("home") >= cost) {
      if (!brief) ns.tprintf("Upgrading %s to %s for %s", server, ns.formatRam(ram), toMoney(cost));
      ns.upgradePurchasedServer(server, ram);
      break;
    } else {
      await ns.sleep(100);
    }
  }
}
