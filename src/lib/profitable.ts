import { NS, Server } from "@ns";

import { getKnownServers } from "lib/explore";
import { isHackable } from "lib/hackable";
import { toMoney } from "lib/money.js";

export const HackingLevel = 0.4;

export async function main(ns: NS): Promise<void> {
  const topServers = topProfitableServers(ns, 15, ns.getHackingLevel() * HackingLevel);
  ns.tprintf("Most profitable severs:");
  topServers.forEach((server) =>
    ns.tprintf(
      "%s: %s, %s hack level, %s/%s security level",
      server.hostname,
      toMoney(Number(server.moneyMax)),
      Math.round(server.requiredHackingSkill || 0),
      server.hackDifficulty?.toFixed(1),
      server.minDifficulty?.toFixed(1),
    ),
  );
}

export function profitableServer(ns: NS): Server {
  return topProfitableServers(ns, 1, ns.getHackingLevel() * HackingLevel)[0] || "foodnstuff";
}

/** @param {NS} ns */
export function topProfitableServers(ns: NS, amount: number, maxHackLevel: number): Server[] {
  const knownHostnames = getKnownServers(ns);
  const myHackLevel = ns.getHackingLevel();

  return knownHostnames
    .filter(
      (hostname) =>
        hostname != "home" &&
        isHackable(ns, hostname) &&
        ns.getServerRequiredHackingLevel(hostname) <= maxHackLevel,
    )
    .map((hostname) => ns.getServer(hostname))
    .sort((a, b) => Number(b.moneyMax) - Number(a.moneyMax))
    .slice(0, amount);
}
