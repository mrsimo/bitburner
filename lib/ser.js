export default class Ser {
  constructor(ns, server) {
    this.ns = ns;
    this.server = this.ns.getServer(server);
  }

  // i'm sure there's an easier way to do all these delegates
  get hostname() { return this.server.hostname }
  get maxRam() { return this.server.maxRam }
  get ramUsed() { return this.server.ramUsed }

  get moneyMax() { return this.server.moneyMax }
  get moneyAvailable() { return this.server.moneyAvailable }

  get minDifficulty() { return this.server.minDifficulty }
  get hackDifficulty() { return this.server.hackDifficulty }

  procs() { return this.ns.ps(this.server.hostname) }
  hasMaxMoney() { return this.moneyMax == this.moneyAvailable }
  hasMinSecurity() { return this.minDifficulty == this.hackDifficulty }
  isPrimed() { return this.hasMaxMoney() && this.hasMinSecurity() }

  get availableMemory() {
    let m = this.server.maxRam - this.server.ramUsed

    // Always leave 32GB of RAM available in home server
    if (this.server.hostname === "home") {
      m = m - 32;
    }

    return m;
  }
}
