import { BladeburnerCurAction, NS, Player } from "@ns";
import { Action } from "blade/action";

export async function main(ns: NS): Promise<void> {
  await new BladeRunner(ns).run();
}

interface StringNumberDictionary {
  [index: string]: number;
}

class BladeRunner {
  ns: NS;
  actions: Action[] = [];
  diplomacyAction: Action;
  healAction: Action;
  restAction: Action;
  trainAction: Action;

  constructor(ns: NS) {
    this.ns = ns;
    this.diplomacyAction = new Action(ns, "General", "Diplomacy");
    this.healAction = new Action(ns, "General", "Hyperbolic Regeneration Chamber");
    this.restAction = new Action(ns, "General", "Field Analysis");
    this.trainAction = new Action(ns, "General", "Training");
  }

  async run(): Promise<void> {
    this.preloadActions();
    const ns = this.ns;

    if (this.currentAction) {
      ns.tprintf(
        "[blade]: Waiting for current action (%s) to complete in %s",
        this.currentAction.name,
        ns.tFormat(this.currentAction.remainingTime),
      );
      await new Action(ns, this.currentAction.type, this.currentAction.name).waitUntilComplete();
    }

    while (true) {
      this.buySkills();
      this.setTeamMembers();

      const guidance = this.calculateGuidance();
      switch (guidance) {
        case "heal":
          await this.healAction.startAndWait();
          break;
        case "diplomacy":
          await this.diplomacyAction.startAndWait();
          break;
        case "rest":
          await this.restAction.startAndWait();
          break;
        case "work":
          const action = this.bestThingToWorkOn();
          if (action) {
            await action.startAndWait();
          } else {
            await this.trainAction.startAndWait();
          }
          break;
      }

      await ns.bladeburner.nextUpdate();
    }
  }

  // Don't know what to do, so let's buy cheapest all the time
  AvoidSkills = ["Datamancer", "Cyber's Edge"];
  buySkills(): void {
    while (this.ns.bladeburner.getSkillPoints() > 0) {
      const cheapest = this.ns.bladeburner
        .getSkillNames()
        .filter((name) => !this.AvoidSkills.includes(name))
        .sort(
          (a, b) =>
            this.ns.bladeburner.getSkillUpgradeCost(a) - this.ns.bladeburner.getSkillUpgradeCost(b),
        )[0];

      if (this.ns.bladeburner.upgradeSkill(cheapest)) {
        this.ns.tprintf(
          "[blade]: Upgraded skill %s to %s",
          cheapest,
          this.ns.bladeburner.getSkillLevel(cheapest),
        );
      } else {
        break;
      }
    }
  }

  setTeamMembers(): void {
    const teamSize = this.ns.bladeburner.getTeamSize();
    if (teamSize > 0) {
      this.actions.forEach((action) => {
        this.ns.bladeburner.setTeamSize(action.type, action.name, teamSize);
      });
    }
  }

  /**
   * Figure out what to do.
   * We probably want to do contracts most of the time, at least at the beginning.
   * Then we'll want to do Operations, and at some point BlackOps.
   * However, we need to care about:
   * - Staying healthy. Switch to Regeneration Chamber if we're low on HP. Hospital if wealthy?
   * - Stamina?!
   * - City maintenance. Travel!?!? Let's start focusing on one city.
   * - Diplomacy / Incite Violence (why would you want to incite violence?)
   * - Does it make sense to train at some point?
   */
  calculateGuidance(): "heal" | "work" | "rest" | "diplomacy" {
    const ns = this.ns;

    // if (this.player.hp.current < this.player.hp.max * 0.5) {
    //   retulrn "heal";
    // if (this.cityChaos > 0.5) {
    //   return "diplomacy";
    // } else if (this.staminaPercent < 0.9) {
    //   if (this.cityChaos > 0.5) {
    //     return "diplomacy";
    //   } else {
    //     return "rest";
    //   }
    // } else {
    //   return "work";
    // }

    if (this.staminaPercent < 0.9) {
      return "rest";
    } else {
      return "work";
    }
  }

  private get cityChaos(): number {
    return this.ns.bladeburner.getCityChaos(this.ns.bladeburner.getCity());
  }

  private get staminaPercent(): number {
    const [current, max] = this.ns.bladeburner.getStamina();
    return current / max;
  }

  private bestThingToWorkOn(): Action | void {
    const ns = this.ns;

    if (this.readyForBlackOp && this.nextBlackOp != null) {
      this.nextBlackOp.setToOptimalCityAndLevel();

      if (this.nextBlackOp.chance.average >= 0.7) {
        return this.nextBlackOp;
      }
    }

    let maxLevel = 0;
    this.actions.forEach((action) => {
      const actionMaxLevel = action.maxLevel;
      if (action.maxLevel > maxLevel) {
        maxLevel = action.maxLevel;
      }
    });

    const prioMoney = this.readyForBlackOp;
    const priorities: StringNumberDictionary = {
      Contracts: prioMoney ? 100.0 : 1.0,
      Operations: prioMoney ? 1.0 : 100.0,
      BlackOps: 500.0,
    };
    let bestAction;
    let bestScore = 0;
    this.actions.forEach((action) => {
      if (action.remaining >= 1.0) {
        action.setToOptimalCityAndLevel();
        if (action.chance.average >= 0.8) {
          const score = action.adjustedActionScore(maxLevel, priorities[action.type] || 1.0);
          if (score > bestScore) {
            bestScore = score;
            bestAction = action;
          }
        }
      }
    });

    if (bestAction == null) {
      ns.tprintf("[blade]: No action found :(");
    } else {
      // ns.tprintf("[blade]: Best action is %s with score %s", bestAction.name, bestScore.toFixed(2));
      return bestAction;
    }
  }

  private get player(): Player {
    return this.ns.getPlayer();
  }

  private get currentAction(): Action | void {
    const currentAction = this.ns.bladeburner.getCurrentAction();
    if (currentAction) {
      return new Action(this.ns, currentAction.type, currentAction.name);
    }
  }

  private get nextBlackOp(): Action | void {
    const blackOp = this.ns.bladeburner.getNextBlackOp();
    if (blackOp) {
      return new Action(this.ns, "BlackOps", blackOp.name);
    }
  }

  private get readyForBlackOp(): boolean {
    if (this.nextBlackOp) {
      return (
        this.ns.bladeburner.getBlackOpRank(this.nextBlackOp.name) <= this.ns.bladeburner.getRank()
      );
    } else {
      return false;
    }
  }

  AvoidTasks = ["Raid"];
  private preloadActions(): void {
    this.ns.bladeburner.getContractNames().forEach((name) => {
      if (!this.AvoidTasks.includes(name)) {
        this.actions.push(new Action(this.ns, "Contracts", name));
        this.ns.bladeburner.setActionAutolevel("Contracts", name, false);
      }
    });
    this.ns.bladeburner.getOperationNames().forEach((name) => {
      if (!this.AvoidTasks.includes(name)) {
        this.actions.push(new Action(this.ns, "Operations", name));
        this.ns.bladeburner.setActionAutolevel("Operations", name, false);
      }
    });
  }
}
