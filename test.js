import { getRunnableServers } from "lib/explore.js"
import { h4ck } from "lib/break.js"

/** @param {NS} ns */
export async function main(ns) {
  let runnableServers = await getRunnableServers(ns);

  // First make sure we've broken the servers as far as we can
  for (var i = 0; i < runnableServers.length; i++) {
    await h4ck(ns, runnableServers[i]);
    ns.killall(runnableServers[i]);
  }
}