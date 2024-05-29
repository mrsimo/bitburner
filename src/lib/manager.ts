import { NS, ProcessInfo, ScriptArg } from "@ns";
import Ser from "lib/ser";

interface Owner {
  ns: NS;
  servers: Ser[];
  home: Ser;
}

class Demand {
  script: string;
  threads: number;
  home: boolean;
  args?: string[] | ScriptArg[];
  compareArgs?: string[] | ScriptArg[];

  constructor(
    script: string,
    threads: number,
    home = false,
    args?: string[] | ScriptArg[],
    compareArgs?: string[] | ScriptArg[],
  ) {
    this.script = script;
    this.threads = threads;
    this.home = home;
    this.args = args;
    this.compareArgs = compareArgs;
  }
}

export default class Manager {
  ns: NS;
  owner: Owner;
  state?: Object;
  demands: Demand[];
  pids: number[];
  doneCallback?: Function;
  doneCondition?: Function;

  constructor(owner: Owner, state?: Object) {
    this.ns = owner.ns;
    this.owner = owner;
    this.state = state;
    this.demands = [];
    this.pids = [];
  }

  run() {
    if (!this.doneCondition || !this.doneCondition(this.state)) {
      this.runDemands();
    }

    if (this.doneCondition && this.doneCallback) {
      this.doneCondition(this.state) && this.doneCallback(this.state);
    }
  }

  runDemands() {
    this.demands.forEach((demand) => this.actuallyEnsure(demand));
  }

  ensure(
    script: string,
    threads: number,
    home?: boolean,
    args?: string[] | ScriptArg[],
    compareArgs?: string[] | ScriptArg[],
  ) {
    this.demands.push(new Demand(script, threads, home, args, compareArgs ? compareArgs : args));
    return this;
  }

  /**
   * Runs the ensure given and
   *
   * @param {Demand} options
   */
  actuallyEnsure(demand: Demand) {
    const servers = demand.home ? [this.owner.home] : this.owner.servers;

    if (!demand.home) {
      // Copy the script everywhere
      servers.forEach((server) => {
        this.ns.scp(demand.script, server.hostname);
      });
    }

    // Find if it's running already
    const processes = servers.flatMap((server) => {
      return server.procs.filter(
        (proc: ProcessInfo) =>
          proc.filename == demand.script && this.sameArgs(demand.compareArgs, proc.args),
      );
    });

    if (demand.threads > 0 && processes.length == 1 && processes[0].threads == demand.threads) {
      return;
    } else if (demand.threads == 0) {
      if (processes.length >= 1) {
        this.ns.tprintf(
          "'%s' home=%s with %s args stopping %s processes",
          demand.script,
          demand.home,
          JSON.stringify(demand.args),
          processes.length,
        );
        processes.forEach((proc) => this.ns.kill(proc.pid));
      }
      return;
    } else {
      processes.forEach((proc) => this.ns.kill(proc.pid));
      this.ns.tprintf(
        "'%s' home=%s with %s args should run %s threads, booting",
        demand.script,
        demand.home,
        JSON.stringify(demand.args),
        demand.threads,
      );

      const scriptMemory = this.ns.getScriptRam(demand.script);
      const sortedServers = servers.sort((a, b) => a.availableMemory - b.availableMemory);

      for (const i in sortedServers) {
        const server = sortedServers[i];
        const canRun = Math.floor(server.availableMemory / scriptMemory);
        if (canRun > demand.threads) {
          this.pids.push(
            this.ns.exec(demand.script, server.hostname, demand.threads, ...(<[]>demand.args)),
          );
          return;
        }
      }
    }
  }

  /**
   * Waits for all the booted processes to finish
   */
  async wait(): Promise<void> {
    while (true) {
      this.pids = this.pids.filter((pid) => this.ns.isRunning(pid));

      if (this.pids.length == 0) {
        return;
      }

      await this.ns.sleep(1000);
    }
  }

  /**
   * Checks if the first list of args is a subset of the first. The proc might have
   * more args, but we just compare the first few.
   *
   * @param args - args to compare from
   * @param procArgs - args to compare to
   */
  sameArgs(args?: string[] | ScriptArg[], procArgs?: string[] | ScriptArg[]) {
    if (args && procArgs) {
      for (let i = 0; i < args.length; i++) {
        if (args[i] != procArgs[i]) {
          return false;
        }
      }
    }

    return true;
  }
}
