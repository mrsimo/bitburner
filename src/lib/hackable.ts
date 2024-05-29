import { NS } from "@ns";

export function isHackable(ns: NS, target: string): boolean {
  let enoughHackLevel = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target);

  let portsPotential = 0;

  if (ns.fileExists("BruteSSH.exe")) {
    portsPotential++;
  }
  if (ns.fileExists("FTPCrack.exe")) {
    portsPotential++;
  }
  if (ns.fileExists("HTTPWorm.exe")) {
    portsPotential++;
  }
  if (ns.fileExists("SQLInject.exe")) {
    portsPotential++;
  }
  if (ns.fileExists("relaySMTP.exe")) {
    portsPotential++;
  }

  let enoughPortsPotential = ns.getServerNumPortsRequired(target) <= portsPotential;

  return enoughHackLevel && enoughPortsPotential;
}
