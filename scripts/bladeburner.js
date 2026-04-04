import { gym } from "./common.js";

const limits = {
  Cloak: 25,
  "Short Circuit": 25,
  Tracer: 10,
  Datamancer: 0,
  "Cybers Edge": 0,
  "Hands Of Midas": 0,
  Hyperdrive: 20,
};

function isNumeric(str) {
  return !isNaN(parseFloat(str)) && isFinite(str);
}

/** @param {NS} ns */
export async function main(ns) {
  const sleeves = ns.sleeve.getNumSleeves();
  const sleeveNo = Number(ns.args[0]);
  const validSleeve = !isNaN(sleeveNo) && sleeveNo < sleeves && sleeveNo >= 0;

  ns.bladeburner.joinBladeburnerDivision();
  if (ns.bladeburner.inBladeburner()) {
    ns.bladeburner.joinBladeburnerFaction();
  }

  const contracts = ns.bladeburner.getContractNames();
  const operations = ns.bladeburner.getOperationNames();

  while (true) {
    if (!ns.bladeburner.inBladeburner()) {
      await ns.sleep(60000);
      continue;
    }

    const recruitmentViable =
      ns.bladeburner.getActionEstimatedSuccessChance(
        "General",
        "Recruitment",
        sleeveNo,
      )[0] === 1;
    let generalAction = recruitmentViable ? "Recruitment" : "Training";
    let action = ["General", generalAction];

    let chance = [0, 0];

    const ls = [0, 2, 1];
    for (let i = 0; i < 3; i++) {
      const nchance = ns.bladeburner.getActionEstimatedSuccessChance(
        "Contracts",
        contracts[ls[i]],
        sleeveNo,
      );
      if (
        nchance[1] === 1 &&
        ns.bladeburner.getActionCountRemaining("Contracts", contracts[ls[i]]) >=
          1
      ) {
        action = ["Contracts", contracts[ls[i]]];
        chance = nchance;
      }
    }

    for (let i = 0; i < 2; i++) {
      ns.bladeburner.setTeamSize(
        "Operations",
        operations[i],
        ns.bladeburner.getTeamSize(),
      );
      const nchance = ns.bladeburner.getActionEstimatedSuccessChance(
        "Operations",
        operations[i],
        sleeveNo,
      );
      if (
        nchance[1] === 1 &&
        ns.bladeburner.getActionCountRemaining("Operations", operations[i]) >= 1
      ) {
        action = ["Operations", operations[i]];
        chance = nchance;
      }
    }

    const nextBlackOp = ns.bladeburner.getNextBlackOp();
    if (nextBlackOp) {
      ns.bladeburner.setTeamSize(
        "Black Operations",
        nextBlackOp.name,
        ns.bladeburner.getTeamSize(),
      );
      const nchance = ns.bladeburner.getActionEstimatedSuccessChance(
        "Black Operations",
        nextBlackOp.name,
        sleeveNo,
      );
      if (nextBlackOp.rank <= ns.bladeburner.getRank() && nchance[1] >= 0.5) {
        action = ["Black Operations", nextBlackOp.name];
        chance = nchance;
      }
    }

    if (chance[0] !== chance[1]) {
      action = ["General", "Field Analysis"];
    }

    const city = ns.bladeburner.getCity();
    const chaos = ns.bladeburner.getCityChaos(city);
    if (chaos >= 50) {
      action = ["General", "Diplomacy"];
    }

    const stamina = ns.bladeburner.getStamina();
    if (stamina[0] < stamina[1] - 5) {
      action = ["General", "Hyperbolic Regeneration Chamber"];
    }
    if (validSleeve) {
      const sleeve = ns.sleeve.getSleeve(sleeveNo);
      if (sleeve.shock) {
        ns.sleeve.setToShockRecovery(sleeveNo);
        action = ["Sleeve", "Shock Recovery"];
      } else if (sleeve.sync < 100) {
        ns.sleeve.setToSynchronize(sleeveNo);
        action = ["Sleeve", "Synchronize"];
      }
    }

    const current = ns.bladeburner.getCurrentAction();
    const focus = ns.singularity.isFocused();
    if (
      (current && current.type === action[0] && current.name === action[1]) ||
      action[0] === "Sleeve"
    ) {
    } else if (action[0] === "General" && action[1] === "Training") {
      if (validSleeve) {
        ns.sleeve.travel(sleeveNo, "Sector-12");
        ns.sleeve.setToGymWorkout(sleeveNo, "Powerhouse Gym", gym(ns));
      } else {
        ns.singularity.gymWorkout("Powerhouse Gym", gym(ns), focus);
      }
    } else {
      if (validSleeve) {
        switch (action[0]) {
          case "General":
            ns.sleeve.setToBladeburnerAction(sleeveNo, action[1]);
            break;
          case "Contracts":
          case "Operations":
          case "Black Operations":
            ns.sleeve.setToBladeburnerAction(
              sleeveNo,
              "Take on contracts",
              action[1],
            );
            break;
        }
      } else {
        ns.bladeburner.startAction(...action);
      }
    }

    let min = 0;
    while (ns.bladeburner.getSkillPoints() >= min) {
      const skills = ns.bladeburner.getSkillNames();
      const ls = [];

      for (let skill of skills) {
        const limit =
          Object.keys(limits).includes(skill) &&
          limits[skill] <= ns.bladeburner.getSkillLevel(skill);
        if (
          ns.bladeburner.getSkillPoints() >= min &&
          ns.bladeburner.getSkillUpgradeCost(skill, 1) === min &&
          !limit
        ) {
          ns.bladeburner.upgradeSkill(skill, 1);
          ns.tprint("upgrading ", skill, " for ", min, " points");
        }
        if (!limit) {
          ls.push(ns.bladeburner.getSkillUpgradeCost(skill, 1));
        }
      }

      min = Math.min(...ls);
      await ns.sleep(50);
    }

    const factor = ns.bladeburner.getBonusTime() > 10000 ? 0.2 : 1;
    let duration = 0;
    if (action[0] === "Sleeve") {
      duration = 1000;
    } else {
      duration =
        ns.bladeburner.getActionTime(...action) -
        ns.bladeburner.getActionCurrentTime();
    }
    await ns.sleep(duration * factor + 500);
  }
}
