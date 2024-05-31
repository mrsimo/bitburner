import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  const target = String(ns.args[0]);
  const sleep = Number(ns.args[1]);

  await ns.hack(target, { additionalMsec: sleep });
  // ns.tprintf("[%s/%s]: [✔] hack", target, ns.args[2]);
}
