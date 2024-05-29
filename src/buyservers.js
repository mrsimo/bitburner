/** @param {NS} ns */
export async function main(ns) {
  let serverLimit = ns.getPurchasedServerLimit();
  let serverCurrent = ns.getPurchasedServers().length;

  let ram = Number(ns.args[0]);
  let cost = ns.getPurchasedServerCost(ram);

  let hackScriptMemory = ns.getScriptRam("hack.js");

  while (serverCurrent < serverLimit) {
    let currentMoney = ns.getServerMoneyAvailable("home");
    ns.tprint("I currently have this many servers: " + serverCurrent);
    ns.tprint("I have this money: " + currentMoney);
    ns.tprint("A new server costs: " + cost);
    if (currentMoney >= cost) {
      ns.tprint("Buying a server  for $" + cost);
      let server = ns.purchaseServer("local-" + serverCurrent, ram);

      if (server != "") {
        serverCurrent++;
      } else {
        ns.tprint("Error buying server!!")
      }
    }

    await ns.sleep(200);
  }
}