const limits = {
  "Cloak": 25,
  "Short Circuit": 25,
  "Tracer": 10,
  "Datamancer": 0,
  "Cybers Edge": 0,
  "Hands Of Midas": 0,
  "Hyperdrive": 20
}

function gym(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"]
  const skills = ns.getPlayer().skills
  const level = physical.sort((a, b) => skills[a] - skills[b])[0]
  ns.singularity.gymWorkout("Powerhouse Gym", level.slice(0, 3), false)
}

/** @param {NS} ns */
export async function main(ns) {
  ns.bladeburner.joinBladeburnerDivision()
  if (ns.bladeburner.inBladeburner()) {
    ns.bladeburner.joinBladeburnerFaction()
  }

  const contracts = ns.bladeburner.getContractNames()
  const operations = ns.bladeburner.getOperationNames()

  while (true) {
    if (!ns.bladeburner.inBladeburner()) {
      await ns.sleep(60000)
      continue
    }

    const recruitmentViable = ns.bladeburner.getActionEstimatedSuccessChance("General", "Recruitment") === 1
    let generalAction = recruitmentViable ? "Recruitment" : "Training"
    let action = ["General", generalAction]
  
    const stamina = ns.bladeburner.getStamina()
    if (stamina[0] < stamina[1] - 5) {
      action = ["General", "Hyperbolic Regeneration Chamber"]
    }

    let chance = [0, 0]

    const ls = [0, 2, 1]
    for (let i = 0; i < 3; i++) {
      chance = ns.bladeburner.getActionEstimatedSuccessChance("Contracts", contracts[ls[i]])
      if (chance[1] === 1 && ns.bladeburner.getActionCountRemaining("Contracts", contracts[ls[i]]) >= 1) {
        action = ["Contracts", contracts[ls[i]]]
      }
    }

    for (let i = 0; i < 2; i++) {
      ns.bladeburner.setTeamSize("Operations", operations[i], ns.bladeburner.getTeamSize())
      chance = ns.bladeburner.getActionEstimatedSuccessChance("Operations", operations[i])
      if (chance[1] === 1 && ns.bladeburner.getActionCountRemaining("Operations", operations[i]) >= 1) {
        action = ["Operations", operations[i]]
      }
    }

    const nextBlackOp = ns.bladeburner.getNextBlackOp()
    if (nextBlackOp) {
      ns.bladeburner.setTeamSize("Black Operations", nextBlackOp.name, ns.bladeburner.getTeamSize())
      chance = ns.bladeburner.getActionEstimatedSuccessChance("Black Operations", nextBlackOp.name)
      if (nextBlackOp.rank <= ns.bladeburner.getRank() && chance[1] >= 0.5) {
        action = ["Black Operations", nextBlackOp.name]
      }
    }

    if (chance[0] !== chance[1]) {
      action = ["General", "Field Analysis"]
    } 

    const city = ns.bladeburner.getCity()
    const chaos = ns.bladeburner.getCityChaos(city)
    if (chaos >= 50) {
      action = ["General", "Diplomacy"]
    }

    const current = ns.bladeburner.getCurrentAction()
    if (current && current.name === action[1] && current.type === action[0]) {
      ns.tprint("continuing ", action.join(": "))
    } else if (action[0] === "General" && action[1] === "Training") { 
      gym(ns)
    } else {
      ns.bladeburner.startAction(...action)
      ns.tprint("starting ", action.join(": "))
    }

    let min = 0
    while (ns.bladeburner.getSkillPoints() >= min) {
      const skills = ns.bladeburner.getSkillNames()
      const ls = []

      for (let skill of skills) {
        const limit = Object.keys(limits).includes(skill) && limits[skill] <= ns.bladeburner.getSkillLevel(skill)
        if (ns.bladeburner.getSkillPoints() >= min && ns.bladeburner.getSkillUpgradeCost(skill, 1) === min && !limit) {
          ns.bladeburner.upgradeSkill(skill, 1)
          ns.tprint("upgrading ", skill, " for ", min, " points")
        }
        if (!limit) {
          ls.push(ns.bladeburner.getSkillUpgradeCost(skill, 1))
        }
      }

      min = Math.min(...ls)
      await ns.sleep(50)
    }

    const factor = ns.bladeburner.getBonusTime() > 10000 ? 0.2 : 1
    const duration = ns.bladeburner.getActionTime(...action) - ns.bladeburner.getActionCurrentTime()
    await ns.sleep(duration * factor + 500)
  }
}
