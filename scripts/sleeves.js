import { nextAugs, nextFactions } from "./nextfaction";
import {
  gym,
  maxCombat,
  crimeForMoney,
  nextCompanies,
  businessPositions,
  softwarePositions,
  getCompanyPosition,
} from "./common.js";

/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    const sleeves = ns.sleeve.getNumSleeves();

    // micromanage all sleeves except last one
    // reset first to prevent conflicts
    const augs = await nextAugs(ns);
    const bladeburnerNeeded = augs.some((aug) =>
      ns
        .getPlayer()
        .factions.filter((i) =>
          ns.singularity.getAugmentationsFromFaction(i).includes(aug),
        )
        .includes("Bladeburners"),
    );

    const bladeburnerSleeves = bladeburnerNeeded ? 2 : 0;

    for (let i = 0; i < sleeves - bladeburnerSleeves; i++) {
      const task = ns.sleeve.getTask(i);
      if (!task || task.crimeType !== crimeForMoney(ns)) {
        ns.sleeve.setToIdle(i);
      }
    }
    let factions = await nextFactions(ns);
    let companies = nextCompanies(ns);

    for (let i = 0; i < sleeves - bladeburnerSleeves; i++) {
      const task = ns.sleeve.getTask(i);

      const company = companies[0];
      const position = getCompanyPosition(ns, company);
      const money = ns.getServerMoneyAvailable("home");
      const random = Math.random();

      const sleeve = ns.sleeve.getSleeve(i);
      if (sleeve.shock) {
        ns.sleeve.setToShockRecovery(i);
      } else if (sleeve.sync < 100) {
        ns.sleeve.setToSynchronize(i);
      } else if (
        (maxCombat(ns) >= 100 &&
          (ns.heart.break() > -90 || ns.getPlayer().numPeopleKilled < 30)) ||
        (!factions.length && !position && random < 0.25)
      ) {
        if (!task || task.crimeType !== "Homicide") {
          ns.sleeve.setToCommitCrime(i, "Homicide");
        }
      } else if (money < 0 && !position) {
        if (!task || task.crimeType !== crimeForMoney(ns)) {
          ns.sleeve.setToCommitCrime(i, crimeForMoney(ns));
        }
      } else if (factions.length) {
        for (let type of ["hacking", "security", "field"]) {
          const tryWork = ns.sleeve.setToFactionWork(i, factions[0], type);
          if (tryWork) {
            factions = factions.slice(1);
            break;
          }
        }
      } else {
        if (random < 0.25 && !position && money >= 0) {
          ns.sleeve.travel(i, "Sector-12");
          ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", gym(ns));
        } else if (
          businessPositions.includes(position) ||
          softwarePositions.includes(position)
        ) {
          ns.sleeve.setToCompanyWork(i, company);
          companies = companies.slice(1);
        } else if (
          !position.startsWith("Chief") &&
          !position.endsWith("Officer")
        ) {
          ns.sleeve.travel(i, "Volhaven");
          const skills = ns.getPlayer().skills;
          const course =
            skills.charisma < skills.hacking ? "Leadership" : "Algorithms";
          ns.sleeve.setToUniversityCourse(
            i,
            "ZB Institute of Technology",
            course,
          );
        } else {
          ns.sleeve.travel(i, "Sector-12");
          ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", gym(ns));
        }
      }
    }

    // last sleeve does bladeburner
    if (bladeburnerSleeves) {
      let bladeburnerScripts = ns
        .ps()
        .filter((i) => i.filename === "bladeburner.js");
      if (
        bladeburnerScripts.some((i) => i.args.length !== bladeburnerSleeves)
      ) {
        ns.run("killall.js", 1, "true", "bladeburner.js");
      }
      for (let i = sleeves - bladeburnerSleeves; i < sleeves; i++) {
        bladeburnerScripts = ns
          .ps()
          .filter((p) => p.filename === "bladeburner.js");
        ns.run("bladeburner.js", 1, i);
      }
    } else {
      ns.run("killall.js", 1, "true", "bladeburner.js");
    }

    for (let i = 0; i < sleeves; i++) {
      for (let aug of ns.sleeve
        .getSleevePurchasableAugs(i)
        .map((aug) => aug.name)) {
        ns.sleeve.purchaseSleeveAug(i, aug);
      }
    }

    await ns.sleep(5000);
  }
}
