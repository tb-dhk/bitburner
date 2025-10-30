/** @param {NS} ns */
export async function main(ns) {
  ns.bladeburner.joinBladeburnerDivision()
  ns.bladeburner.joinBladeburnerFaction()

  const contracts = ns.bladeburner.getContractNames()
  const operations = ns.bladeburner.getOperationNames()

  while (true) {
    if (!ns.bladeburner.inBladeburner()) {
      await ns.sleep(60000)
      continue
    }

    const recruitmentViable = Math.random() < 0.25 && ns.bladeburner.getActionEstimatedSuccessChance("General", "Recruitment")
    let generalAction = recruitmentViable ? "Recruitment" : "Training"
    let action = ["General", generalAction]
  
    const stamina = ns.bladeburner.getStamina()
    if (stamina[0] < stamina[1]) {
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
    } else {
      ns.bladeburner.startAction(...action)
      ns.tprint("starting ", action.join(": "))
    }

    let min = 0
    while (ns.bladeburner.getSkillPoints() >= min) {
      const skills = ns.bladeburner.getSkillNames()
      min = Math.min(...skills.map(i => ns.bladeburner.getSkillUpgradeCost(i, 1)))

      for (let skill of skills) {
        if (ns.bladeburner.getSkillPoints() >= min && ns.bladeburner.getSkillUpgradeCost(skill, 1) === min) {
          ns.bladeburner.upgradeSkill(skill, 1)
          ns.tprint("upgrading ", skill, " for ", min, " points")
        }
      }
      await ns.sleep(50)
    }

    const factor = ns.bladeburner.getBonusTime() > 10000 ? 0.2 : 1
    const duration = ns.bladeburner.getActionTime(...action) - ns.bladeburner.getActionCurrentTime()
    await ns.sleep(duration * factor + 500)
  }
}
