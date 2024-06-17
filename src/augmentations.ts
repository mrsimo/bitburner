import { NS } from "@ns";
import { toMoney } from "lib/money";

class Augmentation {
  ns: NS;
  name: string;
  factions: string[];
  price: number;

  constructor(ns: NS, name: string) {
    this.ns = ns;
    this.name = name;
    this.factions = ns.singularity.getAugmentationFactions(name);
    this.price = ns.singularity.getAugmentationBasePrice(name);
  }
}

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([["faction", []]]);

  let factions;
  if (options.faction instanceof Array) {
    if (options.faction.length == 0) {
      ns.tprintf("Need to specify at least one faction with --faction <faction>");
      ns.exit();
    } else {
      factions = options.faction.map((faction) => String(faction));
    }
  } else {
    factions = [String(options.faction)];
  }
  let augmentationNames = new Set(
    factions.flatMap((faction) => ns.singularity.getAugmentationsFromFaction(faction)),
  );
  let installed = new Set(ns.singularity.getOwnedAugmentations(true));

  installed.forEach((name) => augmentationNames.delete(name));

  const augmentations = [...augmentationNames].map((name) => new Augmentation(ns, name));

  ns.tprintf("Augmentations:");
  augmentations.forEach((augmentation) => {
    ns.tprintf(
      "- %s from %s (%s)",
      augmentation.name,
      augmentation.factions.join(", "),
      toMoney(augmentation.price),
    );
  });
}
