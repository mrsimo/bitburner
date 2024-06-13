import { NS } from "@ns";

export class Chance {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  get average(): number {
    return (this.min + this.max) / 2;
  }

  get absMin(): number {
    return Math.min(Math.max(this.min, 0), 1);
  }

  get absMax(): number {
    return Math.min(Math.max(this.max, 0), 1);
  }

  get absMinPercent(): number {
    return Math.round(Math.min(Math.max(this.min * 100, 0), 100));
  }

  get absMaxPercent(): number {
    return Math.round(Math.min(Math.max(this.max * 100, 0), 100));
  }

  format(): string {
    if (this.absMin == this.absMax) {
      return `${this.absMinPercent}%`;
    } else {
      return `${this.absMinPercent}% - ${this.absMaxPercent}%`;
    }
  }
}
