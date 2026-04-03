import findServer from "./findserver"
import { nfgLevel, nextAugs, nextFactions, untouchedAugs } from "./nextfaction"
import { 
  gym, minCombat, crimeForMoney,
  nextCompany, businessPositions, softwarePositions, getCompanyPosition 
} from "./common"

// constants
const cityGroups = [
  ["Sector-12", "Aevum"],
  ["Chongqing", "Ishima", "New Tokyo"],
  ["Volhaven"]
]

// helpers
function findProcess(ns, filename) {
  const processes = ns.ps().filter(i => i.filename === filename)
  return Boolean(processes.length)
}

function nextBitNode(ns) {
  const bitNodes = [1, 2, 5, 4, 6, 10, 3, 9, 13, 14, 15, 7, 8, 11, 12]
  const currentNode = ns.getResetInfo().currentNode
  for (let bitNode of bitNodes) {
    const bitNodeN = Number(ns.getResetInfo().ownedSF.get(bitNode)) + Number(bitNode === currentNode)
    if (!bitNodeN || bitNodeN < 3) {
      return bitNode
    }
  }
}

/** @param {NS} ns */
export async function main(ns) {
  ns.ramOverride(80.30)
  let count = 0

  while (true) {
    const toRun = ["sleeves.js"]
    for (let script of toRun) {
      if (!findProcess(ns, script)) {
        ns.run(script)
      }
    }
    
    const cities = cityGroups.flat()
    if (count % 60 <= 6) {
      ns.singularity.travelToCity(cities[count % 6])
    }

    const company = nextCompany(ns)
    const position = getCompanyPosition(ns, company)
    
    // work
    const factions = ns.getPlayer().factions
    const faction = (await nextFactions(ns))[0]
    const currentWork = ns.singularity.getCurrentWork(company)
    let money = ns.getServerMoneyAvailable("home");
    const focus = ns.singularity.isFocused()
    const random = Math.random()

    // commit crime if gym stats are high enough and crime stats are too low
    // otherwise work for faction to gain rep
    // otherwise gym or work (if you have yet to become ceo)
    if (
      (minCombat(ns) >= 100 &&
        (ns.heart.break() > -90 || ns.getPlayer().numPeopleKilled < 30)) ||
      (!faction && !position && random < 0.25)
    ) {
      if (!currentWork || (currentWork.crimeType !== "Homicide")) {
        ns.singularity.commitCrime("Homicide", focus)
      }
    } else if (money < 0 && !position) {
      if (!currentWork || (currentWork.crimeType !== crimeForMoney(ns))) {
        ns.singularity.commitCrime(crimeForMoney(ns), focus)
      }
    } else if (faction) {
      for (let type of ["hacking", "security", "field"]) {
        const tryWork = ns.singularity.workForFaction(faction, type, focus)
        if (tryWork) {
          break
        }
      }
    } else {
      if (random < 0.5 && !position && money >= 0) {
        ns.singularity.travelToCity("Sector-12")
        ns.singularity.gymWorkout("Powerhouse Gym", gym(ns), focus)
      } else if (businessPositions.includes(position) || softwarePositions.includes(position)) {
        // if employed in business or software, switch to highest possible business position
        ns.singularity.applyToCompany(company, "Business")
        ns.singularity.workForCompany(company, focus)
      } else if (!position.startsWith("Chief") && !position.endsWith("Officer")) {
        // if not employed, get a software job first or study leadership
        const apply = ns.singularity.applyToCompany(company, "Software")
        if (apply) {
          ns.singularity.workForCompany(company, focus)
        } else {
          const skills = ns.getPlayer().skills
          const course = skills.charisma < skills.hacking ? "Leadership" : "Algorithms"
          ns.singularity.travelToCity("Volhaven")
          ns.singularity.universityCourse("ZB Institute of Technology", course, focus)
        }
      } else {
        ns.singularity.travelToCity("Sector-12")
        ns.singularity.gymWorkout("Powerhouse Gym", gym(ns), focus)
      }
    }

    // upgrade servers and home ram
    let purchasedServers = ns.cloud.getServerNames();

    while (true) {
      purchasedServers = ns.cloud.getServerNames();
      if (purchasedServers.length < ns.cloud.getServerLimit()) {
        const baseCost = ns.cloud.getServerCost(2);
        if (money > baseCost) {
          ns.cloud.purchaseServer(`pserv-${purchasedServers.length.toString().padStart(2, "0")}`, 2);
          money -= baseCost
          ns.tprint(`bought pserv-${purchasedServers.length} for $${baseCost}`);
          await ns.sleep(20);
          continue; // loop again to see if we can buy another
        } else {
          break; // stop if can’t afford another
        }
      } else {
        // upgrading instead
        const [leastRAMServer, leastRAM] = purchasedServers
          .map(i => [i, ns.getServerMaxRam(i)])
          .sort((a, b) => a[1] - b[1])[0];
        const upgradeCost = ns.cloud.getServerUpgradeCost(leastRAMServer, leastRAM * 2);
        if (money > upgradeCost * 100) {
          ns.cloud.upgradeServer(leastRAMServer, leastRAM * 2);
          money -= upgradeCost
          ns.tprint(`upgrading ${leastRAMServer} to ${leastRAM * 2}GB ($${upgradeCost})`);
          await ns.sleep(20);
          continue;
        } else {
          break; // stop if not enough money for upgrade
        }
      }
    }    
    
    let homeRAMCost = ns.singularity.getUpgradeHomeRamCost()
    while (money > homeRAMCost * 100 || (homeRAMCost < 1e10 && money > homeRAMCost)) {
      ns.singularity.upgradeHomeRam()
      ns.tprint("upgrading home RAM")
      homeRAMCost = ns.singularity.getUpgradeHomeRamCost()
      money = ns.getServerMoneyAvailable("home")
      await ns.sleep(20)
    }

    // buy tor router + upgrades
    if (money >= 200000) {
      ns.singularity.purchaseTor()
    }
    const programs = ns.singularity.getDarkwebPrograms()
    for (let program of programs) {
      money = ns.getServerMoneyAvailable("home")
      const cost = ns.singularity.getDarkwebProgramCost(program)
      if (money > cost) {
        ns.singularity.purchaseProgram(program)
      }
    }

    // unlock all servers
    ns.run("unlock.js")
    if (!(count % 60)) {
      ns.run("dispatchall.js")
    }

    // fill remaining holes
    if (count % 2) {
      ns.run("fillholes.js")
    }
    // only when count is odd, to leave gaps for dispatch scripts
  
    // nuke servers to unlock factions
    if (!(count % 60)) {
      const servers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"]
      for (let server of servers) {
        if (!ns.getServer(server).backdoorInstalled) {
          const route = await findServer(ns, server)
          for (let step of route) {
            ns.singularity.connect(step)
          }
          try {
            await ns.singularity.installBackdoor()
          } catch {}
          ns.singularity.connect("home")
        }
      }
    }

    // choose what city factions to join this round
    let cityGroup = []
    for (let group of cityGroups) {
      let augmentations = []
      for (let city of group) {
        augmentations = [...augmentations, ...ns.singularity.getAugmentationsFromFaction(city)]
      }
      const ownedAugmentations = ns.singularity.getOwnedAugmentations(true)
      if (augmentations.some(i => !ownedAugmentations.includes(i) && !i.startsWith("Neuroflux Governor"))) {
        cityGroup = group
        break
      }
    }

    const ignore = cities.filter(i => !cityGroup.includes(i))
    const invitations = ns.singularity.checkFactionInvitations()
    for (let invitation of invitations) {
      if (!ignore.includes(invitation)) {
        ns.singularity.joinFaction(invitation)
        ns.tprint("joined ", invitation)
      }
    }

    // install all augmentations where possible
    const augmentation = (await nextAugs(ns))[0]
    for (let faction of factions) {
      if (ns.singularity.getAugmentationsFromFaction(faction).includes(augmentation)) {
        const purchased = ns.singularity.purchaseAugmentation(faction, augmentation)
        if (purchased) {
          ns.tprint("bought ", augmentation, " from ", faction)
        }
        break
      }
    }

    // install augmentations after buying 10
    const totalAugmentations = ns.singularity.getOwnedAugmentations(true).length + nfgLevel(ns, false) - 1
    const installedAugmentations = ns.singularity.getOwnedAugmentations(false).length + nfgLevel(ns, false) - 1
    const requiredNumAugs = Math.ceil((installedAugmentations + 5) / 10) * 10
    if (
      totalAugmentations >= requiredNumAugs ||
      (untouchedAugs(ns) === 0 && totalAugmentations >= installedAugmentations)
    ) {
      ns.singularity.installAugmentations("index.js")
    }

    // destroy w0r1d_d43m0n
    let destroy = false
    if (ns.singularity.getOwnedAugmentations(false).includes("The Red Pill")) {
      const requiredHackingLevel = ns.getServerRequiredHackingLevel("w0r1d_d43m0n")
      if (ns.getHackingLevel() >= requiredHackingLevel) {
        destroy = true
      }
    } else if (ns.bladeburner.inBladeburner() && !ns.bladeburner.getNextBlackOp()) {
      // destroy = true
    }

    if (destroy) {
      ns.singularity.destroyW0r1dD43m0n(nextBitNode(ns), "index.js")
    }

    count++
    await ns.sleep(10000)
  }
}