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

    this.ns.printf("[Watchdog] Initializing for %s", this.target.hostname);
  }

  tick() {
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
