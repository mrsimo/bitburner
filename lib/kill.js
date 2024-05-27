/** @param {NS} ns */
export function pkill(ns, script, server, target) {
  let procs = ns.ps(server);

  for (let i = 0; i < procs.length; i++) {
    let proc = procs[i];

    if (proc.filename == script && proc.args[0] == target) {
      ns.kill(proc.pid);
    }
  }
}