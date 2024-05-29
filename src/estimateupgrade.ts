import { NS } from "@ns";
import { toMoney } from "lib/money";

export async function main(ns: NS): Promise<void> {
  let servers = ns.getPurchasedServers();

  let ram = ns.args.length == 0 ? 2 * ns.getServerMaxRam(servers[0]) : 2 ** Number(ns.args[0]);

  ns.tprintf("Estimating upgrade of servers to " + ns.formatRam(ram));
  let total = 0;

  servers.forEach((server) => {
    if (ns.getServerMaxRam(server) < ram) {
      const cost = ns.getPurchasedServerUpgradeCost(server, ram);
      total = total + cost;
      ns.tprintf("%s: %s", server, toMoney(cost));
    } else {
      ns.tprintf("%s: $0 (already at expected memory size)", server);
    }
  });

  ns.tprintf("Total: %s", toMoney(total));
}

export async function upgradeServer(ns: NS, server: string, ram: number) {
  ns.tprint("Going to upgrade " + server + " to " + ram + "GB");

  const cost = ns.getPurchasedServerUpgradeCost(server, ram);
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
