import { getRunnableServers } from "lib/explore.js";
import Manager from "lib/manager.js";
import Ser from "lib/ser.js";
import { ketaParameters } from "lib/keta.js";

/** @param {NS} ns */
export async function main(ns) {
  const target = new Ser(ns, ns.args[0]);
  const home = new Ser(ns, "home");

  while (true) {
    let parameters = ketaParameters(target);

    const owner = {
      ns: ns,
      home: home,
      servers: getRunnableServers(ns, false).map((server) => new Ser(ns, server)),
    };

    const manager = new Manager(ns, owner);
    manager.ensure("keta/k-hack.js", target.isPrimed() ? parameters.hackThreads : 0, false, [
      target.hostname,
      parameters.hackStartTime,
    ]);
    manager.ensure("keta/k-weak1.js", parameters.hackWeakenThreads, false, [
      target.hostname,
      parameters.hackWeakenStartTime,
    ]);
    manager.ensure("keta/k-grow.js", parameters.growThreads, false, [
      target.hostname,
      parameters.growStartTime,
    ]);
    manager.ensure("keta/k-weak2.js", parameters.growWeakenThreads, false, [
      target.hostname,
      parameters.growWeakenStartTime,
    ]);

    manager.run();
    await manager.wait();
  }
}
