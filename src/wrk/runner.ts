import { CompanyName, JobName, NS, Skills } from "@ns";
import { WarehouseAPI, CompanyWorkTask, CompanyPositionInfo } from "../../NetscriptDefinitions";

const Companies = [
  "Four Sigma",
  "ECorp",
  "MegaCorp",
  "KuaiGong International",
  "NWO",
  "Blade Industries",
  "OmniTek Incorporated",
  "Bachman & Associates",
  "Clarke Incorporated",
  "Fulcrum Secret Technologies",
];
export async function main(ns: NS): Promise<void> {
  for (const c of Companies) {
    const company = c as CompanyName;
    while (true) {
      const reputation = ns.singularity.getCompanyRep(company);
      const favor = ns.singularity.getCompanyFavor(company);

      const availablePositions = ns.singularity.getCompanyPositions(company).filter((position) => {
        const reqs = ns.singularity.getCompanyPositionInfo(company, position);

        return reqs.requiredReputation <= reputation && enoughSkills(ns, reqs.requiredSkills);
      });

      const bestPosition = availablePositions.sort(
        (a, b) => positionRep(ns, company, b, favor) - positionRep(ns, company, a, favor),
      )[0];

      ns.singularity.applyToCompany(
        company,
        ns.singularity.getCompanyPositionInfo(company, bestPosition).field,
      );
      ns.singularity.workForCompany(company, false);
      await ns.sleep(10000);
    }
  }
}

function positionRep(ns: NS, company: CompanyName, position: JobName, favor: number): number {
  return ns.formulas.work.companyGains(ns.getPlayer(), company, position, favor).reputation;
}

function enoughSkills(ns: NS, skills: Skills): boolean {
  const mySkills = ns.getPlayer().skills;

  // @ts-ignore
  return Object.keys(skills).every((skill) => mySkills[skill] >= skills[skill]);
}
