import { getRunnableServers } from "lib/explore.js";
import { h4ck } from "lib/break.js";
import { ketaParameters } from "lib/keta.js";
import Ser from "lib/ser.js";

/** @param {NS} ns */
export async function main(ns) {
  const target = new Ser(ns, "omega-net");
  ns.tprint(ketaParameters(ns, target));
}
