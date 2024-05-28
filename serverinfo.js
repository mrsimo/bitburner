import { toMoney } from "lib/money.js";

/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];

  ns.tprint("Server: " + target);
  ns.tprint(
    "Security: " + ns.getServerMinSecurityLevel(target) + "/" + ns.getServerSecurityLevel(target),
  );

  let moneyRaw = ns.getServerMoneyAvailable(target);
  let moneyDollars = toMoney(moneyRaw);
  let moneyMaxRaw = ns.getServerMaxMoney(target);
  let moneyMaxDollars = toMoney(moneyMaxRaw);
  if (ns.getServerMaxMoney(target) != 0) {
    ns.tprint(
      "Money: " +
        moneyDollars +
        " / " +
        moneyMaxDollars +
        " (" +
        Math.floor((moneyRaw / moneyMaxRaw) * 100) +
        "%)",
    );
  } else {
    ns.tprint("Money: " + moneyDollars);
  }

  let server = ns.getServer(target);

  ns.tprintf("Memory: %s/%s ", ns.formatRam(server.ramUsed), ns.formatRam(server.maxRam));
  ns.tprintf("Cores: %s", server.cpuCores);
  ns.tprintf("Hack Level: %s", ns.getServerRequiredHackingLevel(target));
}
