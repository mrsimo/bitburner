import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  let target = String(ns.args[0]);

  while (true) {
    await ns.grow(target);
  }
}
