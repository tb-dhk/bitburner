import findServer from "./findserver";
import { nfgLevel, nextAugs, nextFactions, untouchedAugs } from "./nextfaction";
import {
  gym,
  cities,
  cityGroups,
  bladeburnerLimits,
  minCombat,
  crimeForMoney,
  companies,
  nextCompanies,
  businessPositions,
  softwarePositions,
  getCompanyPosition,
  study,
  needTor
} from "./common";
import { getAction } from "./bladeburner"

// helpers
function findProcess(ns, filename) {
  const processes = ns.ps().filter((i) => i.filename === filename);
  return Boolean(processes.length);
}

function nextBitNode(ns) {
  const bitNodes = [1, 2, 5, 4, 6, 10, 3, 9, 13, 14, 15, 7, 8, 11, 12];
  const currentNode = ns.getResetInfo().currentNode;
  for (let bitNode of bitNodes) {
    const bitNodeN =
      Number(ns.getResetInfo().ownedSF.get(bitNode)) +
      Number(bitNode === currentNode);
    if (!bitNodeN || bitNodeN < 3) {
      return bitNode;
    }
  }
}

/** @param {NS} ns */
export async function main(ns) {
  let count = 0;
  const interval = 100

  while (true) {
    const toRun = ["sleeves.js"];
    for (let script of toRun) {
      if (!findProcess(ns, script)) {
        ns.run(script);
      }
    }

    ns.bladeburner.joinBladeburnerDivision()

    let money = ns.getServerMoneyAvailable("home");

    for (let company of companies) {
      ns.singularity.applyToCompany(company, "Software");
      ns.singularity.applyToCompany(company, "Business");
    }

    const company = nextCompanies(ns)[0];
    const position = getCompanyPosition(ns, company);

    // work
    const factions = ns.getPlayer().factions;
    const faction = (await nextFactions(ns))[0];
    const currentWork = ns.singularity.getCurrentWork(company);
    const focus = ns.singularity.isFocused();
    const random = Math.random();
    const augs = await nextAugs(ns)

    function gymStudyCrime(ns, chance, focus) {
      if (random < chance) {
        ns.singularity.travelToCity("Sector-12");
        ns.singularity.gymWorkout("Powerhouse Gym", gym(ns), focus);
      } else {
        ns.singularity.travelToCity("Volhaven");
        ns.singularity.universityCourse(
          "ZB Institute of Technology",
          study(ns),
          focus,
        )
      }
    }

    // if you have insufficient crime stats and high enough combat, do crime
    if (
      minCombat(ns) >= 100 && (ns.getPlayer().numPeopleKilled < 30 || ns.heart.break() > -54000)
    ) {
      if (!currentWork || currentWork.crimeType !== "Homicide") {
        ns.singularity.commitCrime("Homicide", focus);
      }
    // if you're broke, do crime
    } else if (money < 0 || needTor(ns) || (augs.length && !faction)) {
      if (!currentWork || currentWork.crimeType !== crimeForMoney(ns)) {
        ns.singularity.commitCrime(crimeForMoney(ns), focus);
      }    
    // if your next task is to work on another faction, do that
    } else if (faction && faction !== "Bladeburners") {
      for (let type of ["hacking", "security", "field"]) {
        if (ns.singularity.workForFaction(faction, type, focus)) {
          break
        }
      }
    // if your next task is to work on bladeburners, do bladeburner actions
    } else if (faction === "Bladeburners" || (!factions.includes("Bladeburners") && ns.bladeburner.inBladeburner())) {
      const current = ns.bladeburner.getCurrentAction()
      const action = getAction(ns)
      if (!current || !Object.keys(current).length || current.type !== action[0] || current.name !== action[1]) {
        ns.bladeburner.startAction(...action)
      }
    // if your next task is to work and you're employed and not an executive, work
    } else if (
      businessPositions.includes(position) ||
      softwarePositions.includes(position)
    ) {
      ns.singularity.workForCompany(company, focus);
    // if your next task is to work and you're not employed and not an executive,
    // get a software job first or study
    } else if (company && position !== "Chief Technology Officer" && ns.singularity.applyToCompany(company, "Software")) {
      ns.singularity.workForCompany(company, focus);
    } else {
      gymStudyCrime(ns, 0.5, focus)
    }

    // upgrade servers and home ram
    let purchasedServers = ns.cloud.getServerNames();
    let sortedServers = purchasedServers
      .map((i) => [i, ns.getServerMaxRam(i)])
      .sort((a, b) => a[1] - b[1])

    while (true) {
      purchasedServers = ns.cloud.getServerNames();
      if (purchasedServers.length < ns.cloud.getServerLimit()) {
        const baseCost = ns.cloud.getServerCost(2);
        if (money > baseCost) {
          ns.cloud.purchaseServer(
            `pserv-${purchasedServers.length.toString().padStart(2, "0")}`,
            2,
          );
          money -= baseCost;
          ns.tprint(`bought pserv-${purchasedServers.length} for $${baseCost.toExponential(3)}`);
          await ns.sleep(20);
        } else {
          break; // stop if can’t afford another
        }
      } else {
        // upgrading instead
        const [leastRAMServer, leastRAM] = sortedServers[0];
        const upgradeCost = ns.cloud.getServerUpgradeCost(
          leastRAMServer,
          leastRAM * 2,
        );
        if (money > upgradeCost * 100) {
          ns.cloud.upgradeServer(leastRAMServer, leastRAM * 2);
          money -= upgradeCost;
          ns.tprint(
            `upgrading ${leastRAMServer} to ${leastRAM * 2}GB ($${upgradeCost.toExponential(3)})`,
          );
          sortedServers[0][1] *= 2
          sortedServers = sortedServers.sort((a, b) => a[1] - b[1])          
          await ns.sleep(20);
        } else {
          break; // stop if not enough money for upgrade
        }
      }
    }

    let homeRAMCost = ns.singularity.getUpgradeHomeRamCost();
    while (
      money > homeRAMCost * 100 ||
      (homeRAMCost < 1e10 && money > homeRAMCost)
    ) {
      ns.singularity.upgradeHomeRam();
      ns.tprint("upgrading home RAM");
      homeRAMCost = ns.singularity.getUpgradeHomeRamCost();
      money = ns.getServerMoneyAvailable("home");
      await ns.sleep(20);
    }

    // buy tor router + upgrades
    if (needTor(ns)) {
      if (money >= 200000) {
        const bought = ns.singularity.purchaseTor();
        if (bought) {
          money -= 200000
        }
      }
      const programs = ns.singularity.getDarkwebPrograms();
      for (let program of programs) {
        const cost = ns.singularity.getDarkwebProgramCost(program);
        if (money > cost) {
          const bought = ns.singularity.purchaseProgram(program);
          if (bought) {
            money -= cost
          }
        }
      }
    }

    // unlock all servers
    ns.run("unlock.js");
    if (!(count % 600)) {
      ns.run("dispatchall.js");
    }

    // fill remaining holes
    const hackTime = Math.round(ns.getHackTime("joesguns") / interval)
    if (!(count % (hackTime + 1))) {
      ns.run("fillholes.js")
    }

    // only when count is odd, to leave gaps for dispatch scripts

    // nuke servers to unlock factions
    if (!(count % 600)) {
      const servers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets"];
      for (let server of servers) {
        if (!ns.getServer(server).backdoorInstalled) {
          const route = await findServer(ns, server);
          for (let step of route) {
            ns.singularity.connect(step);
          }
          try {
            await ns.singularity.installBackdoor();
          } catch {}
        }
      }
      ns.singularity.connect("home");
    }

    // choose what city factions to join this round
    let cityGroup = [];
    for (let group of cityGroups) {
      let augmentations = [];
      for (let city of group) {
        augmentations = [
          ...augmentations,
          ...ns.singularity.getAugmentationsFromFaction(city),
        ];
      }
      const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);
      if (
        augmentations.some(
          (i) =>
            !ownedAugmentations.includes(i) &&
            !i.startsWith("Neuroflux Governor"),
        )
      ) {
        cityGroup = group;
        break;
      }
    }

    // joining city and city-based factions
    if (count % 600 < cityGroup.length && money >= 2e7) {
      const city = cityGroup[count % cityGroup.length]
      if (city && !factions.includes(city)) {
        ns.singularity.travelToCity(city);
        money -= 2e5
      }
    } else if (count % 6000 < 2 && money >= 2e9) {
      const city = ["Chongqing", "Aevum"][count % 6000]
      if (city) {
        ns.singularity.travelToCity(city);
        money -= 2e5
      }
    }

    const ignore = cities.filter((i) => !cityGroup.includes(i));
    const invitations = ns.singularity.checkFactionInvitations();
    for (let invitation of invitations) {
      if (!ignore.includes(invitation)) {
        ns.singularity.joinFaction(invitation);
        ns.tprint("joined ", invitation);
      }
    }

    // if all augmentations can be bought at once, buy all of them
    const totalPrice = augs.reduce(
      (acc, aug, index) => acc + ns.singularity.getAugmentationPrice(aug) * 1.9 ** index,
      0
    )
    const repReqMet = !augs.some(aug => {
      return Math.max(
        ...ns.singularity.getAugmentationFactions(aug)
          .map(fac => ns.singularity.getFactionRep(fac))
      ) < ns.singularity.getAugmentationRepReq(aug)
    })
    if (money >= totalPrice && repReqMet) {
      const augmentation = augs[0];
      for (let faction of factions) {
        if (
          ns.singularity
            .getAugmentationsFromFaction(faction)
            .includes(augmentation)
        ) {
          const purchased = ns.singularity.purchaseAugmentation(
            faction,
            augmentation,
          );
          if (purchased) {
            ns.tprint("bought ", augmentation, " from ", faction);
            break
          }
        }
      }
    }

    // install augmentations after buying 10
    const totalAugmentations =
      ns.singularity.getOwnedAugmentations(true).length +
      nfgLevel(ns, false) -
      1;
    const installedAugmentations =
      ns.singularity.getOwnedAugmentations(false).length +
      nfgLevel(ns, false) -
      1;
    const requiredNumAugs = Math.ceil((installedAugmentations + 5) / 10) * 10;
    if (totalAugmentations >= requiredNumAugs) {
      ns.singularity.installAugmentations("index.js");
    }

    // bladeburner points
    if (ns.bladeburner.inBladeburner()) {
      let min = 0;
      while (ns.bladeburner.getSkillPoints() >= min) {
        const skills = ns.bladeburner.getSkillNames();
        const ls = [];

        for (let skill of skills) {
          const limit =
            Object.keys(bladeburnerLimits).includes(skill) &&
            bladeburnerLimits[skill] <= ns.bladeburner.getSkillLevel(skill);
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
    }

    // destroy w0r1d_d43m0n
    let destroy = false;
    if (ns.singularity.getOwnedAugmentations(false).includes("The Red Pill")) {
      const requiredHackingLevel =
        ns.getServerRequiredHackingLevel("w0r1d_d43m0n");
      if (ns.getHackingLevel() >= requiredHackingLevel) {
        destroy = true;
      }
    } else if (
      ns.bladeburner.inBladeburner() &&
      !ns.bladeburner.getNextBlackOp()
    ) {
      // destroy = true
    }

    if (destroy) {
      // ns.singularity.destroyW0r1dD43m0n(nextBitNode(ns), "index.js");
    }

    count++;
    await ns.sleep(interval);
  }
}
