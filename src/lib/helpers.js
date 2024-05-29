/** @param {NS} ns */
export function maxScriptMemory(ns) {
  let growScriptMemory = ns.getScriptRam("hack-grow.js");
  let weakenScriptMemory = ns.getScriptRam("hack-weaken.js");
  let hackScriptMemory = ns.getScriptRam("hack-hack.js");

  return Math.max(growScriptMemory, weakenScriptMemory, hackScriptMemory);
}
