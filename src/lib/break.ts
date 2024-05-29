import { NS } from "@ns";

export function h4ck(ns: NS, target: string) {
  if (!ns.hasRootAccess(target)) {
    ns.fileExists("BruteSSH.exe") && ns.brutessh(target);
    ns.fileExists("FTPCrack.exe") && ns.ftpcrack(target);
    ns.fileExists("HTTPWorm.exe") && ns.httpworm(target);
    ns.fileExists("SQLInject.exe") && ns.sqlinject(target);
    ns.fileExists("relaySMTP.exe") && ns.relaysmtp(target);

    ns.nuke(target);
  }
}
