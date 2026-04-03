import { printTable } from "./common.js"

const allFactions = [
  "CyberSec", "Tian Di Hui",
  "Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven",
  "CyberSec", "NiteSec", "The Black Hand", "BitRunners",
  "ECorp", "MegaCorp", "KuaiGong International", "Four Sigma", "NWO", "Blade Industries", "OmniTek Incorporated", "Bachman & Associates", "Clarke Incorporated", "Fulcrum Secret Technologies",
  "Slum Snakes", "Tetrads", "Silhouette", "Speakers for the Dead", "The Dark Army", "The Syndicate",
  "The Covenant", "Illuminati", "Daedalus"
]

export function untouchedAugs(ns) {
  const ownedAugmentations = ns.singularity.getOwnedAugmentations(true)
  const allAugmentations = allFactions.map(i => ns.singularity.getAugmentationsFromFaction(i)).flat()
  return allAugmentations.filter(i => !ownedAugmentations.includes(i))
}

export function nfgLevel(ns, total) {
  if (!total) {
    return ns.getResetInfo().ownedAugs.get("NeuroFlux Governor")
  } else {
    const pending = ns.singularity.getOwnedAugmentations(true).filter(i => i === "NeuroFlux Governor").length - 1
    return nfgLevel(ns, false) + pending
  }
}

/** @param {NS} ns */
export async function nextAugs(ns) {
  if (!untouchedAugs(ns).length) {
    return ["NeuroFlux Governor"]
  }

  const ownedAugmentations = ns.singularity.getOwnedAugmentations(true)
  const factions = ns.getPlayer().factions
  
  // list all the current augmentations and sort them by price
  const augmentations = []
  for (let i = 0; i < factions.length; i++) {
    if (factions[i] !== "Shadows of Anarchy") {
      augmentations.push(ns.singularity.getAugmentationsFromFaction(factions[i]))
    }
  }
  const sortedAugmentations = [
    ...new Set(
      augmentations.flat()
        .sort((a, b) => ns.singularity.getAugmentationRepReq(a) - ns.singularity.getAugmentationRepReq(b))
        .sort((a, b) => ns.singularity.getAugmentationPrice(a) - ns.singularity.getAugmentationPrice(b))
    )
  ]
    .filter(i => i !== "NeuroFlux Governor")
    .filter(i => !ownedAugmentations.includes(i))

  // find number of augmentations needed for next round
  // choose however many you need such that you buy 10 augs in total
  // nfg should be about 1/5 of all augs
  const totalAugmentations = ns.singularity.getOwnedAugmentations(true).length + nfgLevel(ns, false) - 1
  const installedAugmentations = ns.singularity.getOwnedAugmentations(false).length + nfgLevel(ns, false) - 1
  const requiredNumAugs = Math.ceil((installedAugmentations + 5) / 10) * 10 - totalAugmentations
  // find total number of nfg needed (total number of augs incl nfg after reset ceildiv by 5)
  const requiredTotalNFG = Math.ceil(Math.ceil((installedAugmentations + 5)/10)*10 / 5)
  // find number of nfg we need to buy this round
  const requiredNFG = Math.max(requiredTotalNFG - await nfgLevel(ns, true), 0)
  // find total number of augs we need to buy this round
  // subtracting required nfg so we reserve that number of slots for it
  const augsToBuy = requiredNumAugs - requiredNFG
  
  // insert prereqs, cheap to expensive
  // prereqs come after augmentations so that when we reverse the list they come before
  let reorderedAugmentations = []
  for (let aug of sortedAugmentations) {
    const preReqs = ns.singularity.getAugmentationPrereq(aug)
      .filter(i => !ns.singularity.getOwnedAugmentations(true).includes(i))
    if (!reorderedAugmentations.includes(aug)) {
      reorderedAugmentations.push(aug)
    }
    reorderedAugmentations = [
      ...reorderedAugmentations, 
      ...preReqs.filter(i => !reorderedAugmentations.includes(i))
    ]
  }

  // other scripts should target the most expensive (in this list)
  reorderedAugmentations = reorderedAugmentations
    .slice(0, augsToBuy)
    .toReversed()
  reorderedAugmentations = [...reorderedAugmentations, ...Array(Math.max(0, requiredNFG)).fill("NeuroFlux Governor")]
  return reorderedAugmentations
}

/** @param {NS} ns */
export async function nextFactions(ns) {
  const factions = ns.getPlayer().factions

  if (!untouchedAugs(ns).length) {
    return [factions.sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a))[0]]
  }

  // get list of remaining augs
  const remainingAugs = await nextAugs(ns)
  // do not filter for the sake of grinding rep for more favor after installation

  // find number of factions needed and corresponding rep needed
  // try to stick to as few as possible
  const dic = {}
  for (let faction of factions) {
    dic[faction] = []
    const factionAugmentations = ns.singularity.getAugmentationsFromFaction(faction)
    for (let aug of remainingAugs) {
      if (factionAugmentations.includes(aug)) {
        dic[faction].push(aug)
      }
    }
  }

  const factionList = []

  for (let aug of remainingAugs) {
    if (aug !== "NeuroFlux Governor") {
      // choose faction based on:
      // - whether augmentation can be bought from it
      // - if the faction needs to be grinded for reputation
      // sort by:
      // - reputation (dec)
      // - number of augmentations (dec)
      const faction = Object.keys(dic)
        .filter(i => dic[i].includes(aug))
        .filter(i => ns.singularity.getFactionRep(i) < ns.singularity.getAugmentationRepReq(aug))
        .sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a))
        .sort((a, b) => dic[b].length - dic[a].length)[0]
      if (faction && !factionList.includes(faction)) {
        factionList.push(faction)
      }
    }
  }
  return factionList.filter(i => i !== "Bladeburners")
}

/** @param {NS} ns */
export async function main(ns) {
  const totalAugmentations = ns.singularity.getOwnedAugmentations(true).length + nfgLevel(ns, false) - 1
  const installedAugmentations = ns.singularity.getOwnedAugmentations(false).length + nfgLevel(ns, false) - 1
  const requiredTotalNFG = Math.ceil(Math.ceil((installedAugmentations + 5)/10)*10 / 5)
  ns.tprint(`current augs: ${installedAugmentations} (${totalAugmentations}, goal ${Math.ceil((installedAugmentations + 5) / 10) * 10})`)
  ns.tprint(`current nfgs: ${await nfgLevel(ns, false)} (${await nfgLevel(ns, true)}, goal ${requiredTotalNFG})`)
  const purchasedAugs = ns.singularity.getOwnedAugmentations(true)
    .filter(i => !ns.singularity.getOwnedAugmentations(false).includes(i))
  const augs = (await nextAugs(ns)).filter(i => i !== "NeuroFlux Governor")
  ns.tprint("")
  ns.tprint("pending augmentations: ")
  const table = [["number", "augmentation name", "factions", "bought?", "price (scaled)", "money?", "rep req", "reputation?"]]
  let count = 0
  let sum = 0
  for (let aug of augs) {
    const augFactions = ns.getPlayer().factions.filter(i => ns.singularity.getAugmentationsFromFaction(i).includes(aug))
    const money = ns.getServerMoneyAvailable("home")
    const augPrice = ns.singularity.getAugmentationPrice(aug) * (1.9 ** count)
    const maxRep = Math.max(...augFactions.map(i => ns.singularity.getFactionRep(i)))
    const repReq = ns.singularity.getAugmentationRepReq(aug)
    table.push([
      (count + 1).toString(),
      aug, 
      augFactions.join(", "), 
      purchasedAugs.includes(aug) ? "✓" : "✗", 
      augPrice.toExponential(3),
      purchasedAugs.includes(aug) || money >= augPrice ? "✓" : "✗", 
      repReq.toExponential(3),
      maxRep >= repReq ? "✓" : "✗"
    ])
    count += 1
    sum += augPrice
  }
  printTable(ns, table)
  ns.tprint("estimated total cost: ", sum.toExponential(3))

  ns.tprint("")

  const nextFaction = (await nextFactions(ns))[0]
  if (nextFaction) {
    const nextFactionAugs = ns.singularity.getAugmentationsFromFaction(nextFaction)
    const repGoal = Math.max(
      ...augs
        .filter(i => nextFactionAugs.includes(i))
        .map(i => ns.singularity.getAugmentationRepReq(i))
    )
    ns.tprint("next faction: ", nextFaction)
    ns.tprint("reputation goal for this faction: ", augs.length ? repGoal.toExponential(3) : "none")
    ns.tprint("number of remaining augmentations: ", untouchedAugs(ns).length)
  } else {
    ns.tprint("factions have been exhausted for now.")
  }
}