import { getKnownServers } from "lib/explore.js"
import { isHackable } from "lib/hackable.js"
import { toMoney } from 'lib/money.js';

/** @param {NS} ns */
export async function main(ns) {
  ns.tprint("Finding most profitable server");

  let { server, amount, level } = await profitableServer(ns);
  ns.tprintf("Most profitable server is %s with %s and %s hack level", server, toMoney(amount), level);

  let myHackLevel = ns.getHackingLevel();
  let topServers = await topProfitableServers(ns, 10, myHackLevel * 0.5);
  ns.tprintf("Most profitable severs:");
  for (let i = 0; i < topServers.length; i++) {
    let server = topServers[i];
    ns.tprintf("%s: %s, %s hack level, %s security level", server.hostname, toMoney(server.maxMoney), server.hackLevel, server.minSecurityLevel);
  }
}

/** @param {NS} ns */
export async function profitableServer(ns) {
  let knownServers = await getKnownServers(ns);
  let myHackLevel = ns.getHackingLevel();
  let candidateServers = [];
  for (var i = 0; i < knownServers.length; i++) {
    let server = knownServers[i];
    if (server != "home" && await isHackable(ns, server, myHackLevel)) {
      candidateServers.push(server);
    }
  }

  let mostProfitableServer = "";
  let maxKnownMoney = 0;
  let chosenServerHackLevel = 0;

  for (var i = 0; i < candidateServers.length; i++) {
    let server = candidateServers[i];

    let serverMaxMoney = ns.getServerMaxMoney(server)
    let serverHackLevel = ns.getServerRequiredHackingLevel(server);

    if (serverHackLevel < (myHackLevel / 2) && serverMaxMoney > maxKnownMoney) {
      mostProfitableServer = server;
      maxKnownMoney = serverMaxMoney;
      chosenServerHackLevel = serverHackLevel;
    }
  }

  return { server: mostProfitableServer, amount: maxKnownMoney, level: chosenServerHackLevel }
}

/** @param {NS} ns */
export async function topProfitableServers(ns, amount, maxHackLevel) {
  let knownServers = await getKnownServers(ns);
  let myHackLevel = ns.getHackingLevel();
  let candidateServers = [];
  for (var i = 0; i < knownServers.length; i++) {
    let server = knownServers[i];
    if (server != "home" && await isHackable(ns, server, myHackLevel) && ns.getServerRequiredHackingLevel(server) <= maxHackLevel) {
      candidateServers.push({
        hostname: server,
        maxMoney: ns.getServerMaxMoney(server),
        hackLevel: ns.getServerRequiredHackingLevel(server),
        minSecurityLevel: ns.getServerMinSecurityLevel(server),
      });
    }
  }

  return candidateServers.sort((a, b) => b.maxMoney - a.maxMoney ).slice(0, amount);
}