import { NS } from "@ns";
import Ser from "lib/ser";
import { toMoney } from "lib/money";

export async function main(ns: NS): Promise<void> {
  const max = ns.args.length >= 1 ? Number(ns.args[0]) : 3;
  explore(ns, "home", 0, max);
}

function explore(ns: NS, server: string, depth: number, max: number, parent?: string) {
  const ser = new Ser(ns, server);
  const allGood = ser.isPrimed() ? "✔" : " ";

  ns.tprintf(
    "%s ┗ %s [%s] - M: %s/%s | S: %s/%s (+%s) | %s/%s | P: %s",
    "  ".repeat(depth),
    server,
    allGood,
    ns.formatRam(ser.ramUsed),
    ns.formatRam(ser.maxRam),
    Math.round(ser.hackDifficulty || 0),
    Math.round(ser.minDifficulty || 0),
    Math.round((ser.hackDifficulty || 0) - (ser.minDifficulty || 0)),
    toMoney(ser.moneyAvailable || 0),
    toMoney(ser.moneyMax || 0),
    ns.getServerNumPortsRequired(server),
  );

  if (depth < max) {
    ns.scan(server)
      .filter((child) => {
        if (parent) {
          return child != parent && !child.startsWith("local-");
        } else {
          return !child.startsWith("local-");
        }
      })
      .forEach((child) => {
        explore(ns, child, depth + 1, max, server);
      });
  }
}
