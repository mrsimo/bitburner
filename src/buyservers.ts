import { NS } from "@ns";
import { toMoney } from "/lib/money";

export async function main(ns: NS): Promise<void> {
  const serverLimit = ns.getPurchasedServerLimit();
  let serverCurrent = ns.getPurchasedServers().length;

  const ram = Number(ns.args[0]);
  const cost = ns.getPurchasedServerCost(ram);

  while (serverCurrent < serverLimit) {
    const currentMoney = ns.getServerMoneyAvailable("home");

    if (currentMoney >= cost) {
      const server = ns.purchaseServer("local-" + String(serverCurrent).padStart(2, "0"), ram);
      ns.tprintf("[buyservers] Buying %s for %s", server, toMoney(cost));

      if (server != "") {
        serverCurrent++;
      } else {
        ns.tprint("Error buying server!!");
      }
    } else {
      await ns.sleep(100);
    }
  }
}
