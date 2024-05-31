import { NS } from "@ns";
import Ser from "lib/ser";
import Manager from "lib/manager";

import { getRunnableServers } from "lib/explore";
import { parametersForPercent, KetaParameters } from "keta/calculations";

// How long we want to give the scripts to land.
const SlotTime = 2000;

// Time between scripts landing.
// Hack => Weaken =>   Grow => Weaken =>   Hack ...
//  0ms =>  500ms => 1000ms => 1500ms => 2000ms ...
const PadTime = SlotTime / 4;

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  const target = new Ser(ns, String(ns.args[0]));
  const home = new Ser(ns, "home");

  // Kill all lsd scripts that might be running
  getRunnableServers(ns, false).forEach((server) => {
    ns.ps(server).forEach((proc) => {
      if (proc.filename.startsWith("lsd")) {
        ns.kill(proc.pid);
      }
    });
  });

  // Kill previous attemtps for this server
  ns.getPurchasedServers().forEach((server) => {
    ns.ps(server).forEach((proc) => {
      if (proc.filename.startsWith("keta")) {
        ns.kill(proc.pid);
      }
    });
  });

  while (true) {
    target.reload();

    // We're only attempting to run in local servers, they'll be the biggest.
    const servers = ns.getPurchasedServers().map((server) => new Ser(ns, server));
    const serverMemory = servers.at(-1)?.maxRam || 0;
    const owner = { ns, home, servers };

    const totalMemory = servers.reduce((acc, server) => acc + server.maxRam, 0);

    let parameters: KetaParameters | undefined;
    for (let percent = 100; percent >= 1; percent--) {
      const pars = parametersForPercent(ns, percent, target, PadTime);
      if (pars.memoryPerSlot < serverMemory) {
        parameters = pars;
        break;
      }
    }

    if (!parameters) {
      ns.tprintf("[keta] %s: [ ] not enough memory to run keta", target.hostname);
      ns.exit();
    }

    let slots = Math.min(
      Math.floor(totalMemory / parameters.memoryPerSlot), // As many slots as they fit in memory
      Math.floor(parameters.cycleTime / SlotTime) - 1, // As many slots as they fit in a cycle
    );
    const manager = new Manager(owner);

    ns.tprintf(
      "[keta] %s: [%s] running %s slots @ %s each",
      target.hostname,
      target.isPrimed() ? "✔" : " ",
      slots,
      parameters.percent + "%",
    );

    ns.tprintf(
      "[keta] %s: hack: n=%s,t=%s | weaken: n=%s,t=%s | grow: n=%s,t=%s | weaken: n=%s,t=%s",
      target.hostname,
      parameters.hackThreads,
      ns.tFormat(parameters.hackStartTime),
      parameters.hackWeakenThreads,
      ns.tFormat(parameters.hackWeakenStartTime),
      parameters.growThreads,
      ns.tFormat(parameters.growStartTime),
      parameters.growWeakenThreads,
      ns.tFormat(parameters.growWeakenStartTime),
    );

    for (let i = 0; i < slots; i++) {
      const slotWait = i * SlotTime;
      manager.ensure("keta/k-hack.js", target.isPrimed() ? parameters.hackThreads : 0, false, [
        target.hostname,
        slotWait + parameters.hackStartTime,
        i,
      ]);
      manager.ensure("keta/k-weak1.js", parameters.hackWeakenThreads, false, [
        target.hostname,
        slotWait + parameters.hackWeakenStartTime,
        i,
      ]);
      manager.ensure("keta/k-grow.js", parameters.growThreads, false, [
        target.hostname,
        slotWait + parameters.growStartTime,
        i,
      ]);
      manager.ensure("keta/k-weak2.js", parameters.growWeakenThreads, false, [
        target.hostname,
        slotWait + parameters.growWeakenStartTime,
        i,
      ]);
    }

    manager.run();
    await manager.wait();
  }
}
