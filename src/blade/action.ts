import { NS, CityName } from "@ns";
import { Chance } from "blade/chance";

export class Action {
  ns: NS;
  type: string;
  name: string;
  optimalCity?: string;
  optimalLevel?: number;

  constructor(ns: NS, type: string, name: string) {
    this.ns = ns;
    this.type = type;
    this.name = name;
  }

  start(): boolean {
    this.moveToOptimalCity();
    return this.ns.bladeburner.startAction(this.type, this.name);
  }

  async waitUntilComplete(): Promise<void> {
    await this.ns.sleep(this.remainingTime);
  }

  get remainingTime(): number {
    return (
      this.ns.bladeburner.getActionTime(this.type, this.name) -
      this.ns.bladeburner.getActionCurrentTime()
    );
  }

  async startAndWait(): Promise<void> {
    if (this.start()) {
      const level =
        this.type != "General"
          ? this.ns.bladeburner.getActionCurrentLevel(this.type, this.name)
          : 0;
      this.ns.tprintf(
        "[blade]: Starting action: %s Lv.%s (%s)%s - %s (%s)",
        this.name,
        level,
        this.type,
        this.optimalCity ? this.ns.sprintf("- in %s", this.optimalCity) : "",
        this.actionScore.toFixed(2),
        this.chance.format(),
      );
      await this.waitUntilComplete();
    } else {
      this.ns.tprintf("[blade]: Failed to start action: %s (%s)", this.name, this.type);
    }
  }

  get actionScore(): number {
    return this.repGain * this.chance.average;
  }

  adjustedActionScore(knownMaxLevel: number, multiplier: number): number {
    const adjustmentFactor = this.maxLevel / knownMaxLevel;
    return (this.actionScore / adjustmentFactor) * multiplier;
  }

  get maxLevel(): number {
    return this.hasLevels ? this.ns.bladeburner.getActionMaxLevel(this.type, this.name) : 1;
  }

  get hasLevels(): boolean {
    return !["BlackOps", "General"].includes(this.type);
  }

  get remaining(): number {
    return this.ns.bladeburner.getActionCountRemaining(this.type, this.name);
  }

  get repGain(): number {
    return this.ns.bladeburner.getActionRepGain(this.type, this.name);
  }

  get chance(): Chance {
    const chances = this.ns.bladeburner.getActionEstimatedSuccessChance(this.type, this.name);
    return new Chance(chances[0], chances[1]);
  }

  setToOptimalCity(): void {
    let maxCity = "";
    let maxChance = 0.0;

    Object.values(this.ns.enums.CityName).forEach((city) => {
      this.ns.bladeburner.switchCity(city);
      const chance = this.chance.average;
      if (chance > maxChance) {
        maxCity = city;
        maxChance = chance;
      }
    });

    this.optimalCity = maxCity;
  }

  setToOptimalCityAndLevel(): void {
    this.setToOptimalCity();
    let score = 0;
    let previousScore = -1;
    let level = 0;
    if (this.hasLevels) {
      level = this.maxLevel;
      while (level >= 1 && score > previousScore) {
        this.ns.bladeburner.setActionLevel(this.type, this.name, level);
        previousScore = score;
        score = this.actionScore;
        level--;
      }
    }

    this.optimalLevel = level;
  }

  moveToOptimalCity(): void {
    if (this.optimalCity != null)
      this.ns.bladeburner.switchCity(
        this.ns.enums.CityName[this.optimalCity as keyof typeof CityName],
      );
  }
}
