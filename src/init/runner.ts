import { NS } from "@ns";
import { getRunnableServers } from "lib/explore";
import { h4ck } from "lib/break";
import { isHackable } from "/lib/hackable";
import { toMoney } from "/lib/money";
import { KetaParameters } from "/keta/calculations";

export async function main(ns: NS): Promise<void> {
  // if (ns.getHackingLevel() < 10) {
  //   ns.spawn("init/sub10.js", { spawnDelay: 1000 });
  // }

  // Oneshot to make sure LSD or KETA is running, just in case
  handleRunningHacks(ns);

  ns.tprintf("[init] Ensuring Tor Router purchased");
  while (!ns.singularity.purchaseTor()) {
    await ns.sleep(5000);
  }

  ns.tprintf("[init] Ensuring BruteSSH.exe purchased");
  while (!ns.fileExists("BruteSSH.exe", "home")) {
    if (!ns.singularity.purchaseProgram("BruteSSH.exe")) {
      await ns.sleep(5000);
    }
  }

  ns.tprintf("[init] Ensuring we have purchased servers");
  const ram = 2;
  const cost = ns.getPurchasedServerCost(ram);
  while (ns.getPurchasedServers().length < ns.getPurchasedServerLimit()) {
    if (ns.getServerMoneyAvailable("home") >= cost) {
      ns.purchaseServer("local-" + String(ns.getPurchasedServers().length).padStart(2, "0"), ram);
    } else {
      await ns.sleep(1000);
    }
  }

  /**
   * This we know:
   * - We have the initial servers
   * - We're running LSD against, at least, joesguns
   * - We have Tor Router
   * - We have BruteSSH.exe
   *
   * We probably want to start upgrading servers while we buy hacking programs.
   * Ideally LSD can take care of retargetting itself and we'll just worry about
   * switching LSD with KETA hack once we can buy Formulas.exe
   */
  while (true) {
    handleBackdoors(ns);
    handleFactions(ns);
    handleBuyingHacks(ns);
    handleRunningHacks(ns);
    handleUpgradingServers(ns);
    handleShares(ns);
    await ns.sleep(10000);
  }
}

/**
 * Takes care of installing backdoors on faction servers and joining their factions.
 * Also the powerhouse gym and corporations.
 */
const BackdoorServers = [
  "CSEC",
  "I.I.I.I",
  "avmnite-02h",
  "run4theh111z",
  "4sigma",
  "b-and-a",
  "blade",
  "clarkinc",
  "ecorp",
  "fulcrumassets",
  "fulcrumtech",
  "kuai-gong",
  "megacorp",
  "nwo",
  "omnitek",
  "powerhouse-fitness",
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

// TODO: handle The Syndicate and others that only have the CIA etc as enemies
function handleFactions(ns: NS): void {
  ns.singularity.checkFactionInvitations().forEach((faction) => {
    const enemies = ns.singularity.getFactionEnemies(faction);
    if (enemies.length == 0) {
      ns.tprintf("[init] Joining faction %s", faction);
      ns.singularity.joinFaction(faction);
    }
  });
}

/**
 * Takes care of buying hacking programs
 */
const HackPrograms = [
  "FTPCrack.exe",
  "relaySMTP.exe",
  "HTTPWorm.exe",
  "SQLInject.exe",
  "Formulas.exe",
  // "AutoLink.exe",
  // "DeepscanV1.exe",
  // "DeepscanV2.exe",
  // "ServerProfiler.exe",
];
function handleBuyingHacks(ns: NS): void {
  HackPrograms.filter((program) => !ns.fileExists(program, "home")).forEach((program) => {
    if (ns.singularity.purchaseProgram(program)) {
      ns.tprintf("[init] Purchased %s", program);
    }
  });
}

/**
 * Makes sure we're running either the LSD or the KETA hack.
 */
function handleRunningHacks(ns: NS): void {
  switch (ketaOrLsd(ns)) {
    case "keta":
      if (ns.scriptRunning("lsd/runner.js", "home")) {
        ns.scriptKill("lsd/runner.js", "home");
      }
      if (!ns.scriptRunning("keta/runner.js", "home")) {
        ns.tprintf("[init] Starting KETA runner");
        // ns.exec("keta/runner.js", "home", 1, "--dynamic=true");
        ns.exec("keta/runner.js", "home", 1);
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

const KetaThreshold = 2 ** 7; // 128GB
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

function handleShares(ns: NS): void {
  if (ketaOrLsd(ns) == "lsd") {
    return;
  }
  const hackMemReq = ns.getScriptRam("keta/runner.js");
  const memoryAvailableHome =
    (ns.getServerMaxRam("home") -
      ns.getScriptRam("init/runner.js") -
      ns.getScriptRam("init/backdoor.js") -
      ns.getScriptRam("upgradeservers.js") -
      ns.getScriptRam("share.js") -
      ns.getScriptRam("blade/runner.js") -
      ns.getScriptRam("go/runner.js") -
      hackMemReq) *
    0.9;
  const shareMemReq = ns.getScriptRam("share.js");
  const threadsHome = Math.floor(memoryAvailableHome / shareMemReq);

  if (memoryAvailableHome < 0 || threadsHome < 1) {
    return;
  }

  const homeProc = ns.ps("home").find((ps) => ps.filename == "share.js");
  if (!homeProc || homeProc.threads != threadsHome) {
    ns.scriptKill("share.js", "home");
    ns.tprintf("[init] Starting share.js with %s threads", threadsHome);
    ns.exec("share.js", "home", threadsHome);
  }
}
