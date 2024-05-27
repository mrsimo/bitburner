import { topProfitableServers } from "lib/profitable.js";

/** @param {NS} ns */
export async function main(ns) {
  let myHackLevel = ns.getHackingLevel();
  let topServers = await topProfitableServers(ns, 10, myHackLevel * 0.4);
  
  ns.tprintf("Most profitable severs:");
  for (let i = 0; i < topServers.length; i++) {
    let server = topServers[i];
    ns.tprintf("%s: %s, %s hack level, %s security level", server.hostname, toMoney(server.maxMoney), server.hackLevel, server.minSecurityLevel);
  }
}