/** 
  * Used to align start of scripts around cycles.
  * We'll get passed the start time of the script. 
  * We also get a unique epoch to understand where to align with.
  * We also get an expected cycle time. This is so we can wait again **after**
  * @param {NS} ns 
  */
  
// Time between slots finishing in different servers
const CycleSpacingTime = 3000;

/** @param {NS} ns */
export async function waiter(ns, args, name, callback) {
  const target = args[0];
  const millis = Number(args[1]);
  const cycleTime = Number(args[2]) + 3000;
  const slot = Number(args[3]);
  const hostname = ns.getHostname();

  const logFile = ns.sprintf("%s_%s_%s.txt", target, slot, name);

  const iStartThisManyMillisAfterGlobalCycleStarts = slot * CycleSpacingTime;

  ns.printf("iStartThisManyMillisAfterGlobalCycleStarts: %s", iStartThisManyMillisAfterGlobalCycleStarts)
  ns.write(logFile, ns.sprintf("%s - [%s:%s/%s] - Starting run\n", new Date().toISOString(), hostname, slot, name), "a");

  let cycle = 0;

  // We wait until a couple of seconds before the cycle actually starts. Otherwise things... get weird
  const twoSecsBeforeCycleStarts = cycleTime - (Number(new Date()) % cycleTime) - 2000;
  if (twoSecsBeforeCycleStarts > 0) {
    ns.write(logFile, ns.sprintf("%s - [%s:%s/%s] - Doing an initial wait of %s (%s)\n", new Date().toISOString(), hostname, slot, name, twoSecsBeforeCycleStarts.toFixed(2), ns.tFormat(twoSecsBeforeCycleStarts)), "a");
    await ns.sleep(twoSecsBeforeCycleStarts);
  }

  while (true) {
    let globalCycleStartTimeIn = cycleTime - (Number(new Date()) % cycleTime);
    let millisToWait = globalCycleStartTimeIn + iStartThisManyMillisAfterGlobalCycleStarts + millis;

    const message =  ns.sprintf("%s - [%s:%s/%s/%s] loop start: waiting %s (%s)", new Date().toISOString(), hostname, slot, cycle, name, Math.floor(millisToWait), ns.tFormat(millisToWait));
    ns.print(message)
    ns.write(logFile, message + "\n", "a");
    
    await ns.sleep(millisToWait);
    await callback(ns);
    cycle++;
  }
}