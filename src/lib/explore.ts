import { NS } from "@ns";
import { isHackable } from "/lib/hackable.js";
import { h4ck } from "/lib/break";

export async function main(ns: NS): Promise<void> {
  let servers = getKnownServers(ns);

  ns.tprintf("Found %s servers:", servers.length);

  servers.forEach((server) => {
    ns.tprintf("* %s", server);
  });
}

export function getKnownServers(ns: NS): string[] {
  let knownServers = ["home"];
  explore(ns, "home", knownServers);
  return knownServers.sort();
}

export function getRunnableServers(ns: NS, home = true): string[] {
  let knownServers = getKnownServers(ns);

  let runnableServers = [];
  for (var i = 0; i < knownServers.length; i++) {
    let server = knownServers[i];
    if (ns.getServerMaxRam(server) > 0 && (ns.hasRootAccess(server) || isHackable(ns, server))) {
      h4ck(ns, server);
      runnableServers.push(server);
    }
  }

  runnableServers = runnableServers.sort();
  if (home) {
    return runnableServers;
  } else {
    return runnableServers.filter((server) => server != "home");
  }
}

function explore(ns: NS, server: string, knownServers: string[]) {
  let reachableServers = ns.scan(server);

  for (var i = 0; i < reachableServers.length; i++) {
    let candidate = reachableServers[i];

    if (knownServers.indexOf(candidate) == -1) {
      knownServers.push(candidate);
      explore(ns, candidate, knownServers);
    }
  }
}
