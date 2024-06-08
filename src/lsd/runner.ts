import { NS } from "@ns";

import { getRunnableServers } from "lib/explore";
import { profitableServer } from "lib/profitable";
import { h4ck } from "lib/break";
import { ServerResponse } from "http";
import Ser from "lib/ser";

const ThreadMultipliers = { grow: 25, weaken: 4, hack: 1 };
interface NumberDictionary {
  [index: string]: number;
}

interface NumberNumberDictionary {
  [index: string]: NumberDictionary;
}

function sameDictionary(a: NumberDictionary, b: NumberDictionary): boolean {
  return Object.keys(a).every((key) => a[key] == b[key]);
}

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  ns.enableLog("exec");

  const target =
    ns.args.length >= 1 ? new Ser(ns, String(ns.args[0])) : new Ser(ns, profitableServer(ns));
  let useHome = true;

  const debug = ns.args.length >= 2 ? String(ns.args[1]) == "--debug" : false;

  ns.tprintf("Going to bootstrap against %s using home=%s", target.hostname, useHome);

  let lastKnown: NumberDictionary = {};
  while (true) {
    const runnableServers = getRunnableServers(ns, useHome).map((server) => new Ser(ns, server));
    copyLibs(ns, runnableServers);

    // First make sure we've broken the servers as far as we can
    h4ck(ns, target.hostname);
    runnableServers.forEach((server) => h4ck(ns, server.hostname));

    // We count how many threads in total can we run in our network
    const { totalThreads, threadsPerServer } = calculateThreads(ns, runnableServers);

    if (debug) {
      Object.keys(threadsPerServer).forEach((server) => {
        ns.tprintf("[lsd] %s: Can run %s threads", server, threadsPerServer[server]);
      });
    }

    const threadsPerGroup =
      ThreadMultipliers.grow + ThreadMultipliers.weaken + ThreadMultipliers.hack;

    const totalGroups = totalThreads / threadsPerGroup;
    let needs: NumberDictionary = {
      hack: Math.ceil(totalGroups * ThreadMultipliers.hack),
      weaken: Math.floor(totalGroups * ThreadMultipliers.weaken),
      grow: Math.floor(totalGroups * ThreadMultipliers.grow),
    };

    if (!sameDictionary(needs, lastKnown)) {
      ns.tprintf(
        "[lsd] %s: Running %s threads accross the cluster (g=%s w=%s h=%s)",
        target.hostname,
        needs.grow + needs.weaken + needs.hack,
        needs.grow,
        needs.weaken,
        needs.hack,
      );
      lastKnown = { ...needs };
    }

    // Populate `haves` with currently running threads accross the cluster
    const haves: NumberDictionary = { grow: 0, weaken: 0, hack: 0 };
    runnableServers.forEach((server) => {
      server.procs.forEach((proc) => {
        Object.keys(needs).forEach((action) => {
          if (proc.filename == `lsd/${action}.js`) {
            if (proc.args[0] == target.hostname) {
              haves[action] ||= 0;
              haves[action] += proc.threads;
            } else {
              ns.tprintf(
                "[lsd] %s: detected lsd run agaisnt other server, killing it",
                target.hostname,
              );
              ns.kill(proc.pid);
            }
          }
        });
      });
    });

    if (debug) {
      Object.keys(haves).forEach((action) => {
        ns.tprintf("[lsd] %s: Currently running %s", action, haves[action]);
      });
    }

    for (const action in needs) {
      if (haves[action] > needs[action]) {
        ns.tprint(haves);
        ns.tprint(needs);
        ns.tprintf(
          "[lsd] %s: We need fewer threads of %s: %s vs %s! Giving up!",
          ac,
          action,
          haves[action],
          needs[action],
        );
        ns.exit();
      }
    }

    // Actually boot stuff
    runnableServers.forEach((server) => {
      for (const action in needs) {
        const script = `lsd/${action}.js`;
        const missing = needs[action] - haves[action];
        const canRun = Math.floor(server.availableMemory / ns.getScriptRam(script));
        if (debug) {
          ns.tprintf(
            "[lsd] %s: Missing %s threads of %s, can run %s",
            server.hostname,
            missing,
            action,
            canRun,
          );
        }
        if (missing > 0 && canRun > 0) {
          const threads = Math.min(missing, canRun);
          ns.exec(script, server.hostname, threads, target.hostname);
          haves[action] += threads;
        }
      }
    });

    await ns.sleep(10000);
  }
}

function calculateThreads(
  ns: NS,
  runnableServers: Ser[],
): { threadsPerServer: NumberDictionary; totalThreads: number } {
  const scriptMemory = Math.max(
    ns.getScriptRam("lsd/grow.js"),
    ns.getScriptRam("lsd/weaken.js"),
    ns.getScriptRam("lsd/hack.js"),
  );

  let totalThreads = 0;
  let threadsPerServer: NumberDictionary = {};

  for (var i = 0; i < runnableServers.length; i++) {
    const server = runnableServers[i];
    let availableMemory = ns.getServerMaxRam(server.hostname);
    if (server.hostname == "home") {
      availableMemory = availableMemory - 16;
    }
    const threads = Math.floor(availableMemory / scriptMemory);

    threadsPerServer[server.hostname] = threads;
    totalThreads += threads;
  }

  return { threadsPerServer, totalThreads };
}

function copyLibs(ns: NS, servers: Ser[]) {
  const files = ns.ls("home", "lib").concat(ns.ls("home", "lsd"));
  servers.forEach((server) => ns.scp(files, server.hostname));
}
