import nextFaction from "./nextfaction"

/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    const sleeves = ns.sleeve.getNumSleeves()

    // find skill to train
    const physical = ["strength", "defense", "dexterity", "agility"]
    const skills = ns.getPlayer().skills
    const level = physical.sort((a, b) => skills[a] - skills[b])[0]
    const skill = level.slice(0, 3)

    const faction = await nextFaction(ns)

    for (let i = 0; i < sleeves; i++) {
      const sleeve = ns.sleeve.getSleeve(i)
      if (sleeve.shock) {
        ns.sleeve.setToShockRecovery(i)
      } else if (sleeve.sync < 100) {
        ns.sleeve.setToSynchronize(i)
      } else if (faction) {
        for (let type of ["hacking", "field", "security"]) {
          const tryHack = ns.sleeve.setToFactionWork(i, faction, type)
          if (tryHack) {
            break
          }
        }
      } else if (ns.heart.break() > -90 || ns.getPlayer().numPeopleKilled < 30) {
        ns.singularity.commitCrime("Homicide", false)
      } else {
        ns.sleeve.setToGymWorkout(i, "Powerhouse Gym", skill)
      }
    }

    for (let i = 0; i < sleeves; i++) {
      for (let aug of ns.sleeve.getSleevePurchasableAugs(i).map(aug => aug.name)) {
        ns.sleeve.purchaseSleeveAug(i, aug)
      }
    }

    await ns.sleep(1000)
  }
}
