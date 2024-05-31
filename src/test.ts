import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  // ns.gang.getTaskNames().forEach((name) => {
  //   const stats = ns.gang.getTaskStats(name);
  //   ns.tprint(stats);
  // });

  // ns.tprint(ns.gang.getGangInformation());

  // ns.gang.getMemberNames().forEach((name) => {
  //   ns.tprint(ns.gang.getMemberInformation(name));
  //   ns.tprint(ns.gang.getAscensionResult(name));
  // });

  const tasks = ns.gang.getTaskNames().map((name) => ns.gang.getTaskStats(name));
  let member = ns.gang.getMemberInformation("member-03");
  tasks.forEach((task) => {
    if (task.name != "Unassigned") {
      ns.gang.setMemberTask(member.name, task.name);
      const info = ns.gang.getMemberInformation(member.name);

      let moneyRatio =
        Math.round((info.moneyGain * task.difficulty ** 3) / info.wantedLevelGain) || 0;
      let respectRatio =
        Math.round((info.respectGain * task.difficulty ** 3) / info.wantedLevelGain) || 0;
      ns.tprintf(
        "%s when %s: difficulty=%s\tmoney=%s\twanted=%s\trespect=%s\t| moneyratio=%s\trespectratio=%s\tboth=%s",
        member.name,
        task.name.padStart(22, " "),
        task.difficulty.toFixed(1),
        info.moneyGain.toFixed(2),
        info.wantedLevelGain.toFixed(4),
        info.respectGain.toFixed(2),
        ns.formatNumber(moneyRatio).padEnd(6, " "),
        ns.formatNumber(respectRatio).padEnd(6, " "),
        ns.formatNumber(moneyRatio + respectRatio).padEnd(6, " "),
      );
    }
  });

  // ns.gang.getEquipmentNames().forEach((equipment) => {
  //   ns.tprint(equipment, ": ", ns.gang.getEquipmentStats(equipment));
  // });
  // member = ns.gang.getMemberInformation("member-06");
  // ns.tprint(member);
}
