/** @param {NS} ns */
async function nuke(ns, target) {
  const moneyThresh = ns.getServerMaxMoney(target);
  const securityThresh = ns.getServerMinSecurityLevel(target);
  if (!ns.hasRootAccess(target)) {
    await ns.nuke(target)
  }

  while (true) {
    while (ns.getServerMoneyAvailable(target) < moneyThresh) {
      while (ns.getServerSecurityLevel(target) > securityThresh + 1) {
        await ns.weaken(target);
      }
      await ns.grow(target);
    }

    await ns.hack(target);
  }
}

export async function main(ns) {
  const choice = "clarkinc"

  await nuke(ns, choice)
}