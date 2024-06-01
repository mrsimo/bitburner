import { toMoney } from "/lib/money";

/** @param {NS} ns */
export async function main(ns: NS): Promise<void> {
  ns.disableLog("getServerMinSecurityLevel");
  ns.disableLog("getServerSecurityLevel");
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("getServerMaxMoney");
  ns.disableLog("sleep");
  ns.clearLog();

  ns.resizeTail(1200, 60);
  ns.moveTail(300, 0);

  let target = String(ns.args[0]);

  let toTerminal = false;
  if (ns.args.length > 1 && ns.args[1] == "please") {
    toTerminal = true;
  }

  let prevSecurity = 0;
  let prevMoney = 0;

  const minSecurity = ns.getServerMinSecurityLevel(target);
  const maxMoney = ns.getServerMaxMoney(target);

  while (true) {
    const currentSecurity = ns.getServerSecurityLevel(target);
    const currentMoney = ns.getServerMoneyAvailable(target);

    if (currentSecurity != prevSecurity || currentMoney != prevMoney) {
      prevSecurity = currentSecurity;
      prevMoney = currentMoney;

      let allGood;
      if (currentSecurity == minSecurity && currentMoney == maxMoney) {
        allGood = "✔";
      } else {
        allGood = " ";
      }

      let printFunc = toTerminal ? ns.tprintf : ns.printf;
      printFunc(
        "%s - %s [%s] - Security: %s/%s (+%s), Money: %s/%s (%s)",
        new Date().toISOString(),
        target,
        allGood,
        currentSecurity.toFixed(2),
        minSecurity.toFixed(2),
        (currentSecurity - minSecurity).toFixed(2),
        toMoney(currentMoney),
        toMoney(maxMoney),
        ((currentMoney / maxMoney) * 100).toFixed(2) + "%",
      );
    }

    await ns.sleep(100);
  }
}
