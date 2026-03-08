/** @param {NS} ns */
export default async function main(ns) {
  const ownedAugmentations = ns.singularity.getOwnedAugmentations(true)
  const factions = ns.getPlayer().factions

  // find faction to work for
  let nextFaction = ""
  let repGap = Infinity
  for (let i = 0; i < factions.length; i++) {
    const factionAugmentations = ns.singularity.getAugmentationsFromFaction(factions[i])
    const unowned = factionAugmentations.filter(i => !ownedAugmentations.includes(i))
    const maxRep = Math.max(...unowned.map(i => ns.singularity.getAugmentationRepReq(i)))
    const newRepGap = maxRep - ns.singularity.getFactionRep(factions[i])
    if (unowned.length > 0 && newRepGap > 0 && newRepGap < repGap) {
      nextFaction = factions[i]
      repGap = newRepGap
    }
  }

  return nextFaction
}
