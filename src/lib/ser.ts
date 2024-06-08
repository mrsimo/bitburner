import { NS, ProcessInfo, Server } from "@ns";

export default class Ser {
  ns: NS;
  server: Server;
  procs: ProcessInfo[];

  constructor(ns: NS, hostname: string | Server) {
    this.ns = ns;
    this.server = typeof hostname === "string" ? ns.getServer(hostname) : hostname;
    this.procs = ns.ps(this.hostname);
  }

  reload() {
    this.server = this.ns.getServer(this.server.hostname);
    this.procs = this.ns.ps(this.server.hostname);
  }

  // i'm sure there's an easier way to do all these delegates
  get hostname(): string {
    return this.server.hostname;
  }
  get maxRam(): number {
    return this.server.maxRam;
  }
  get ramUsed(): number {
    return this.ns.getServerUsedRam(this.server.hostname);
  }

  get moneyMax(): number {
    return this.server.moneyMax || 0;
  }
  get moneyAvailable(): number {
    return this.server.moneyAvailable || 0;
  }

  get minDifficulty(): number {
    return this.server.minDifficulty || 0;
  }
  get hackDifficulty(): number {
    return this.server.hackDifficulty || 0;
  }

  threadsToWeaken(points: number) {
    const pointsWeakened = this.ns.weakenAnalyze(1000, this.ns.getServer("home").cpuCores);

    return Math.ceil((points * 1000) / pointsWeakened);
  }

  selfPrime() {}

  threadsToGoBackToFullMoney() {
    let serverWithNoMoney = { ...this.server };
    serverWithNoMoney.moneyAvailable = 0;
    serverWithNoMoney.hackDifficulty = this.server.baseDifficulty;

    return Math.ceil(
      this.ns.formulas.hacking.growThreads(
        serverWithNoMoney,
        this.ns.getPlayer(),
        serverWithNoMoney.moneyMax || 10,
        this.ns.getServer("home").cpuCores,
      ),
    );
  }

  hasMaxMoney() {
    return this.server.moneyMax == this.server.moneyAvailable;
  }
  hasMinSecurity() {
    return this.server.minDifficulty == this.server.hackDifficulty;
  }
  isPrimed() {
    return this.hasMaxMoney() && this.hasMinSecurity();
  }

  get availableMemory() {
    let m =
      this.ns.getServerMaxRam(this.server.hostname) -
      this.ns.getServerUsedRam(this.server.hostname);

    // Always leave 32GB of RAM available in home server
    if (this.server.hostname === "home") {
      m = m - 16;
    }

    return m;
  }
}
