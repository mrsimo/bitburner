import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.singularity.workForFaction("Speakers for the Dead", "security");
  while (ns.singularity.getFactionRep("Speakers for the Dead") < 750000) {
    await ns.sleep(10000);
  }

  // ns.singularity.workForFaction("Speakers for the Dead", "security");
  // while (ns.singularity.getFactionRep("Speakers for the Dead") < 400000) {
  //   await ns.sleep(10000);
  // }

  ns.spawn("blade/runner.js");

  // ns.tprint(ns.singularity.getAugmentationFactions("BrachiBlades"));
}
