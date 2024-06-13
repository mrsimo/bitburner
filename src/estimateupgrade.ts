import { NS } from "@ns";
import { toMoney } from "lib/money";

export async function main(ns: NS): Promise<void> {
  let servers = ns.getPurchasedServers();
  const ram = 2 * Math.min(...servers.map((server) => ns.getServerMaxRam(server)));

  ns.tprintf("Estimating upgrade of servers to " + ns.formatRam(ram));
  const costs = servers.map((server) => Math.max(0, ns.getPurchasedServerUpgradeCost(server, ram)));
  ns.tprintf("Costs: %s", costs.map((cost) => toMoney(cost)).join(", "));
  ns.tprintf("Total: %s", toMoney(costs.reduce((a, b) => a + b, 0)));
}
