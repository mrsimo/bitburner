/** @param {NS} ns */
export function isHackable(ns, target) {
  let enoughHackLevel = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target);

  let portsPotential = 0;

  if (ns.fileExists("BruteSSH.exe")) { portsPotential++; }
  if (ns.fileExists("FTPCrack.exe")) { portsPotential++; }
  if (ns.fileExists("HTTPWorm.exe")) { portsPotential++; }
  if (ns.fileExists("SQLInject.exe")) { portsPotential++; }
  if (ns.fileExists("relaySMTP.exe")) { portsPotential++; }

  let enoughPortsPotential = ns.getServerNumPortsRequired(target) <= portsPotential;

  return enoughHackLevel && enoughPortsPotential;
}
