/**
 * So we can use ns directly everywhere in the file.
 * @type {NS}
 **/
let ns;

export default class Manager {
  constructor(owner, state = null) {
    ns = owner.ns;
    this.ns = owner.ns;
    this.owner = owner;
    this.state = state;
    this.ensures = [];
    this.pids = [];
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
    const servers = home ? [this.owner.home] : this.owner.servers;

    if (!home) {
      // Copy the script everywhere
      servers.forEach((server) => {
        ns.scp(script, server.hostname);
      });
    }

    // Find if it's running already
    const processes = servers.flatMap((server) => {
      return server.procs.filter(
        (proc) => proc.filename == script && this.sameArgs(compareArgs, proc.args),
      );
    });

    if (threads > 0 && processes.length == 1 && processes[0].threads == threads) {
      return;
    } else if (threads == 0) {
      if (processes.length >= 1) {
        ns.tprintf(
          "'%s' home=%s with %s args stopping %s processes",
          script,
          home,
          JSON.stringify(args),
          processes.length,
        );
        processes.forEach((proc) => ns.kill(proc.pid));
      }
      return;
    } else {
      processes.forEach((proc) => ns.kill(proc.pid));
      ns.tprintf(
        "'%s' home=%s with %s args should run %s threads, booting",
        script,
        home,
        JSON.stringify(args),
        threads,
      );

      const scriptMemory = ns.getScriptRam(script);
      const sortedServers = servers.sort((a, b) => a.availableMemory - b.availableMemory);

      for (let i in sortedServers) {
        const server = sortedServers[i];
        const canRun = Math.floor(server.availableMemory / scriptMemory);
        if (canRun > threads) {
          ns.exec(script, server.hostname, threads, ...args);
          return;
        }
      }
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
