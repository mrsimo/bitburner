/**
 * So we can use ns directly everywhere in the file.
 * @type {NS}
 **/
let ns;

export default class Manager {
  constructor(master, state = null) {
    ns = master.ns;
    this.ns = master.ns;
    this.master = master;
    this.state = state;
    this.ensures = [];
  }

  get servers() {
    return this.master.servers;
  }

  run() {
    if (!this.doneCondition || !this.doneCondition(this.state)) {
      this.runEnsures();
    }

    if (this.doneCondition && this.doneCallback) {
      this.doneCondition(this.state) && this.doneCallback(this.state);
    }
  }

  runEnsures() {
    this.ensures.forEach((conditions) => this.actuallyEnsure(...conditions));
  }

  ensure(script, threads, home = true, args = [], compareArgs = null) {
    this.ensures.push([script, threads, home, args, compareArgs ? compareArgs : args]);
    return this;
  }

  /**
   * Makes sure a certain amount of threads of a script is running accross our servers. Kills and starts new ones as necessary.
   *
   * @param script - Name of the script to run
   * @param threads - Amount of threads to run
   * @param args - Arguments to compare against
   * @param compareArgs - Arguments to compare against
   */
  actuallyEnsure(script, threads, home, args, compareArgs) {
    const servers = home
      ? [this.servers.find((server) => server.hostname == "home")]
      : this.servers.filter((server) => server.hostname != "home");

    if (!home) {
      // Copy the script everywhere
      servers.forEach((server) => {
        ns.scp(script, server.hostname);
      });
    }

    // Check how many are running already
    const runningIn = servers
      .map((server) => {
        let procs = server.procs.filter(
          (proc) => proc.filename == script && this.sameArgs(compareArgs, proc.args),
        );

        return {
          server: server,
          procs: procs,
          threads: procs.reduce((sum, proc) => sum + proc.threads, 0),
        };
      })
      .filter((a) => a.threads > 0);

    let currentlyRunning = runningIn.reduce((sum, a) => sum + a.threads, 0);

    if (currentlyRunning == threads) {
      return;
    }

    ns.tprintf(
      "'%s' home=%s with %s args should run %s threads, is currently running %s threads",
      script,
      home,
      JSON.stringify(args),
      threads,
      currentlyRunning,
    );

    if (currentlyRunning > threads) {
      // Kill some
      for (let i = 0; i < runningIn.length; i++) {
        if (currentlyRunning <= threads) {
          break;
        }
        for (let j = 0; j < runningIn[i].procs.length; j++) {
          if (currentlyRunning <= threads) {
            break;
          }

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

      servers.forEach((server) => {
        if (remaining > 0) {
          const available = server.availableMemory;
          const canRun = Math.floor(available / scriptMemory);
          if (canRun > 0) {
            const toRun = Math.min(canRun, remaining);
            ns.exec(script, server.hostname, toRun, ...args);
            remaining = remaining - toRun;
          }
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
    if ((args == null || args.length == 0) && (procArgs == null || procArgs.length == 0)) {
      return true;
    }

    for (let i = 0; i < args.length; i++) {
      if (args[i] != procArgs[i]) {
        return false;
      }
    }

    return true;
  }
}
