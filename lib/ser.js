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
    return this.ns.getServerUsedRam(this.server.hostname);
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
    let m =
      this.ns.getServerMaxRam(this.server.hostname) -
      this.ns.getServerUsedRam(this.server.hostname);

    // Always leave 32GB of RAM available in home server
    if (this.server.hostname === "home") {
      m = m - 32;
    }

    return m;
  }
}
