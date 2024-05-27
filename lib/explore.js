import { isHackable } from 'lib/hackable.js';
import { h4ck } from "lib/break.js";

/** @param {NS} ns */
export function main(ns) {
  let servers = getKnownServers(ns);

  ns.tprintf("Found %s servers:", servers.length);

  servers.forEach((server) => {
    ns.tprintf("* %s", server)
  });
}

/** @param {NS} ns */
export function getKnownServers(ns) {
  let knownServers = ["home"];
  explore(ns, "home", knownServers);
  return knownServers.sort();
}

/** @param {NS} ns */
export function getRunnableServers(ns) {
  let knownServers = getKnownServers(ns);

  let runnableServers = [];
  for (var i = 0; i < knownServers.length; i++) {
    let server = knownServers[i];
    if (ns.getServerMaxRam(server) > 0 && (ns.hasRootAccess(server) || isHackable(ns, server))) {
      h4ck(ns, server);
      runnableServers.push(server);
    }
  }

  return runnableServers.sort();
}

/**
 * @param {NS} ns
 * */
function explore(ns, server, knownServers) {
  let reachableServers = ns.scan(server);

  for (var i = 0; i < reachableServers.length; i++) {
    let candidate = reachableServers[i];

    if (knownServers.indexOf(candidate) == -1) {
      knownServers.push(candidate);
      explore(ns, candidate, knownServers);
    }
  }
}
