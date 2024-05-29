import { NS } from '@ns'
import Ser from 'lib/ser'
import Manager from 'lib/manager'

// How long we want to give the scripts to land.
const SlotTime = 2000;

// Time between scripts landing.
// Hack => Weaken =>   Grow => Weaken =>   Hack ...
//  0ms =>  500ms => 1000ms => 1500ms => 2000ms ...
const PadTime = SlotTime / 4;

export async function main(ns: NS): Promise<void> {
  const target = new Ser(ns, String(ns.args[0]));
  const home = new Ser(ns, "home");

  while (true) {
    const parameters = ketaParameters(target);
    const owner = {
      ns: ns,
      home: home,
      servers: getRunnableServers(ns, false).map((server) => new Ser(ns, server)),
    }

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
