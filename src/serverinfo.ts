import { NS } from "@ns";
import { toMoney } from "lib/money.js";

export async function main(ns: NS): Promise<void> {
  const target = String(ns.args[0]);

  ns.tprint("Server: " + target);
  ns.tprint(
    "Security: " + ns.getServerMinSecurityLevel(target) + "/" + ns.getServerSecurityLevel(target),
  );

  const moneyRaw = ns.getServerMoneyAvailable(target);
  const moneyDollars = toMoney(moneyRaw);
  const moneyMaxRaw = ns.getServerMaxMoney(target);
  const moneyMaxDollars = toMoney(moneyMaxRaw);
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

  const server = ns.getServer(target);

  ns.tprintf("Memory: %s/%s ", ns.formatRam(server.ramUsed), ns.formatRam(server.maxRam));
  ns.tprintf("Cores: %s", server.cpuCores);
  ns.tprintf("Hack Level: %s", ns.getServerRequiredHackingLevel(target));
}
