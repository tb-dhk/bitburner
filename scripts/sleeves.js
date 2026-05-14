import { nextFactions, nextAugs, untouchedAugs } from "./nextfaction";
import {
  gym,
  minCombat,
  crimeForMoney,
  nextCompanies,
  businessPositions,
  softwarePositions,
  getCompanyPosition,
  study,
  needTor,
  workTypes,
} from "./common";

/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    const sleeves = ns.sleeve.getNumSleeves();

    // micromanage all sleeves except last one
    // reset first to prevent conflicts
    let factions = (await nextFactions(ns)).filter(
      (i) => !ns.gang.inGang() || i !== ns.gang.getGangInformation().faction,
    );
    let companies = nextCompanies(ns);

    for (let i = 0; i < sleeves; i++) {
      const task = ns.sleeve.getTask(i);
      if (!task || ["FACTION", "COMPANY"].includes(task.type)) {
        ns.sleeve.setToIdle(i);
      }
    }

    for (let i = 0; i < sleeves; i++) {
      const task = ns.sleeve.getTask(i);

      const company = companies[0];
      const position = getCompanyPosition(ns, company);
      const money = ns.getServerMoneyAvailable("home");
      const random = Math.random();
      const augs = await nextAugs(ns);

      const sleeve = ns.sleeve.getSleeve(i);

      function gymStudyCrime(ns, chance, i) {
        if (random < chance) {
          ns.sleeve.travel(i, "Sector-12");
          ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", gym(ns));
        } else {
          ns.sleeve.travel(i, "Volhaven");
          ns.sleeve.setToUniversityCourse(
            i,
            "ZB Institute of Technology",
            study(ns),
          );
        }
      }

      // if in shock, recover
      if (sleeve.shock) {
        ns.sleeve.setToShockRecovery(i);
        // if out of sync, resync
      } else if (sleeve.sync < 100) {
        ns.sleeve.setToSynchronize(i);
        // if you have insufficient crime stats and high enough combat, do crime
      } else if (
        (minCombat(ns) >= 100 && ns.getPlayer().numPeopleKilled < 30) ||
        (ns.heart.break() > -54000 && !untouchedAugs(ns).length)
      ) {
        if (!task || task.crimeType !== "Homicide") {
          ns.sleeve.setToCommitCrime(i, "Homicide");
        }
        // if you're broke, do crime
      } else if (
        money < 0 ||
        needTor(ns) ||
        (augs.length && !factions.length)
      ) {
        if (!task || task.crimeType !== crimeForMoney(ns)) {
          ns.sleeve.setToCommitCrime(i, crimeForMoney(ns));
        }
        // if your next task is to work on another faction, do that
      } else if (
        factions[0] &&
        factions[0] !== "Bladeburners" &&
        factions[0] !== ns.gang.getGangInformation().faction
      ) {
        const workType = workTypes.filter((i) =>
          ns.singularity.getFactionWorkTypes(factions[0]).includes(i),
        )[0];
        ns.sleeve.setToFactionWork(i, factions[0], workType);
        factions = factions.slice(1);
        // if your next task is to work on bladeburners, support main sleeve on bladeburner
      } else if (
        ns.bladeburner.inBladeburner() &&
        ns.bladeburner.getCurrentAction()
      ) {
        ns.sleeve.setToBladeburnerAction(i, "Support main sleeve");
        // if your next task is to work and you're not employed and not an executive,
        // get a software job first or study
        // application is done by main sleeve
      } else if (
        businessPositions.includes(position) ||
        softwarePositions.includes(position)
      ) {
        ns.sleeve.setToCompanyWork(i, company);
        companies = companies.slice(1);
      } else {
        gymStudyCrime(ns, 0.5, i);
      }

      for (let aug of ns.sleeve
        .getSleevePurchasableAugs(i)
        .map((aug) => aug.name)) {
        if (
          ns.getPlayer().money >=
          ns.sleeve.getSleeveAugmentationPrice(aug) * 1000
        ) {
          ns.tprint("[sleeves] buying ", aug, " for sleeve ", i);
          ns.sleeve.purchaseSleeveAug(i, aug);
        }
      }
    }

    await ns.sleep(100);
  }
}
