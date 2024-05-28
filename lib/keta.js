// Tweak to spread a script finish times more or less.
const PadTime = 300;

/**
 * @param {NS} ns
 * @param {Ser} target
 * @returns parameters for the keta hack scripts
 */
export function ketaParameters(ns, target) {
  const player = ns.getPlayer();

  return parametersForPercent(ns, 100, player, target.server);
}

/** @param {NS} ns */
export function parametersForPercent(ns, percent, player, target) {
  // We should do all the calculations against a primed server. Otherwise we
  // might be running it against a server that is halfway through being hacked
  // and the numbers will keep changing.
  let serverPrimed = { ...target };
  serverPrimed.moneyAvailable = target.moneyMax;
  serverPrimed.hackDifficulty = target.minDifficulty;

  // Get times for each of these. These only depend on target server and
  // player hack skill. Doesn't depend on the server that we run the hacks from.
  const hackTime = ns.formulas.hacking.hackTime(serverPrimed, player);
  const growTime = ns.formulas.hacking.growTime(serverPrimed, player);
  const weakenTime = ns.formulas.hacking.weakenTime(serverPrimed, player);

  if (weakenTime < growTime || weakenTime < hackTime)
    ns.tprint("Weaken time isn't the slowest... this script won't work") && ns.exit();

  //                    |= hack ====================|
  // |=weaken 1======================================|
  //                |= grow ==========================|
  //   |=weaken 2======================================|

  // These should be the sleeps necessary for scripts to start at the right time.
  // Tweak padTime to spread them out some more.
  const hackStartTime = weakenTime - hackTime - PadTime;
  const hackWeakenStartTime = 0;
  const growStartTime = weakenTime - growTime + PadTime;
  const growWeakenStartTime = PadTime * 2;

  // This is how much % a single thread will steal from the server.
  const hackPercent = ns.formulas.hacking.hackPercent(serverPrimed, player);

  // Threads necessary to steal at most N% of the money
  const hackThreads = Math.floor(percent / 100 / hackPercent);

  // Actual percent hacked with that many threads (not exactly 50%)
  const percentHacked = hackPercent * hackThreads;

  // Use this to calculate how many threads to use to return money to 100%
  // The growThreads method depends on a Server object, so we modify the current
  // one to the supposed status.
  let serverBeforeGrow = { ...target };
  serverBeforeGrow.moneyAvailable = target.moneyMax - target.moneyMax * percentHacked;

  // We add 10% more threads... just in case. But shouldn't be necessary. It's mostly
  // in case it helps the period last a bit longer when user increaes Hacking skill.
  const growThreads = Math.ceil(
    ns.formulas.hacking.growThreads(serverBeforeGrow, player, target.moneyMax),
  );

  // From the hack() docs:
  // A successful `hack()` on a server will raise that server’s security level by 0.002.
  const hackSecurityIncreasePerThread = 0.002;
  // Had to look this up in the source code...
  const growSecurityIncreasePerThread = 0.004;

  let hackSecurityIncrease = hackThreads * hackSecurityIncreasePerThread;
  let growSecurityIncrease = growThreads * growSecurityIncreasePerThread;

  // This is documented in the weaken() method.
  const weakenPerThread = 0.05;
  const hackWeakenThreads = Math.ceil(hackSecurityIncrease / weakenPerThread);
  const growWeakenThreads = Math.ceil(growSecurityIncrease / weakenPerThread);

  // Assume a cycle will last the weakenTime (known slowest).
  // We round it up to the closest second.
  const cycleTime = weakenTime;

  const memoryPerSlot =
    ns.getScriptRam("hack-hack.js") * hackThreads +
    ns.getScriptRam("hack-weak1.js") * hackWeakenThreads +
    ns.getScriptRam("hack-grow.js") * growThreads +
    ns.getScriptRam("hack-weak2.js") * growWeakenThreads;

  return {
    hackThreads,
    hackWeakenThreads,
    growThreads,
    growWeakenThreads,
    hackStartTime,
    hackWeakenStartTime,
    growStartTime,
    growWeakenStartTime,
    cycleTime,
    percent,
    memoryPerSlot,
  };
}
