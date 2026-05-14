import { printTable } from "./common";

function multiplyMultValues(obj, k) {
  return Object.entries(obj)
    .filter(k)
    .reduce((acc, [, val]) => acc * val, 1);
}

function minCombat(ns, member) {
  const stats = ns.gang.getMemberInformation(member);
  let min = Infinity;
  const combat = ["agi", "def", "dex", "str"];
  for (let skill of combat) {
    if (stats[skill + "_exp"] < min) {
      min = stats[skill + "_exp"];
    }
  }
  return min;
}

function totalMoneyGain(ns, list, task) {
  return list.reduce(
    (acc, member) =>
      acc +
      ns.formulas.gang.moneyGain(
        ns.gang.getGangInformation(),
        ns.gang.getMemberInformation(member),
        ns.gang.getTaskStats(task),
      ),
    0,
  );
}

function totalRespectGain(ns, list, task) {
  return list.reduce(
    (acc, member) =>
      acc +
      ns.formulas.gang.respectGain(
        ns.gang.getGangInformation(),
        ns.gang.getMemberInformation(member),
        ns.gang.getTaskStats(task),
      ),
    0,
  );
}

function totalWantedGain(ns, list, task) {
  return list.reduce(
    (acc, member) =>
      acc +
      ns.formulas.gang.wantedLevelGain(
        ns.gang.getGangInformation(),
        ns.gang.getMemberInformation(member),
        ns.gang.getTaskStats(task),
      ),
    0,
  );
}

/** @param {NS} ns */
export async function main(ns) {
  if (ns.args[0] === "stats") {
    const taskTable = [["task", "money", "respect", "wanted"]];
    for (let task of ns.gang.getTaskNames()) {
      taskTable.push([
        task,
        totalMoneyGain(ns, ns.gang.getMemberNames(), task).toPrecision(5),
        totalRespectGain(ns, ns.gang.getMemberNames(), task).toPrecision(5),
        totalWantedGain(ns, ns.gang.getMemberNames(), task).toPrecision(5),
      ]);
    }
    printTable(ns, taskTable);

    const memberTable = [
      ["member", "hack", "str", "def", "dex", "agi", "mult"],
    ];
    for (let member of ns.gang.getMemberNames()) {
      const info = ns.gang.getMemberInformation(member);
      memberTable.push([
        member,
        info.hack,
        info.str,
        info.def,
        info.dex,
        info.agi,
        multiplyMultValues(
          ns.gang.getAscensionResult(member),
          ([key]) => key !== "respect",
        ).toPrecision(5),
      ]);
    }
    printTable(ns, memberTable);
    return;
  }

  let iterCount = 0;
  const karma = ns.heart.break();
  if (karma > -54000) {
    return;
  } else if (!ns.gang.inGang()) {
    const created = ns.gang.createGang("Speakers for the Dead");
    if (!created) {
      return;
    }
    ns.tprintf("[gang] gang created.");
  }

  while (true) {
    const otherGangs = ns.gang.getAllGangInformation();
    const name = ns.gang.getGangInformation().faction;
    let chance = 0;
    let remainingGangs = 0;

    for (let gang in otherGangs) {
      if (otherGangs[gang].territory && gang !== name) {
        chance += ns.gang.getChanceToWinClash(gang);
        remainingGangs += 1;
      }
    }
    chance /= remainingGangs;
    if (!(iterCount % 1000) && chance) {
      ns.tprintf(
        "[gang] overall win chance: ",
        (chance * 100).toPrecision(3),
        "%",
      );
    }

    const members = ns.gang.getMemberNames();
    const warfare = chance < 0.8 && members.length === 12;
    ns.gang.setTerritoryWarfare(chance >= 0.8);

    let memberCount = 0;
    for (let member of members) {
      const ascension = ns.gang.getAscensionResult(member);
      if (ascension) {
        const ascensionMult = multiplyMultValues(
          ascension,
          ([key]) => key !== "respect",
        );
        const threshold = 2;
        if (ascensionMult >= threshold) {
          ns.gang.ascendMember(member);
          ns.tprintf("[gang] ascended ", member);
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
      ns.tprintf("[gang] recruited new member ", memberCount);
      memberCount += 1;
      await ns.sleep(100);
      recruitable = ns.gang.canRecruitMember();
    }

    // find out how much is top 10%
    const ten = Math.round(members.length / 10);
    // sort by worst hackers, worst combat, most wanted loss from justice
    // for worst hackers, filter out top 10% worst combat
    const justiceWanted = (member) =>
      ns.formulas.gang.wantedLevelGain(
        ns.gang.getGangInformation(),
        ns.gang.getMemberInformation(member),
        ns.gang.getTaskStats("Vigilante Justice"),
      );
    const bestJustice = members
      .sort((a, b) => justiceWanted(a) - justiceWanted(b))
      .slice(0, ten);
    const worstCombat = members
      .sort((a, b) => minCombat(ns, a) - minCombat(ns, b))
      .filter((i) => !bestJustice.includes(i))
      .slice(0, ten);
    const worstHackers = members
      .sort(
        (a, b) =>
          ns.gang.getMemberInformation(a).hack -
          ns.gang.getMemberInformation(b).hack,
      )
      .filter((i) => !bestJustice.includes(i) && !worstCombat.includes(i))
      .slice(0, ten);
    // init list of unassigned and wanted loss from vigilante justice
    let unassigned = [];
    let wantedGain = 0;

    const equipment = ns.gang.getEquipmentNames();
    for (let member of members) {
      for (let equip of equipment) {
        if (ns.getPlayer().money >= ns.gang.getEquipmentCost(equip) * 1000) {
          ns.gang.purchaseEquipment(member, equip);
        }
      }

      // if in top 10% best combat and not warfare mode, assign to vigilante justice (add to wanted loss)
      if (bestJustice.includes(member) && !warfare) {
        ns.gang.setMemberTask(member, "Vigilante Justice");
        wantedGain += ns.formulas.gang.wantedLevelGain(
          ns.gang.getGangInformation(),
          ns.gang.getMemberInformation(member),
          ns.gang.getTaskStats("Vigilante Justice"),
        );
      }
      // elif in top 10% worst combat, assign to train combat
      else if (worstCombat.includes(member)) {
        ns.gang.setMemberTask(member, "Train Combat");
      }
      // elif in top 10% worst hackers, assign to train hacking
      else if (worstHackers.includes(member)) {
        ns.gang.setMemberTask(member, "Train Hacking");
      }
      // else add to list of unassigned
      else {
        unassigned.push(member);
      }
    }

    let unassignedTask = "Mug People";
    // if warfare mode, set task to warfare
    if (warfare) {
      unassignedTask = "Territory Warfare";
    } else {
      // check highest crime all unassigned can do at the same time without causing net wanted gain
      // if no more remaining gangs, base off money
      let taskList = ns.gang.getTaskNames();
      if (chance >= 0.8 || !chance) {
        taskList = taskList.sort(
          (a, b) =>
            totalMoneyGain(ns, unassigned, b) -
            totalMoneyGain(ns, unassigned, a),
        );
      } else {
        taskList = taskList.sort(
          (a, b) =>
            totalRespectGain(ns, unassigned, b) -
            totalRespectGain(ns, unassigned, a),
        );
      }
      for (let task of taskList) {
        if (
          ns.gang.getGangInformation().wantedLevel <= 1 ||
          totalWantedGain(ns, unassigned, task) + wantedGain < 0
        ) {
          unassignedTask = task;
          break;
        }
      }
    }

    for (let member of unassigned) {
      ns.gang.setMemberTask(member, unassignedTask);
    }

    await ns.sleep(100);

    iterCount += 1;
  }
}
