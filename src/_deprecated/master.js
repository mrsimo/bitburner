import { getRunnableServers } from "lib/explore.js";
import Ser from "lib/ser.js";
import Manager from "lib/manager.js";
import Watchdog from "lib/watchdog.js";
import { ketaParameters } from "lib/keta.js";

/**
 * So we can use ns directly everywhere in the file.
 * @type {NS}
 **/
let ns;

/** @param {NS} ns */
export async function main(_ns) {
  ns = _ns;

  const settings = JSON.parse(ns.read("settings.json"));

  const masterProcess = new MasterProcess(settings);
  await masterProcess.run();
}

class MasterProcess {
  constructor(settings) {
    this.settings = settings;
    this.ns = ns;
    this.watchdogs = {};
  }

  async run() {
    this.silences();

    while (true) {
      this.preloadServers();
      this.header();
      this.copyLibs();

      new Manager(this)
        .ensure(
          "share.js",
          Math.floor(
            (this.totalOtherMemory / ns.getScriptRam("share.js")) *
              (this.settings.sharePercent / 100),
          ),
          false,
        )
        .run();
      new Manager(this).ensure("mdma.js", this.settings.runHackNet ? 1 : 0, true).run();
      new Manager(this).ensure("mari.js", this.settings.runStockMarket ? 1 : 0, true).run();

      // If we have access to formulas, run some more stuff
      if (ns.fileExists("Formulas.exe", "home")) {
        this.ensureKeta();
      } else {
        // we might want to be friendlier at the beginning and consider running the lsd way.
      }

      // This is where we do the waiting between cycles
      await this.checkWatchdogs();
    }
  }

  /**
   * This is what controls the fancy, 4-step hack. Running against a single server isn't
   * profitable enough, so we potentially run against multiple ones.
   * For each one:
   * 1. Make sure it's primed (full money and minimum security).
   * 2. Do the calculations for running the cycle with full money.
   * 3. Make sure we've scheduled enough of each.
   */
  ensureKeta() {
    const ketaConfig = JSON.parse(ns.read("keta.json"));

    for (let _target in ketaConfig) {
      const target = new Ser(ns, _target);
      let config = ketaConfig[_target];
      let parameters;

      const procsRunning = this.servers.flatMap((server) => {
        return (
          server.procs.filter(
            (proc) =>
              proc.args[0] == target.hostname &&
              [
                "hack-hack.js",
                "hack-grow.js",
                "hack-weaken.js",
                "hack-weak1.js",
                "hack-weak2.js",
              ].includes(proc.script),
          ) || []
        );
      });

      ns.printf(
        "[keta] %s: %s, %s procs detected",
        target.hostname,
        config.status,
        procsRunning.length,
      );

      if (procsRunning.length > 0 && !config.status) {
        ns.print(procsRunning);
        ns.printf(
          "[keta] %s is running something, but we have no status. Start from scratch.",
          target.hostname,
        );
        procsRunning.forEach((proc) => ns.kill(proc.pid));
        config.status = "unknown";
      }

      this.watchdogs[target.hostname] ||= new Watchdog(ns, target, () => {
        config.status = "drifted";
        ns.printf("[keta] %s drifted.", target.hostname);
        this.saveKetaConfig(ketaConfig);
      });

      if (config.status == "running" || config.status == "primed") {
        parameters = ketaParameters(ns, target);
        this.ensureKetaRunning(target, parameters);
        this.watchdogs[target.hostname].start();
        config.status = "running";
      } else if (config.status == "drifted") {
        this.watchdogs[target.hostname].stop();
        parameters = ketaParameters(ns, target);
        this.ensureKetaShutdown(target, parameters);
        config.status = "priming";
      } else {
        if (config.status != "priming") {
          ns.printf("[keta] Priming %s.", target.hostname);
        }
        this.ensureKetaPrimed(target, config);
      }

      this.saveKetaConfig(ketaConfig);
    }
  }

  saveKetaConfig(config) {
    ns.write("keta.json", JSON.stringify(config), "w");
  }

  ensureKetaPrimed(target, config) {
    let primeManager = new Manager(this, { config, target });

    // Enough to weaken 80 points.
    primeManager.ensure("hack-weaken.js", target.threadsToWeaken(80), true, [target.hostname]);
    // Enough to bring back to top money from $0.
    primeManager.ensure("hack-grow.js", target.threadsToGoBackToFullMoney(), true, [
      target.hostname,
    ]);

    primeManager.doneCondition = function (state) {
      return state.target.isPrimed();
    };
    const stopManager = new Manager(this);
    primeManager.doneCallback = function (state) {
      stopManager.ensure("hack-weaken.js", 0, true, [target.hostname]);
      stopManager.ensure("hack-grow.js", 0, true, [target.hostname]);
      stopManager.run();

      ns.printf("[keta] %s primed.", target.hostname);
      state.config.status = "primed";
    };
    config.status = "priming";
    primeManager.run();
  }

  ensureKetaRunning(target, parameters) {
    const workManager = new Manager(this);
    workManager.ensure("hack-grow.js", 0, true, [target.hostname]);
    workManager.ensure("hack-weaken.js", 0, true, [target.hostname]);

    // We'll run one slot every two seconds
    const numberOfSlots = Math.min(
      Math.floor(this.totalOtherMemory / parameters.memoryPerSlot),
      Math.floor(parameters.cycleTime / 2000),
    );

    for (let slot = 0; slot < numberOfSlots; slot++) {
      workManager.ensure(
        "hack-hack.js",
        parameters.hackThreads,
        false,
        [target.hostname, slot, parameters.hackStartTime, parameters.cycleTime],
        [target.hostname, slot],
      );
      workManager.ensure(
        "hack-weak1.js",
        parameters.hackWeakenThreads,
        false,
        [target.hostname, slot, parameters.hackWeakenStartTime, parameters.cycleTime],
        [target.hostname, slot],
      );
      workManager.ensure(
        "hack-grow.js",
        parameters.growThreads,
        false,
        [target.hostname, slot, parameters.growStartTime, parameters.cycleTime],
        [target.hostname, slot],
      );
      workManager.ensure(
        "hack-weak2.js",
        parameters.growWeakenThreads,
        false,
        [target.hostname, slot, parameters.growWeakenStartTime, parameters.cycleTime],
        [target.hostname, slot],
      );
    }
    workManager.run();
  }

  ensureKetaShutdown(target, parameters) {
    const workManager = new Manager(this);
    const numberOfSlots = Math.floor(parameters.cycleTime / 2000);

    for (let slot = 0; slot < numberOfSlots; slot++) {
      workManager.ensure("hack-hack.js", 0, false, [], [target.hostname, slot]);
      workManager.ensure(
        "hack-weak1.js",
        parameters.hackWeakenThreads,
        false,
        [target.hostname, slot, parameters.hackWeakenStartTime, parameters.cycleTime],
        [target.hostname, slot],
      );
      workManager.ensure(
        "hack-grow.js",
        parameters.growThreads,
        false,
        [target.hostname, slot, parameters.growStartTime, parameters.cycleTime],
        [target.hostname, slot],
      );
      workManager.ensure("hack-weak2.js", 0, false, [], [target.hostname, slot]);
    }
    workManager.run();
  }

  async checkWatchdogs() {
    const start = new Date();
    while (new Date() - start < 20000) {
      await ns.sleep(100 + Math.random() * 400);
      for (let dog in this.watchdogs) {
        this.watchdogs[dog].tick();
      }
    }
  }

  preloadServers() {
    const _servers = getRunnableServers(ns, false);
    this.servers = _servers.map((_server) => new Ser(ns, _server));
    this.home = new Ser(ns, "home");
  }

  get totalHomeMemory() {
    return this.home.maxRam;
  }

  get totalOtherMemory() {
    return this.servers.reduce((sum, server) => sum + server.maxRam, 0);
  }

  get availableHomeMemory() {
    return this.home.availableMemory;
  }

  get availableOtherMemory() {
    return this.servers.reduce((sum, server) => sum + server.availableMemory, 0);
  }

  copyLibs() {
    const files = ns.ls("home", "lib") + ns.ls("home", "keta");
    this.servers.forEach((server) => ns.scp(files, server.hostname));
  }

  silences() {
    ns.disableLog("sleep");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("scan");
    ns.disableLog("scp");
    ns.disableLog("kill");
    ns.disableLog("exec");
  }

  header() {
    ns.tprintf(
      "Home: %s of %s (%s) available. %s accessible servers: %s of %s (%s) available.",
      ns.formatRam(this.availableHomeMemory),
      ns.formatRam(this.totalHomeMemory),
      Math.round((this.availableHomeMemory / this.totalHomeMemory) * 100) + "%",
      this.servers.length,
      ns.formatRam(this.availableOtherMemory),
      ns.formatRam(this.totalOtherMemory),
      Math.round((this.availableOtherMemory / this.totalOtherMemory) * 100) + "%",
    );
  }
}
