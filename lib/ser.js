export default class Ser {
  constructor(ns, hostname) {
    this.ns = ns;
    this.server = this.ns.getServer(hostname);
    this.preloadProcs();
  }

  // i'm sure there's an easier way to do all these delegates
  get hostname() {
    return this.server.hostname;
  }
  get maxRam() {
    return this.server.maxRam;
  }
  get ramUsed() {
    return this.server.ramUsed;
  }

  get moneyMax() {
    return this.server.moneyMax;
  }
  get moneyAvailable() {
    return this.server.moneyAvailable;
  }

  get minDifficulty() {
    return this.server.minDifficulty;
  }
  get hackDifficulty() {
    return this.server.hackDifficulty;
  }

  threadsToWeaken(points) {
    const pointsWeakened = this.ns.weakenAnalyze(1000, this.ns.getServer("home").cpuCores);

    return (points * 1000) / pointsWeakened;
  }

  threadsToGoBackToFullMoney() {
    let serverWithNoMoney = { ...this.server };
    serverWithNoMoney.moneyAvailable = 0;

    return Math.ceil(
      this.ns.formulas.hacking.growThreads(
        serverWithNoMoney,
        this.ns.getPlayer(),
        serverWithNoMoney.moneyMax,
        this.ns.getServer("home").cpuCores,
      ),
    );
  }

  preloadProcs() {
    this.procs = this.ns.ps(this.hostname);
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
    let m = this.server.maxRam - this.server.ramUsed;

    // Always leave 32GB of RAM available in home server
    if (this.server.hostname === "home") {
      m = m - 32;
    }

    return m;
  }
}
