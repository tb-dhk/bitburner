import findServer from "./findserver"

function findProcess(ns, filename) {
  const processes = ns.ps().filter(i => i.filename === filename)
  return Boolean(processes.length)
}

function nextBitNode(ns) {
  const bitNodes = [1, 2, 4, 12, 5, 6, 11, 14, 3, 7, 8, 9, 10, 13]
  for (let bitNode of bitNodes) {
    if (ns.getResetInfo().ownedSF.get(bitNode) < 3) {
      return bitNode
    }
  }
}

/** @param {NS} ns */
export async function main(ns) {
  ns.ramOverride(75)
  let count = 0

  if (!findProcess(ns, "bladeburner.js")) {
    ns.run("bladeburner.js")
  }

  while (true) {
    // crime only if not in bladeburner
    if (!ns.bladeburner.inBladeburner()) {
      let crimes = ["Traffick Arms", "Grand Theft Auto", "Kidnap", "Heist"]
      
      const bestCrime = crimes.map(crime => {
        const chance = ns.singularity.getCrimeChance(crime)
        const stats = ns.singularity.getCrimeStats(crime)
        const score = (stats.money + stats.agility_exp) * chance / stats.time
        return [crime, score]
      }).sort(
        (a, b) => b[1] - a[1]
      )[0][0]

      const currentWork = ns.singularity.getCurrentWork()
      if (!currentWork || currentWork.type !== "CRIME" || currentWork.crimeType !== bestCrime) {
        ns.singularity.commitCrime(bestCrime, false)
        ns.tprint("committing ", bestCrime)
      }
    }

    // upgrade servers and home ram
    let money = ns.getServerMoneyAvailable("home");
    
    while (true) {
      const purchasedServers = await ns.getPurchasedServers();

      if (purchasedServers.length < 25) {
        // keep buying until you can’t afford the next one
        const baseCost = ns.getPurchasedServerCost(2);
        if (money > baseCost) {
          const name = ns.purchaseServer(`pserv-${purchasedServers.length}`, 2);
          ns.tprint(`bought ${name} for $${baseCost}`);
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

        const upgradeCost = ns.getPurchasedServerUpgradeCost(leastRAMServer, leastRAM * 2);

        if (money > upgradeCost * 100) {
          ns.upgradePurchasedServer(leastRAMServer, leastRAM * 2);
          ns.tprint(`upgrading ${leastRAMServer} to ${leastRAM * 2}GB ($${upgradeCost})`);
          await ns.sleep(20);
          continue;
        } else {
          break; // stop if not enough money for upgrade
        }
      }

      money = ns.getServerMoneyAvailable("home")
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

    // join factions and install augmentations
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

    const factions = ["CyberSec", "NiteSec", "The Black Hand", "BitRunners", "Daedalus", "Bladeburners"]
    for (let faction of factions) {
      ns.singularity.joinFaction(faction)
      const augmentations = ns.singularity.getAugmentationsFromFaction(faction)
      for (let augmentation of augmentations) {
        const ownedAugmentations = ns.singularity.getOwnedAugmentations()
        if (augmentation.slice(0, 18) !== "NeuroFlux Governor" || Number(augmentation.slice(27)) > Math.floor(ownedAugmentations.length / 10)) {
          ns.singularity.purchaseAugmentation(faction, augmentation)
        }
      }
    }

    const purchasedAugmentations = ns.singularity.getOwnedAugmentations(true)
    const installedAugmentations = ns.singularity.getOwnedAugmentations(false)
    if (purchasedAugmentations.length - installedAugmentations.length >= 10) {
      ns.singularity.installAugmentations("index.js")
    }

    let destroy = false
    if (installedAugmentations.includes("The Red Pill")) {
      const requiredHackingLevel = ns.getServerRequiredHackingLevel("w0r1d_d43m0n")
      destroy ||= ns.getHackingLevel() >= requiredHackingLevel
    } else if (ns.bladeburner.inBladeburner() && !ns.bladeburner.getNextBlackOp()) {
      destroy = true
    }

    if (destroy) {
      ns.singularity.destroyW0r1dD43m0n(nextBitNode(ns), "index.js")
    }

    count++
    await ns.sleep(10000)
  }
}
