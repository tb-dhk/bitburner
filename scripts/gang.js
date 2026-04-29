function multiplyMultValues(obj, k) {
  return Object.entries(obj)
    .filter(k)
    .reduce((acc, [, val]) => acc * val, 1);
}

function compareStats(ns, stat, a, b) {
  const statsA = ns.gang.getMemberInformation(a)
  const statsB = ns.gang.getMemberInformation(b)
  if (statsA[stat] !== statsB[stat]) {
    return statsA[stat] - statsB[stat]
  } 
  return statsA[stat + "_exp"] - statsB[stat + "_exp"]
}

function minCombat(ns, member) {
  const stats = ns.gang.getMemberInformation(member)
  let min = (Infinity, Infinity)
  const combat = ["agi", "def", "dex", "str"]
  for (let skill of combat) {
    if (stats[skill] < min[0] || (stats[skill] == min[0] && stats[skill + "_exp"] < min[1])) {
      min = (stats[skill], stats[skill + "_exp"])
    }
  }
  return min
}

function compareMinCombat(ns, a, b) {
  const minA = minCombat(ns, a)
  const minB = minCombat(ns, b)
  if (minA[0] !== minB[0]) {
    return minA[0] - minB[0]
  }
  return minA[1] - minB[1]
}

function totalRespectGain(ns, list, task) {
  return list
    .reduce(
      (acc, member) => acc + ns.formulas.gang.respectGain(
        ns.gang.getGangInformation(), 
        ns.gang.getMemberInformation(member),
        ns.gang.getTaskStats(task)
      ), 
      0
    )
}

function totalWantedGain(ns, list, task) {
  return list
    .reduce(
      (acc, member) => acc + ns.formulas.gang.wantedLevelGain(
        ns.gang.getGangInformation(), 
        ns.gang.getMemberInformation(member),
        ns.gang.getTaskStats(task)
      ), 
      0
    )
}

/** @param {NS} ns */
export async function main(ns) {
  let iterCount = 0
  const karma = ns.heart.break();
  if (karma > -54000) {
    ns.tprint("current karma is ", karma, ".");
  }

  while (true) {
    const members = ns.gang.getMemberNames();
    let memberCount = 0;
    for (let member of members) {
      const ascension = ns.gang.getAscensionResult(member);
      if (ascension) {
        const ascensionMult = multiplyMultValues(
          ascension,
          ([key]) => key !== "respect",
        );
        if (ascensionMult >= 2) {
          ns.gang.ascendMember(member);
          ns.tprint("ascended ", member);
        }
      }
      if (member != memberCount) {
        ns.gang.renameMember(member.toString(), memberCount.toString());
      }
      memberCount += 1;
    }

    let recruitable = ns.gang.canRecruitMember();
    while (recruitable) {
      ns.gang.recruitMember(memberCount.toString());
      ns.tprint("recruited new member ", memberCount);
      memberCount += 1;
      await ns.sleep(100);
      recruitable = ns.gang.canRecruitMember();
    }

    const otherGangs = ns.gang.getAllGangInformation();
    let chance = 0;
    let count = 0;
    const name = ns.gang.getGangInformation().faction;
    for (let gang in otherGangs) {
      if (otherGangs[gang].territory && gang !== name) {
        chance += ns.gang.getChanceToWinClash(gang);
        count += 1;
      }
    }
    chance /= count;
    if (!(iterCount % 200)) {
      ns.tprint("overall win chance: ", chance * 100, "%");
    }
    const warfare = (chance >= 0.75 || members.length === 12) && count;
    ns.gang.setTerritoryWarfare(chance >= 0.75);

    // sort by worst hackers, worst combat
    const worstHackers = members.sort((a, b) => compareStats(ns, "hack", a, b))
    const worstCombat = members.sort((a, b) => compareMinCombat(ns, a, b))
    // init list of unassigned and wanted loss from vigilante justice
    const unassigned = []
    let wantedGain = 0
    // find out how much is top 20%
    const twenty = Math.ceil(members.length / 5)
    for (let member of members) {
      // if in top 20% best combat and not warfare mode, assign to vigilante justice (add to wanted loss)
      if (worstCombat.slice(memberCount - twenty).includes(member) && !warfare) {
        ns.gang.setMemberTask(member, "Vigilante Justice")
        wantedGain += ns.formulas.gang.wantedLevelGain(
          ns.gang.getGangInformation(), 
          ns.gang.getMemberInformation(member),
          ns.gang.getTaskStats("Vigilante Justice")
        )
      }
      // elif in top 20% worst hackers, assign to train hacking
      else if (worstHackers.slice(0, twenty).includes(member)) {
        ns.gang.setMemberTask(member, "Train Hacking")
      }
      // elif in top 20% worst combat, assign to train combat
      else if (worstCombat.slice(0, twenty).includes(member)) {
        ns.gang.setMemberTask(member, "Train Hacking")
      }
      // else add to list of unassigned
      else {
        unassigned.push(member)
      }
    }

    let unassignedTask = ""
    // if warfare mode, assign to warfare
    if (warfare) {
      unassignedTask = "Territory Warfare"
    // if not warfare mode, check highest crime all unassigned can do at the same time without causing net wanted gain
    } else {
      const taskList = ns.gang.getTaskNames().sort((a, b) => totalRespectGain(ns, unassigned, b) - totalRespectGain(ns, unassigned, a))
      for (let task of taskList) {
        if (totalWantedGain(ns, unassigned, task) + wantedGain >= 0) {
          unassignedTask = task
          break
        }
      }
    }

    for (let member of unassigned) {
      ns.gang.setMemberTask(member, unassignedTask)
    }

    await ns.sleep(100);

    iterCount += 1
  }
}
