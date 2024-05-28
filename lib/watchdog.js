// Number of times we need to see wrong values for us to think we're out of sync
const Threshold = 50;

export default class Watchdog {
  /**
   *
   * @param {Ser} target
   * @param {function} callback
   */
  constructor(ns, target, callback) {
    this.ns = ns;
    this.target = target;
    this.misses = 0;
    this.callback = callback;
    this.running = false;

    this.ns.printf("[Watchdog] Initializing for %s", this.target.hostname);
  }

  start() {
    if (!this.running) {
      this.ns.printf("[Watchdog] Starting for %s", this.target.hostname);
      this.running = true;
    }
  }

  stop() {
    if (this.running) {
      this.ns.printf("[Watchdog] Stopping for %s", this.target.hostname);
      this.running = false;
    }
  }

  tick() {
    if (!this.running) {
      return;
    }

    if (this.target.isPrimed()) {
      this.misses = 0;
    } else {
      this.misses++;
    }

    if (this.misses > Threshold) {
      this.callback();
    }
  }
}
