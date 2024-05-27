/** @param {NS} ns */
export async function main(ns) {
  ns.exec("hack-grow.js", "local-0", 30000, "omega-net");
  ns.exec("hack-weaken.js", "local-1", 30000, "omega-net");
  

}