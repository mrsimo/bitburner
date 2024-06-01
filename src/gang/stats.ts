import { NS } from "@ns";
import { toMoney } from "lib/money";

export async function main(ns: NS): Promise<void> {
  ns.tprintf("======== Gang Information ========");
  ns.tprint(ns.gang.getGangInformation());

  ns.tprintf("======== Task Information ========");
  ns.gang.getTaskNames().forEach((name) => {
    const stats = ns.gang.getTaskStats(name);
    ns.tprint(stats);
  });

  ns.tprintf("======== Members and their ascensions ========");
  ns.gang.getMemberNames().forEach((name) => {
    ns.tprint(name, ns.gang.getMemberInformation(name), ns.gang.getAscensionResult(name));
  });

  ns.tprintf("======== Equipment ========");
  ns.gang.getEquipmentNames().forEach((equipment) => {
    ns.tprintf(
      "%s: hack=%s cost=%s",
      equipment,
      ns.gang.getEquipmentStats(equipment).hack,
      toMoney(ns.gang.getEquipmentCost(equipment)),
    );
  });

  let member = ns.gang.getMemberInformation("member-03");
  ns.tprintf("======== Productivity table for %s ========", member.name);
  const tasks = ns.gang.getTaskNames().map((name) => ns.gang.getTaskStats(name));
  tasks.forEach((task) => {
    if (task.name != "Unassigned") {
      ns.gang.setMemberTask(member.name, task.name);
      const info = ns.gang.getMemberInformation(member.name);

      let moneyRatio =
        Math.round((info.moneyGain * task.difficulty ** 2) / info.wantedLevelGain) || 0;
      let respectRatio =
        Math.round((info.respectGain * task.difficulty ** 2) / info.wantedLevelGain) || 0;
      ns.tprintf(
        "%s when %s: difficulty=%s\tmoney=%s\twanted=%s\trespect=%s\t| moneyratio=%s\trespectratio=%s\tboth=%s",
        member.name,
        task.name.padStart(22, " "),
        task.difficulty.toFixed(1),
        toMoney(info.moneyGain),
        info.wantedLevelGain.toFixed(4),
        info.respectGain.toFixed(2),
        ns.formatNumber(moneyRatio).padEnd(6, " "),
        ns.formatNumber(respectRatio).padEnd(6, " "),
        ns.formatNumber(moneyRatio + respectRatio).padEnd(6, " "),
      );
    }
  });

  member = ns.gang.getMemberInformation("member-12");
  let result = ns.gang.getAscensionResult(member.name)?.hack || 0;
  ns.tprintf("Ascension stuff: %s", member.hack_asc_mult * result - member.hack_asc_mult);
  ns.tprint(member, result);
}
