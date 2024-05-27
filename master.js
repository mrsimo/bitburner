import { getRunnableServers } from "lib/explore.js";
import Ser from "lib/ser.js";
import Manager from "lib/manager.js";

import * as Helpers from "lib/helpers.js";

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
  constructor(settings) { this.settings = settings; }

  async run() {
    ns.tprintf("I have access to %s servers, with %s of %s (%s) of memory available.",
      this.servers.length,
      ns.formatRam(this.availableMemory),
      ns.formatRam(this.totalMemory),
      Math.round(this.availableMemory / this.totalMemory * 100) + "%",
    );

    this.ensureShares(this.settings.sharePercent / 100);
    if (this.settings.runHackNet) {
      new Manager(this).ensure("mdma.js", 1);
    }
    if (this.settings.runStockMarket) {
      new Manager(this).ensure("mari.js", 1);
    }

    // If we have access to formulas, run some more stuff
    if (ns.fileExists("Formulas.exe", "home")) {
      this.ensureKeta();
    } else {
      // we might want to be friendlier at the beginning and consider running the lsd way.
    }
  }

  ensureShares(fraction) {
    new Manager().ensure(
      "share.js",
      Math.floor((this.totalMemory / ns.getScriptRam("share.js")) * fraction),
    );
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

      // We don't know what status we are, so start from scratch
      switch (config.status) {
        case 'running':
          break;
        case 'primed':
          let workManager = new Manager(this, { config, target });
          workManager.ensure(

          )
          work.doneCondition = function (state) {

          }

          break;
        default:
          let primeManager = new Manager(this, { config, target });
          primeManager.ensure(
            "hack-weaken.js",
            Math.floor((this.totalMemory / ns.getScriptRam("hack-weaken.js")) * 0.05),
            target.hostname
          )
          primeManager.ensure(
            "hack-grow.js",
            Math.floor((this.totalMemory / ns.getScriptRam("hack-grow.js")) * 0.05),
            target.hostname
          )
          primeManager.doneCondition = function (state) {
            state.server.isPrimed()
          }
          primeManager.doneCallback = function (state) {
            const stopManager = new Manager();
            stopManager.ensure("hack-weaken.js", 0, target.hostname);
            stopManager.ensure("hack-grow.js", 0, target.hostname);

            state.config.status = 'primed'
          }
          break;
      }
      saveKetaConfig(config);
    }
  }

  saveKetaConfig(config) {
    ns.write("keta.json", JSON.stringify(config), "w");
  }

  ensureNoPrime(target) {
    this.ensure("hack-weaken.js", 0, target.hostname);
    this.ensure("hack-grow.js", 0, target.hostname);
  }

  /* privates */

  /**
   * Makes sure a certain amount of threads of a script is running accross our servers. Kills and starts new ones as necessary.
   *
   * @param script - Name of the script to run
   * @param threads - Amount of threads to run
   * @param args - Arguments to compare against
   */
  ensure(script, threads, ...args) {
    // Copy the script everywhere
    this.servers.forEach((server) => { ns.scp(script, server.hostname) });

    // Check how many are running already
    const runningIn = this.servers
      .map(
        (server) => {
          let procs = server.procs().filter((proc) => proc.filename == script && this.sameArgs(args, proc.args));

          return {
            server: server,
            procs: procs,
            threads: procs.reduce((sum, proc) => sum + proc.threads, 0)
          };
        })
      .filter((a) => a.threads > 0)

    let currentlyRunning = runningIn.reduce((sum, a) => sum + a.threads, 0);

    ns.tprintf("'%s' with %s args should run %s threads, is currently running %s threads. ", script, args, threads, currentlyRunning);

    if (currentlyRunning == threads) { return; }

    if (currentlyRunning > threads) {
      // Kill some
      for (let i = 0; i < runningIn.length; i++) {
        if (currentlyRunning <= threads) { break; }
        for (let j = 0; j < runningIn[i].procs.length; j++) {
          if (currentlyRunning <= threads) { break; }

          let proc = runningIn[i].procs[j];
          currentlyRunning = currentlyRunning - proc.threads;
          ns.kill(proc.pid);
        }
      }
    }

    if (currentlyRunning < threads) {
      // Start some
      const scriptMemory = ns.getScriptRam(script);
      let remaining = threads - currentlyRunning;

      this.servers.forEach((server) => {
        const available = server.availableMemory;
        const canRun = Math.floor(available / scriptMemory);
        if (canRun > 0 && remaining > 0) {
          const toRun = Math.min(canRun, remaining);
          ns.exec(script, server.hostname, toRun, ...args);
          remaining = remaining - toRun;
        }
      });
    }
  }

  /**
   * Checks if the first list of args is a subset of the first. The proc might have
   * more args, but we just compare the first few.
   *
   * @param args - args to compare from
   * @param procArgs - args to compare to
   */
  sameArgs(args, procArgs) {
    let same = true;
    for (let i = 0; i < args.length; i++) {
      if (args[i] != procArgs[i]) { return false; }
    }

    return true;
  }


  get servers() {
    const _servers = getRunnableServers(ns);

    return _servers.map((_server) => new Ser(ns, _server));;
  }

  get totalMemory() {
    return this.servers.reduce((sum, server) => sum + server.maxRam, 0);
  }

  get availableMemory() {
    return this.servers.reduce((sum, server) => sum + server.availableMemory, 0);
  }
}
