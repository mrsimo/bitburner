import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const serverLimit = ns.getPurchasedServerLimit();
  let serverCurrent = ns.getPurchasedServers().length;

  const ram = Number(ns.args[0]);
  const cost = ns.getPurchasedServerCost(ram);

  while (serverCurrent < serverLimit) {
    const currentMoney = ns.getServerMoneyAvailable("home");

    if (currentMoney >= cost) {
      ns.tprint("I currently have this many servers: " + serverCurrent);
      ns.tprint("I have this money: " + currentMoney);
      ns.tprint("A new server costs: " + cost);
      ns.tprint("Buying a server  for $" + cost);

      const server = ns.purchaseServer("local-" + String(serverCurrent).padStart(2, "0"), ram);

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
