import { NS, GangGenInfo, GangMemberInfo, GangTaskStats } from "@ns";
import { isHackable } from "/lib/hackable";

export async function main(ns: NS): Promise<void> {
  await new GangManager(ns).work();
}

class GangManager {
  private ns: NS;
  guidance: string;

  constructor(ns: NS) {
    this.ns = ns;
    this.guidance = "unknown";
    this.configTail();
  }

  public async work(): Promise<void> {
    while (true) {
      this.run();
      await this.ns.gang.nextUpdate();
    }
  }

  public run(): void {
    this.handleRecruitment();
    this.handleAscensions();
    this.handleWorkAssignments();
  }

  public handleRecruitment(): void {
    while (this.ns.gang.canRecruitMember()) {
      const name = this.ns.sprintf("member-%s", String(this.members.length + 1).padStart(2, "0"));
      this.ns.printf("[recruitment] Recruiting member %s", name);
      this.ns.gang.recruitMember(name);
    }
  }

  public handleAscensions(): void {
    this.members.forEach((member) => {
      const result = this.ns.gang.getAscensionResult(member.name)?.hack || 0;

      if (result >= 7) {
        this.ns.gang.ascendMember(member.name);
        this.ns.printf("[ascension] %s ascended", member.name);
      }
    });
  }

  public handleWorkAssignments(): void {
    // First we figure out the genral guidance we need for next cycle
    if (this.info.wantedLevel > 15) {
      this.setGuidance("lower-wanted");
    } else if (this.info.wantedLevel < 5) {
      this.setGuidance("increase-money");
    }

    // Any particularly low hack skill members should be trained
    const membersByHackSkill = this.members.sort((a, b) => a.hack - b.hack);
    const highestHackSkill = membersByHackSkill.at(-1)?.hack || 0;

    let remainingMembers: GangMemberInfo[] = [];
    this.members.forEach((member) => {
      if (member.hack < highestHackSkill * 0.9) {
        this.assignTask(member, "Train Hacking");
      } else {
        remainingMembers.push(member);
      }
    });

    // Have at least one person training hacking at all times
    if (remainingMembers.length == this.members.length) {
      let member = remainingMembers.pop();
      if (member) this.assignTask(member, "Train Hacking");
    }

    this.assignMostNeededTasks(remainingMembers);
  }

  private assignMostNeededTasks(members: GangMemberInfo[]): void {
    switch (this.guidance) {
      case "lower-wanted":
        members.forEach((member) => this.assignTask(member, "Ethical Hacking"));
        break;
      default:
      case "increase-money":
        members.forEach((member) => this.assignBestMoneyMakingTask(member));
        break;
    }
  }

  // Phishing: "respectGain":0.03491795808057492,"wantedLevelGain":0.0007912906662902485,"moneyGain":243.30295578481642
  // Ransomware: "respectGain":0.026886803004769512,"wantedLevelGain":0.00002348533589563684,"moneyGain":127.82910757343774
  private assignBestMoneyMakingTask(member: GangMemberInfo): void {
    const originalTask = member.task;

    let bestTask = "Phishing";
    let bestScore = 0;
    this.tasks.forEach((task) => {
      this.ns.gang.setMemberTask(member.name, task.name);
      const score = this.taskScore(this.ns.gang.getMemberInformation(member.name));
      if (score > bestScore) {
        bestTask = task.name;
        bestScore = score;
      }
    });

    this.ns.gang.setMemberTask(member.name, originalTask);
    this.assignTask(member, bestTask);
  }

  private taskScore(info: GangMemberInfo): number {
    return info.respectGain / info.wantedLevelGain;
  }

  private assignTask(member: GangMemberInfo, task: GangTaskStats | string): void {
    const taskName = typeof task === "string" ? task : task.name;
    if (member.task != taskName) {
      this.ns.gang.setMemberTask(member.name, taskName);
      this.ns.printf("[work] %s assigned %s", member.name, taskName);
    }
  }

  private setGuidance(guidance: string): void {
    if (this.guidance !== guidance) {
      this.guidance = guidance;
      this.ns.printf("[guidance] %s", guidance);
    }
  }

  private get tasks(): GangTaskStats[] {
    return this.ns.gang.getTaskNames().map((name) => this.ns.gang.getTaskStats(name));
  }

  private get info(): GangGenInfo {
    return this.ns.gang.getGangInformation();
  }

  private get members(): GangMemberInfo[] {
    return this.ns.gang.getMemberNames().map((name) => this.ns.gang.getMemberInformation(name));
  }

  private configTail() {
    this.ns.disableLog("gang.setMemberTask");
    this.ns.clearLog();
    this.ns.resizeTail(800, 300);
  }
}
