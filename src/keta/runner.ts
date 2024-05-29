import { NS } from "@ns";
import Ser from "lib/ser";
import Manager from "lib/manager";

import { getRunnableServers } from "lib/explore";
import { ketaParameters } from "keta/calculations";

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
    const parameters = ketaParameters(ns, target, PadTime);
    const owner = {
      ns: ns,
      home: home,
      servers: getRunnableServers(ns, false).map((server) => new Ser(ns, server)),
    };

    const slots = Math.floor(parameters.cycleTime / SlotTime) - 1; // Just in case
    const manager = new Manager(owner);

    ns.tprintf(
      "[keta] %s: %s primed running %d slots",
      target.hostname,
      target.isPrimed() ? "✔" : "",
      slots,
    );

    for (let i = 0; i < slots; i++) {
      const slotWait = i * SlotTime;
      manager.ensure("keta/k-hack.js", target.isPrimed() ? parameters.hackThreads : 0, false, [
        target.hostname,
        slotWait + parameters.hackStartTime,
      ]);
      manager.ensure("keta/k-weak1.js", parameters.hackWeakenThreads, false, [
        target.hostname,
        slotWait + parameters.hackWeakenStartTime,
      ]);
      manager.ensure("keta/k-grow.js", parameters.growThreads, false, [
        target.hostname,
        slotWait + parameters.growStartTime,
      ]);
      manager.ensure("keta/k-weak2.js", parameters.growWeakenThreads, false, [
        target.hostname,
        slotWait + parameters.growWeakenStartTime,
      ]);

      manager.run();
      await manager.wait();
    }
  }
}
