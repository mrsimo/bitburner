import { CityName, NS } from "@ns";
import { Chance } from "blade/chance";
import { Action } from "blade/action";

interface StringNumberDictionary {
  [index: string]: number;
}
export async function main(ns: NS): Promise<void> {
  const actions = preloadActions(ns);

  // actions.forEach((action) => {
  //   const level =
  //     action.type != "General" ? ns.bladeburner.getActionCurrentLevel(action.type, action.name) : 0;
  //   ns.tprintf(
  //     "%s Lvl.%s (%s)  - %s (%s) - %s remaining",
  //     action.name,
  //     level,
  //     action.type,
  //     action.actionScore.toFixed(2),
  //     action.chance.format(),
  //     action.remaining.toFixed(1),
  //   );
  // });

  let maxLevel = 0;
  actions.forEach((action) => {
    const actionMaxLevel = action.maxLevel;
    if (action.maxLevel > maxLevel) {
      maxLevel = action.maxLevel;
    }
  });

  const prioMoney = true;
  const priorities: StringNumberDictionary = {
    Contracts: prioMoney ? 10.0 : 1.0,
    Operations: prioMoney ? 1.0 : 10.0,
    BlackOps: 50.0,
  };

  actions.forEach((action) => {
    action.setToOptimalCityAndLevel();
    const city = ns.enums.CityName[action.optimalCity as keyof typeof CityName] || "Sector-12";
    const adjustment = priorities[action.type] || 1.0;
    ns.tprintf(
      "%s Lvl.%s/%s (%s) in %s pop=%s chaos=%s, score=%s adjscore=%s chance=%s",
      action.name,
      action.optimalLevel,
      action.maxLevel,
      action.type,
      action.optimalCity,
      ns.formatNumber(ns.bladeburner.getCityEstimatedPopulation(city)),
      ns.bladeburner.getCityChaos(city).toFixed(2),
      action.actionScore.toFixed(2),
      action.adjustedActionScore(maxLevel, priorities[action.type] || 1.0).toFixed(2),
      Math.round(action.chance.average * 100) + "%",
    );
  });
}

const AvoidTasks = ["Raid"];
function preloadActions(ns: NS): Action[] {
  let actions: Action[] = [];
  ns.bladeburner.getContractNames().forEach((name) => {
    if (!AvoidTasks.includes(name)) actions.push(new Action(ns, "Contracts", name));
  });
  ns.bladeburner.getOperationNames().forEach((name) => {
    if (!AvoidTasks.includes(name)) actions.push(new Action(ns, "Operations", name));
  });

  const blackOp = ns.bladeburner.getNextBlackOp();
  if (blackOp) actions.push(new Action(ns, "BlackOps", blackOp.name));

  return actions;
}

function getChance(ns: NS, type: string, name: string): Chance {
  const chances = ns.bladeburner.getActionEstimatedSuccessChance(type, name);
  return new Chance(chances[0], chances[1]);
}
