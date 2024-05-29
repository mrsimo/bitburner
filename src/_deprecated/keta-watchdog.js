import { profitableServer } from "lib/profitable.js"

// Number of times we need to see wrong values for us to think we're out of sync
const Threshold = 200;

/** @param {NS} ns */
export async function main(ns) {
  let ts = ns.args[0];

  const minSecurity = ns.getServerMinSecurityLevel(ts);
  const maxMoney = ns.getServerMaxMoney(ts);

  let notPerfectTimes = 0;
  ns.tprint(ns.sprintf("%s - Watching that %s doesn't get out of sync", new Date().toISOString(), ts));
  while (true) {
    const currentSecurity = ns.getServerSecurityLevel(ts);
    const currentMoney = ns.getServerMoneyAvailable(ts);

    if (currentSecurity == minSecurity && currentMoney == maxMoney) {
      // Server is perfect, at min security and max money. Reset count.
      notPerfectTimes = 0;
    } else {
      notPerfectTimes++;

      if (notPerfectTimes > Threshold) {
        ns.spawn("keta-shutdown.js", 1, ts, "please");
      }
    }
    // Sleep random amount between 100ms and 500ms
    await ns.sleep(100 + (Math.random() * 400))
  }
}