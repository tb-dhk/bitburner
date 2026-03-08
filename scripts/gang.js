function multiplyMultValues(obj, k) {
  return Object.entries(obj)
    .filter(k)
    .reduce((acc, [, val]) => acc * val, 1);
}

/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    const members = ns.gang.getMemberNames()
    let memberCount = 0
    for (let member of members) {
      const ascension = ns.gang.getAscensionResult(member)
      if (ascension) {
        const ascensionMult = multiplyMultValues(ascension, ([key]) => key !== "respect")
        if (ascensionMult >= 2) {
          ns.gang.ascendMember(member)
          ns.tprint("ascended ", member)
        }
      }
      memberCount += 1
    }

    let recruitable = ns.gang.canRecruitMember()
    while (recruitable) {
      ns.gang.recruitMember(memberCount.toString())
      ns.tprint("recruited new member ", memberCount)
      ns.gang.setMemberTask(memberCount.toString(), "Ethical Hacking")
      memberCount += 1
      await ns.sleep(1000)
      recruitable = ns.gang.canRecruitMember()
    }

    const otherGangs = ns.gang.getOtherGangInformation()
    let chance = 0
    let count = 0
    const name = ns.gang.getGangInformation().faction
    for (let gang in otherGangs) {
      if (otherGangs[gang].territory && gang !== name) {
        chance += ns.gang.getChanceToWinClash(gang)
        count += 1
      }
    }
    chance /= count
    ns.tprint("overall win chance: ", chance * 100, "%")
    ns.gang.setTerritoryWarfare(chance >= 0.6)
    for (let member of members) {
      ns.gang.setMemberTask(member, chance >= 0.6 ? "Train Combat" : "Territory Warfare")
    }

    await ns.sleep(60000)
  }
}
