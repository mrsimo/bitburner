import { NS } from "@ns";
import Ser from "lib/ser";
import Manager from "lib/manager";

import { profitableServer, topProfitableServers, HackingLevel } from "lib/profitable";
import { getRunnableServers } from "lib/explore";
import { parametersForPercent, KetaParameters } from "keta/calculations";
import { h4ck } from "lib/break";

// How long we want to give the scripts to land.
const SlotTime = 2000;

// Time between scripts landing.
// Hack => Weaken =>   Grow => Weaken =>   Hack ...
//  0ms =>  500ms => 1000ms => 1500ms => 2000ms ...
const PadTime = SlotTime / 4;

interface KetaParametersDictionary {
  [index: string]: KetaParameters;
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.enableLog("exec");

  const options = ns.flags([
    ["target", []],
    ["dynamic", false],
  ]);
  let targets;
  if (options.target instanceof Array) {
    targets = options.target.map((target) => new Ser(ns, target));
  } else {
    targets = [new Ser(ns, String(options.target))];
  }

  if (targets.length === 0) {
    targets = [new Ser(ns, profitableServer(ns))];
  }
  targets.forEach((target) => h4ck(ns, target.hostname));

  const home = new Ser(ns, "home");

  // Kill all lsd scripts that might be running
  getRunnableServers(ns, true).forEach((server) => {
    ns.ps(server).forEach((proc) => {
      if (proc.filename.startsWith("lsd")) {
        ns.kill(proc.pid);
      }
    });
  });

  // Kill all currently running keta scripts
  ns.getPurchasedServers().forEach((server) => {
    ns.ps(server).forEach((proc) => {
      if (proc.filename.startsWith("keta")) {
        ns.kill(proc.pid);
      }
    });
  });

  while (true) {
    // We're only attempting to run in local servers, they'll be the biggest.
    const servers = ns.getPurchasedServers().map((server) => new Ser(ns, server));
    const owner = { ns, home, servers };

    const serverMemory = servers.at(-1)?.maxRam || 0;
    const totalMemory = servers.reduce((acc, server) => acc + server.maxRam, 0);

    if (options.dynamic) {
      let candidates = topProfitableServers(ns, 20, ns.getHackingLevel() * HackingLevel)
        .map((hostname) => new Ser(ns, hostname))
        .sort((a, b) => b.moneyMax - a.moneyMax);

      ns.printf("[debug]: candidates: %s", candidates.map((target) => target.hostname).join(", "));

      let pool: Ser[] = [];
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        pool.push(candidate);
        const optimal = optimalParameters(ns, pool, serverMemory / pool.length, 50);
        ns.printf(
          "[debug]: optimal for %s is %s percent",
          candidate.hostname,
          optimal[candidate.hostname]?.percent,
        );
        if (Object.keys(optimal).length != pool.length) {
          ns.printf("[debug] %s is not optimal, exiting loop", candidate.hostname);
          pool.pop();
          if (pool.length > 0) {
            break;
          }
        }
      }

      const maxMoney = Math.max(...pool.map((target) => target.moneyMax));
      targets = pool.filter((target) => target.moneyMax > maxMoney / 3);
      targets.forEach((target) => h4ck(ns, target.hostname));
    }

    ns.printf("[debug] targets: %s", targets.map((target) => target.hostname).join(", "));

    targets.forEach((target) => target.reload());

    const maxMemPerTarget = serverMemory / targets.length;
    const maxTotalMemPerTarget = totalMemory / targets.length;

    const parametersPerTarget = optimalParameters(ns, targets, maxMemPerTarget, 1);
    const shortestCycle = Math.min(
      ...Object.values(parametersPerTarget).map((parameters) => parameters.cycleTime),
    );

    const maxSlots = Math.floor(shortestCycle / SlotTime) - 1;
    const manager = new Manager(owner);

    ns.tprintf(
      "[keta] New %s cycle starting:",
      ns.tFormat(
        Math.max(...Object.values(parametersPerTarget).map((parameters) => parameters.cycleTime)),
      ),
    );

    const longestHostname = Math.max(
      ...Object.keys(parametersPerTarget).map((hostname) => hostname.length),
    );

    for (const [hostname, parameters] of Object.entries(parametersPerTarget)) {
      const target = new Ser(ns, hostname);
      let slots = Math.min(
        Math.floor(maxTotalMemPerTarget / parameters.memoryPerSlot), // As many slots as they fit in memory
        maxSlots, // As many slots as they fit in a cycle
      );

      ns.tprintf(
        "[keta] [%s] %s running %s slots (max %s) @ %s each",
        target.isPrimed() ? "✔" : " ",
        target.hostname.padEnd(longestHostname, " "),
        slots,
        maxSlots,
        parameters.percent + "%",
      );

      ns.printf(
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
    }
    manager.run();
    await manager.wait();
  }
}

function optimalParameters(
  ns: NS,
  targets: Ser[],
  maxMemPerTarget: number,
  minPercent: number,
): KetaParametersDictionary {
  let parametersPerTarget: KetaParametersDictionary = {};
  targets.forEach((target) => {
    for (let percent = 100; percent >= minPercent; percent--) {
      const pars = parametersForPercent(ns, percent, target, PadTime);
      if (pars.memoryPerSlot < maxMemPerTarget) {
        parametersPerTarget[target.hostname] = pars;
        break;
      }
    }
  });

  return parametersPerTarget;
}
