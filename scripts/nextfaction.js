import { printTable } from "./common";

const allFactions = [
  "CyberSec",
  "Tian Di Hui",
  "Sector-12",
  "Chongqing",
  "New Tokyo",
  "Ishima",
  "Aevum",
  "Volhaven",
  "CyberSec",
  "NiteSec",
  "The Black Hand",
  "BitRunners",
  "ECorp",
  "MegaCorp",
  "KuaiGong International",
  "Four Sigma",
  "NWO",
  "Blade Industries",
  "OmniTek Incorporated",
  "Bachman & Associates",
  "Clarke Incorporated",
  "Fulcrum Secret Technologies",
  "Slum Snakes",
  "Tetrads",
  "Silhouette",
  "Speakers for the Dead",
  "The Dark Army",
  "The Syndicate",
  "The Covenant",
  "Illuminati",
  "Daedalus",
  "Bladeburners",
];

export function allAugmentations(ns) {
  return [
    ...new Set(
      allFactions
        .map((i) => ns.singularity.getAugmentationsFromFaction(i))
        .flat(),
    ),
  ];
}

export function untouchedAugs(ns) {
  const ownedAugmentations = ns.singularity.getOwnedAugmentations(true);
  return allAugmentations(ns).filter((i) => !ownedAugmentations.includes(i));
}

export function nfgLevel(ns, total) {
  if (!total) {
    return ns.getResetInfo().ownedAugs.get("NeuroFlux Governor");
  } else {
    const pending =
      ns.singularity
        .getOwnedAugmentations(true)
        .filter((i) => i === "NeuroFlux Governor").length - 1;
    return nfgLevel(ns, false) + pending;
  }
}

function addAugmentationToList(ns, aug, list) {
  const preReqs = ns.singularity
    .getAugmentationPrereq(aug)
    .filter((i) => !ns.singularity.getOwnedAugmentations(true).includes(i))
    .sort((a, b) => {
      const priceDiff =
        ns.singularity.getAugmentationPrice(a) -
        ns.singularity.getAugmentationPrice(b);
      return priceDiff !== 0
        ? priceDiff
        : ns.singularity.getAugmentationRepReq(a) -
            ns.singularity.getAugmentationRepReq(b);
    });
  if (!list.includes(aug)) {
    list = [aug, ...list.filter((i) => !preReqs.includes(i))];
  }
  for (let preReq of preReqs) {
    list = addAugmentationToList(ns, preReq, list);
  }
  return list;
}

function factionMaxRep(ns, faction, ignore = []) {
  const augsToIgnore = ignore
    .map((i) => ns.singularity.getAugmentationsFromFaction(i))
    .flat();
  return Math.max(
    ...ns.singularity
      .getAugmentationsFromFaction(faction)
      .filter((i) => !augsToIgnore.includes(i))
      .map((j) => {
        return ns.singularity.getAugmentationRepReq(j);
      }),
  );
}

/** @param {NS} ns */
export async function nextAugs(ns, number) {
  const factions = ns.getPlayer().factions;

  // find number of augmentations needed for next round
  // choose however many you need such that you buy 10 augs in total
  // nfg should be about 1/5 of all augs
  const totalAugmentations =
    ns.singularity.getOwnedAugmentations(true).length + nfgLevel(ns, false) - 1;
  const installedAugmentations =
    ns.singularity.getOwnedAugmentations(false).length +
    nfgLevel(ns, false) -
    1;
  const requiredNumAugs =
    Math.ceil((installedAugmentations + 5) / 10) * 10 - totalAugmentations;
  // find total number of nfg needed (total number of augs incl nfg after reset ceildiv by 5)
  const requiredTotalNFG = Math.ceil(
    (Math.ceil((installedAugmentations + 5) / 10) * 10) / 5,
  );
  // find number of nfg we need to buy this round
  const requiredNFG = Math.max(
    requiredTotalNFG - (await nfgLevel(ns, true)),
    0,
  );
  // find total number of augs we need to buy this round
  // subtracting required nfg so we reserve that number of slots for it
  const sortedAugmentations = [
    ...new Set(
      allAugmentations(ns).sort((a, b) => {
        const priceDiff =
          ns.singularity.getAugmentationPrice(b) -
          ns.singularity.getAugmentationPrice(a);
        return priceDiff !== 0
          ? priceDiff
          : ns.singularity.getAugmentationRepReq(b) -
              ns.singularity.getAugmentationRepReq(a);
      }),
    ),
  ]
    .filter((i) =>
      factions.some((j) =>
        ns.singularity.getAugmentationFactions(i).includes(j),
      ),
    )
    .filter((i) => !ns.singularity.getOwnedAugmentations(true).includes(i))
    .filter((i) => i !== "NeuroFlux Governor");

  const augsToBuy = number
    ? Math.min(sortedAugmentations.length, number)
    : requiredNumAugs - requiredNFG;
  const remainder = Math.max(sortedAugmentations.length - augsToBuy, 0);

  // get the back of sortedAugmentations (the cheapest)
  // iterate from cheapest
  // prereqs come before augmentations
  let reorderedAugmentations = [];
  for (let aug of sortedAugmentations.slice(remainder).toReversed()) {
    reorderedAugmentations = addAugmentationToList(
      ns,
      aug,
      reorderedAugmentations,
    );
    if (reorderedAugmentations.length >= augsToBuy) {
      break;
    }
  }

  reorderedAugmentations = reorderedAugmentations.slice(0, augsToBuy);
  while (reorderedAugmentations.length < requiredNumAugs) {
    reorderedAugmentations.push("NeuroFlux Governor");
  }

  return reorderedAugmentations;
}

/** @param {NS} ns */
export async function nextFactions(ns, number, filtered = true) {
  const factions = ns.getPlayer().factions;

  if (!untouchedAugs(ns).length) {
    return [
      factions.sort(
        (a, b) =>
          ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a),
      )[0],
    ];
  }

  // get list of remaining augs
  let remainingAugs = (await nextAugs(ns, number)).sort(
    (a, b) =>
      ns.singularity.getAugmentationRepReq(b) -
      ns.singularity.getAugmentationRepReq(a),
  );

  if (filtered) {
    remainingAugs = remainingAugs.filter(
      (i) =>
        !ns.singularity
          .getAugmentationFactions(i)
          .some(
            (j) =>
              ns.singularity.getFactionRep(j) >=
              ns.singularity.getAugmentationRepReq(i),
          ),
    );
  }

  // find number of factions needed and corresponding rep needed
  // try to stick to as few as possible
  let factionList = [];
  for (let aug of remainingAugs) {
    const newFaction = factions
      .filter((i) => ns.singularity.getAugmentationFactions(aug).includes(i))
      .sort((a, b) => {
        if (
          factionMaxRep(ns, b, factionList) !==
          factionMaxRep(ns, a, factionList)
        ) {
          return (
            factionMaxRep(ns, b, factionList) -
            factionMaxRep(ns, a, factionList)
          );
        }
        return (
          ns.singularity.getFactionFavor(b) - ns.singularity.getFactionFavor(a)
        );
      })[0];
    if (newFaction && !factionList.includes(newFaction)) {
      factionList.push(newFaction);
    }
  }

  if (filtered) {
    factionList = factionList.filter(
      (i) =>
        ns.singularity.getFactionRep(i) <
        Math.max(
          ...remainingAugs
            .filter((j) =>
              ns.singularity.getAugmentationsFromFaction(i).includes(j),
            )
            .map((j) => ns.singularity.getAugmentationRepReq(j)),
        ),
    );
  }

  factionList = factionList.sort(
    (a, b) =>
      factionMaxRep(ns, b, factionList) - factionMaxRep(ns, a, factionList),
  );

  return factionList;
}

/** @param {NS} ns */
export async function main(ns) {
  let string = "\n";
  const number = Number(ns.args[0]);
  const totalAugmentations =
    ns.singularity.getOwnedAugmentations(true).length + nfgLevel(ns, false) - 1;
  const installedAugmentations =
    ns.singularity.getOwnedAugmentations(false).length +
    nfgLevel(ns, false) -
    1;
  const requiredTotalNFG = Math.ceil(
    (Math.ceil((installedAugmentations + 5) / 10) * 10) / 5,
  );
  string += `current augs: ${installedAugmentations} (${totalAugmentations}, goal ${Math.ceil((installedAugmentations + 5) / 10) * 10})\n`;
  string += `current nfgs: ${await nfgLevel(ns, false)} (${await nfgLevel(ns, true)}, goal ${requiredTotalNFG})\n`;
  const purchasedAugs = ns.singularity
    .getOwnedAugmentations(true)
    .filter((i) => !ns.singularity.getOwnedAugmentations(false).includes(i));
  const augs = await nextAugs(ns, number);

  string += "\npending augmentations: ";
  const table = [
    [
      "number",
      "augmentation name",
      "factions",
      "bought?",
      "price (scaled)",
      "price (cumulative)",
      "money?",
      "rep req",
      "reputation?",
    ],
  ];
  let count = 0;
  let sum = 0;
  let nfgCount = 0;
  let totalPrice = 0;
  const factions = {};

  for (let aug of augs) {
    const money = ns.getPlayer().money;
    const augPrice = ns.singularity.getAugmentationPrice(aug) * 1.9 ** count;
    totalPrice += augPrice;
    const augFaction = (await nextFactions(ns, number, false)).filter((i) =>
      ns.singularity.getAugmentationsFromFaction(i).includes(aug),
    )[0];
    const maxRep = ns.singularity.getFactionRep(augFaction);
    let repReq = ns.singularity.getAugmentationRepReq(aug);
    if (aug == "NeuroFlux Governor") {
      repReq *= 1.14 ** nfgCount;
      nfgCount += 1;
    }
    sum += augPrice;

    table.push([
      (count + 1).toString(),
      aug,
      augFaction ? augFaction : "",
      purchasedAugs.includes(aug) ? "✓" : "✗",
      augPrice.toExponential(3),
      sum.toExponential(3),
      purchasedAugs.includes(aug) || money >= totalPrice ? "✓" : "✗",
      repReq.toExponential(3),
      maxRep >= repReq ? "✓" : "✗",
    ]);
    count += 1;
    factions[augFaction] = Math.max(factions[augFaction] ?? 0, repReq);
  }
  string += printTable(ns, table, true);
  const money = ns.getPlayer().money;
  string += `money: ${money.toExponential(3)} / ${sum.toExponential(3)} (${((money / sum) * 100).toPrecision(3)}%) \n\n`;

  if ((await nextFactions(ns)).length) {
    string += "next faction: " + (await nextFactions(ns))[0];
    const factionTable = [["faction", "current", "goal", "progress"]];
    for (let faction in factions) {
      const current = ns.singularity.getFactionRep(faction);
      factionTable.push([
        faction,
        Math.min(current, factions[faction]).toExponential(3),
        factions[faction].toExponential(3),
        Math.min((current / factions[faction]) * 100, 100).toPrecision(3) + "%",
      ]);
    }
    const totalCurrent = Object.keys(factions).reduce(
      (acc, value) => acc + ns.singularity.getFactionRep(value),
      0,
    );
    const totalGoal = Object.values(factions).reduce(
      (acc, value) => acc + value,
      0,
    );
    factionTable.push([
      "total",
      Math.min(totalCurrent, totalGoal).toExponential(3),
      totalGoal.toExponential(3),
      Math.min((totalCurrent / totalGoal) * 100, 100).toPrecision(3) + "%",
    ]);
    string += printTable(ns, factionTable, true);
  } else {
    string += "you have no factions left to work for for now.";
  }

  string += "\n";

  if (untouchedAugs(ns).length) {
    string += "number of remaining augmentations: " + untouchedAugs(ns).length;
  } else {
    string += "you have bought all augmentations.";
  }
  ns.tprintf(string);
}
