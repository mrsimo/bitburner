import { NS } from "@ns";
import { toMoney } from "lib/money";

export async function main(ns: NS): Promise<void> {
  ns.tprint(ns.getPlayer().karma);
  ns.tprint(ns.getPlayer().numPeopleKilled);

  // const mults = ns.getBitNodeMultipliers();
  // for (const key in mults) {
  //   const value = mults[key];
  //   if (value != 1) {
  //     ns.tprintf("%s: %s", key, Math.round(value * 100) + "%");
  //   }
  // }
}
