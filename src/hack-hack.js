import { waiter } from "lib/wait.js";

/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];

  if (ns.args.length >= 2) {
    await waiter(
      ns, ns.args, "hack",
      async function (ns) { await ns.hack(target) }
    );
  } else {
    while (true) {
      await ns.hack(target);
    }
  }
}
