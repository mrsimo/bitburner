import { NS } from "@ns";
import { getRunnableServers } from "lib/explore";
import { h4ck } from "lib/break";
import { isHackable } from "/lib/hackable";
import { toMoney } from "/lib/money";

export async function main(ns: NS): Promise<void> {
  // Oneshot to make sure LSD or KETA is running, just in case
  // handleRunningHacks(ns);

  ns.tprintf("[brief] I'm a simpler version, please buy Tor and programs on your own");
  ns.tprintf("[brief] Ensuring we have purchased servers");
  await ns.sleep(1000);

  const ram = 2;
  const cost = ns.getPurchasedServerCost(ram);
  while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
    if (ns.getServerMoneyAvailable("home") >= cost) {
      ns.purchaseServer("local-" + String(ns.getPurchasedServers().length).padStart(2, "0"), ram);
    } else {
      await ns.sleep(1000);
    }
    await ns.sleep(1000);
  }

  await ns.sleep(1000);

  while (true) {
    // handleBackdoors(ns);
    // handleFactions(ns);
    // handleBuyingHacks(ns);
    handleRunningHacks(ns);
    handleUpgradingServers(ns);
    // handleShares(ns);

    await ns.sleep(10000);
  }
}

/**
 * Takes care of installing backdoors on faction servers and joining their factions.
 * Also the powerhouse gym and corporations.
 */
const BackdoorServers = [
  "4sigma",
  "avmnite-02h",
  "b-and-a",
  "blade",
  "clarkinc",
  "CSEC",
  "ecorp",
  "fulcrumassets",
  "fulcrumtech",
  "I.I.I.I",
  "kuai-gong",
  "megacorp",
  "nwo",
  "omnitek",
  "powerhouse-fitness",
  "run4theh111z",
];
function handleBackdoors(ns: NS): void {
  for (const hostname of BackdoorServers) {
    if (isHackable(ns, hostname) && !ns.getServer(hostname).backdoorInstalled) {
      if (!ns.scriptRunning("init/backdoor.js", "home")) {
        ns.tprintf("[init] Installing backdoor on %s", hostname);
        ns.exec("init/backdoor.js", "home", 1, hostname);
      }
    }
  }
}

// function handleFactions(ns: NS): void {
//   ns.singularity.checkFactionInvitations().forEach((faction) => {
//     const enemies = ns.singularity.getFactionEnemies(faction);
//     if (enemies.length == 0) {
//       ns.tprintf("[init] Joining faction %s", faction);
//       ns.singularity.joinFaction(faction);
//     }
//   });
// }

/**
 * Takes care of buying hacking programs
 */
// const HackPrograms = [
//   "FTPCrack.exe",
//   "relaySMTP.exe",
//   "HTTPWorm.exe",
//   "SQLInject.exe",
//   "Formulas.exe",
//   "AutoLink.exe",
//   "DeepscanV1.exe",
//   "DeepscanV2.exe",
//   "ServerProfiler.exe",
// ];
// function handleBuyingHacks(ns: NS): void {
//   HackPrograms.filter((program) => !ns.fileExists(program, "home")).forEach((program) => {
//     if (ns.singularity.purchaseProgram(program)) {
//       ns.tprintf("[init] Purchased %s", program);
//     }
//   });
// }

function handleRunningHacks(ns: NS): void {
  switch (ketaOrLsd(ns)) {
    case "keta":
      if (ns.scriptRunning("lsd/runner.js", "home")) {
        ns.scriptKill("lsd/runner.js", "home");
      }
      if (!ns.scriptRunning("keta/runner.js", "home")) {
        ns.tprintf("[init] Starting KETA runner");
        ns.exec("keta/runner.js", "home", 1, "--dynamic=true");
      }
      break;
    case "lsd":
      if (!ns.scriptRunning("lsd/runner.js", "home")) {
        ns.tprintf("[init] Starting LSD runner");
        ns.exec("lsd/runner.js", "home");
      }
      break;
  }
}

const KetaThreshold = 2 ** 13; // 8TB
function ketaOrLsd(ns: NS): "keta" | "lsd" {
  if (
    ns.getPurchasedServers().length >= ns.getPurchasedServerLimit() &&
    ns.getServerMaxRam("local-00") >= KetaThreshold
  ) {
    return "keta";
  } else {
    return "lsd";
  }
}
/**
 * Makes sure we keep servers upgraded
 */
function handleUpgradingServers(ns: NS): void {
  const servers = ns.getPurchasedServers();
  const ram = 2 * ns.getServerMaxRam(servers.at(-1) || "local-00");
  if (ram > ns.getPurchasedServerMaxRam()) {
    return;
  }
  const cost = servers
    .map((server) => {
      if (ns.getServerMaxRam(server) < ram) {
        return ns.getPurchasedServerUpgradeCost(server, ram);
      } else {
        return 0;
      }
    })
    .reduce((acc, cost) => acc + cost, 0);

  if (cost <= ns.getServerMoneyAvailable("home")) {
    ns.exec("upgradeservers.js", "home", 1, "--brief=true");
  }
}

// function handleShares(ns: NS): void {
//   if (!ns.fileExists("Formulas.exe", "home")) {
//     return;
//   }
//   const hackMemReq = ns.getScriptRam("keta/runner.js");
//   const memoryAvailableHome =
//     (ns.getServerMaxRam("home") - ns.getScriptRam("init.js") - hackMemReq) * 0.9;
//   const shareMemReq = ns.getScriptRam("share.js");
//   const threadsHome = Math.floor(memoryAvailableHome / shareMemReq);

//   if (memoryAvailableHome < 0 || threadsHome < 1) {
//     return;
//   }

//   const homeProc = ns.ps("home").find((ps) => ps.filename == "share.js");
//   if (!homeProc || homeProc.threads != threadsHome) {
//     ns.scriptKill("share.js", "home");
//     ns.tprintf("[init] Starting share.js with %s threads", threadsHome);
//     ns.exec("share.js", "home", threadsHome);
//   }
// }
