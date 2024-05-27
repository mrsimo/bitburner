/**
 * So we can use ns directly everywhere in the file.
 * @type {NS}
 **/
let ns;

export default class Manager {
  constructor(master) {
    ns = master.ns;
    this.ns = master.ns;
    this.master = master;
  }

  get servers() { return this.master.servers() }

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

}
