import findServer from "./findserver"
import nextFaction from "./nextfaction"

// accept invitations + choose city group
const cityGroups = [
  ["Sector-12", "Aevum"],
  ["Chongqing, Ishima, New Tokyo"],
  ["Volhaven"]
]

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

function nfgLevel(ns) {
  const augmentList = ns.singularity.getOwnedAugmentations(true);
  for (var i=0; i < augmentList.length; i++) {	
    if (augmentList[i].startsWith("Neuroflux Governor")) {	
      return augmentList[i].substring(augmentList[i].lastIndexOf(" "));
    }
  }
}

function gym(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"]
  const skills = ns.getPlayer().skills
  const level = physical.sort((a, b) => skills[a] - skills[b])[0]
  ns.singularity.gymWorkout("Powerhouse Gym", level.slice(0, 3), false)
  ns.tprint("training ", level)
}

/** @param {NS} ns */
export async function main(ns) {
  ns.ramOverride(75)
  let count = 0

  while (true) {
    if (!findProcess(ns, "bladeburner.js")) {
      // ns.run("bladeburner.js")
    }

    if (!findProcess(ns, "sleeves.js")) {
      ns.run("sleeves.js")
    }
    
    const cities = cityGroups.flat()
    if (!count % 60) {
      ns.singularity.travelToCity(cities[Math.floor(count / 60) % 6])
    }
    
    // gym if gym stats are below 100 or all factions cleared
    const physical = ["strength", "defense", "dexterity", "agility"]
    const skills = ns.getPlayer().skills
    const level = physical.sort((a, b) => skills[a] - skills[b])[0]

    const faction = await nextFaction(ns)

    if (ns.heart.break() > -90 || ns.getPlayer().numPeopleKilled < 30) {
      ns.singularity.commitCrime("Homicide", false)
    } else if (!faction || skills[level] < 100) {
      gym(ns)
    } else {
      for (let type of ["hacking", "field", "security"]) {
        const tryHack = ns.singularity.workForFaction(faction, type, false)
        if (tryHack) {
          break
        }
      }
    }

    // upgrade servers and home ram
    let money = ns.getServerMoneyAvailable("home");
    let purchasedServers = ns.cloud.getServerNames();

    while (true) {
      money = ns.getServerMoneyAvailable("home");
      purchasedServers = ns.cloud.getServerNames();
      if (purchasedServers.length < ns.cloud.getServerLimit()) {
        // keep buying until you can’t afford the next one
        const baseCost = ns.cloud.getServerCost(2);
        if (money > baseCost) {
          ns.cloud.purchaseServer(`pserv-${purchasedServers.length}`, 2);
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
          ns.tprint(`upgrading ${leastRAMServer} to ${leastRAM * 2}GB ($${upgradeCost})`);
          await ns.sleep(20);
          continue;
        } else {
          break; // stop if not enough money for upgrade
        }
      }
    }    
    
    let homeRAMCost = ns.singularity.getUpgradeHomeRamCost()
    while (money > homeRAMCost) {
      ns.singularity.upgradeHomeRam()
      money = ns.getServerMoneyAvailable("home")
      ns.tprint("upgrading home RAM")
      homeRAMCost = ns.singularity.getUpgradeHomeRamCost()
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

    // nuke servers to unlock factions
    if (!(count % 60)) {
      const servers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"]
      for (let server of servers) {
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

    let cityGroup = []
    for (let group of cityGroups) {
      let augmentations = []
      for (let city of group) {
        augmentations = [...augmentations, ns.singularity.getAugmentationsFromFaction(city)]
      }
      const ownedAugmentations = ns.singularity.getOwnedAugmentations(true)
      if (augmentations.some(i => !ownedAugmentations.includes(i))) {
        cityGroup = group
        break
      }
    }

    const ignore = cities.filter(i => !cityGroup.includes(i))
    const invitations = ns.singularity.checkFactionInvitations()
    for (let invitation of invitations) {
      if (!ignore.includes(invitation)) {
        ns.singularity.joinFaction(invitation)
      }
    }

    // install all augmentations where possible
    const factions = ns.getPlayer().factions
    let ownedAugmentations = ns.singularity.getOwnedAugmentations(true).length
    for (let faction of factions) {
      const augmentations = ns.singularity.getAugmentationsFromFaction(faction)
      for (let augmentation of augmentations) {
        if (augmentation.slice(0, 18) !== "NeuroFlux Governor" || nfgLevel(ns) < Math.floor(ownedAugmentations / 10)) {
          ns.singularity.purchaseAugmentation(faction, augmentation)
          ownedAugmentations++
        }
      }
    }

    // install augmentations after buying 10
    const purchasedAugmentations = ns.singularity.getOwnedAugmentations(true)
    const installedAugmentations = ns.singularity.getOwnedAugmentations(false)
    if (purchasedAugmentations.length - installedAugmentations.length >= 10) {
      ns.singularity.installAugmentations("index.js")
    }

    // destroy w0r1d_d43m0n
    let destroy = false
    if (installedAugmentations.includes("The Red Pill")) {
      const requiredHackingLevel = ns.getServerRequiredHackingLevel("w0r1d_d43m0n")
      destroy ||= ns.getHackingLevel() >= requiredHackingLevel
    } else if (ns.bladeburner.inBladeburner() && !ns.bladeburner.getNextBlackOp()) {
      destroy = true
    }

    if (destroy) {
      // ns.singularity.destroyW0r1dD43m0n(nextBitNode(ns), "index.js")
    }

    count++
    await ns.sleep(10000)
  }
}
