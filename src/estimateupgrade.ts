import { NS } from "@ns";
import { toMoney } from "lib/money";

export async function main(ns: NS): Promise<void> {
  let servers = ns.getPurchasedServers();
  let ram = 2 * ns.getServerMaxRam(servers[0]);

  ns.tprintf("Estimating upgrade of servers to " + ns.formatRam(ram));
  const costs = servers.map((server) => ns.getPurchasedServerUpgradeCost(server, ram));
  ns.tprintf("Costs: %s", costs.map((cost) => toMoney(cost)).join(", "));
  ns.tprintf("Total: %s", toMoney(costs.reduce((a, b) => a + b, 0)));
}
