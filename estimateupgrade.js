import { toMoney } from "lib/money.js";

/** @param {NS} ns */
export async function main(ns) {
  let servers = ns.getPurchasedServers();

  let ram;
  if (ns.args.length == 0) {
    ram = 2 * ns.getServerMaxRam(servers[0]);
  } else {
    level = Number(ns.args[0]);
    ram = 2 ** level;
  }

  ns.tprintf("Estimating upgrade of servers to " + ns.formatRam(ram));
  let total = 0;

  for (var i = 0; i < servers.length; i++) {
    let server = servers[i];

    if (ns.getServerMaxRam(server) < ram) {
      let cost = ns.getPurchasedServerUpgradeCost(server, ram);
      total = total + cost;
      ns.tprintf("%s: %s", server, toMoney(cost));
    } else {
      ns.tprintf("%s: $0 (already at expected memory size)", server);
    }
  }

  ns.tprintf("Total: %s", toMoney(total));
}

/** @param {NS} ns */
export async function upgradeServer(ns, server, ram) {
  ns.tprint("Going to upgrade " + server + " to " + ram + "GB");

  let cost = ns.getPurchasedServerUpgradeCost(server, ram);
  let done = false;
  while (!done) {
    if (ns.getServerMoneyAvailable("home") >= cost) {
      ns.tprint("Upgrading server " + server + " for " + toMoney(cost));
      let result = ns.upgradePurchasedServer(server, ram);

      if (result != "") {
        done = true;
      } else {
        ns.tprint("Error buying server!!")
      }
    }

    await ns.sleep(100);
  }
}