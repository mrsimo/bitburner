/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];
  const sleep = Number(ns.args[1]);

  await ns.sleep(sleep);
  await ns.hack(target);
}
