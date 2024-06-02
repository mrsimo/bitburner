import { NS } from "@ns";
import { toMoney } from "lib/money";

export async function main(ns: NS): Promise<void> {
  ns.tprint(ns.getPlayer().karma);
}
