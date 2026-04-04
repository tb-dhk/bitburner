function multiplyMultValues(obj, k) {
  return Object.entries(obj)
    .filter(k)
    .reduce((acc, [, val]) => acc * val, 1);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** @param {NS} ns */
export async function main(ns) {
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
      ns.gang.setMemberTask(memberCount.toString(), "Ethical Hacking");
      memberCount += 1;
      await ns.sleep(1000);
      recruitable = ns.gang.canRecruitMember();
    }

    const otherGangs = ns.gang.getOtherGangInformation();
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
    ns.tprint("overall win chance: ", chance * 100, "%");
    const warfare = (chance >= 0.7 || members.length >= 10) && count;
    ns.gang.setTerritoryWarfare(chance >= 0.7);

    let minHacking = null;
    let minHackingName = "";
    let minCombat = null;
    let minCombatName = "";
    for (let member of members) {
      ns.gang.setMemberTask(
        member,
        warfare && Math.random() < 2 / 3
          ? "Territory Warfare"
          : pickRandom(ns.args),
      );
      const memberObj = ns.gang.getMemberInformation(member);
      if (memberObj.hack < minHacking || !minHackingName) {
        minHacking = memberObj.hack;
        minHackingName = memberObj.name;
      }
      if (
        (memberObj.str < minCombat || !minCombatName) &&
        memberObj.name !== minHackingName
      ) {
        minCombat = memberObj.str;
        minCombatName = memberObj.name;
      }
    }

    // helper to pick a random unallocated member and mark them as allocated
    const allocated = Array(members.length).fill(false);
    function pickRandomUnallocated() {
      const unallocated = members.filter((_, idx) => !allocated[idx]);
      const choice =
        unallocated[Math.floor(Math.random() * unallocated.length)];
      allocated[Number(choice)] = true;
      return choice || Math.floor(Math.random() * members.length);
    }

    if (warfare) {
      allocated[Number(minCombatName)] = true;
      ns.gang.setMemberTask(members[minCombatName], "Train Combat");
      ns.gang.setMemberTask(
        members[Math.floor(Math.random() * members.length)],
        pickRandom(ns.args),
      );
    } else {
      // allocateYou can also manage your gang programmatically through Netscript using the Gang API. minCombatName and minHackingName first
      allocated[Number(minCombatName)] = true;
      allocated[Number(minHackingName)] = true;

      // assign tasks to random unallocated members
      if (count) {
        ns.gang.setMemberTask(members[Number(minCombatName)], "Train Combat");
      }
      ns.gang.setMemberTask(members[Number(minHackingName)], "Train Hacking");
    }

    if (warfare) {
      ns.gang.setMemberTask(
        members[pickRandomUnallocated()],
        "Territory Warfare",
      );
    }
    ns.gang.setMemberTask(members[pickRandomUnallocated()], "Ethical Hacking");
    await ns.sleep(20000);
  }
}
