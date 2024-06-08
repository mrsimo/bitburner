import { NS } from "@ns";
import { h4ck } from "lib/break";

export async function main(ns: NS): Promise<void> {
  const hostname = String(ns.args[0]);
  // h4ck(ns, hostname);

  let path: string[] = [];
  let knownServers = ["home"];

  if (connectExplore(ns, "home", hostname, knownServers, path)) {
    ns.tprint(path);
    path.forEach((server) => ns.singularity.connect(server));
  }
}

function connectExplore(
  ns: NS,
  server: string,
  target: string,
  knownServers: string[],
  path: string[],
): boolean {
  let reachableServers = ns.scan(server);
  path.push(server);
  if (server == target) {
    return true;
  }

  for (var i = 0; i < reachableServers.length; i++) {
    let candidate = reachableServers[i];
    if (!knownServers.includes(candidate)) {
      knownServers.push(candidate);
      if (connectExplore(ns, candidate, target, knownServers, path)) {
        return true;
      }
    }
  }

  path.pop();
  return false;
}
