/** @param {NS} ns */
async function prime(ns, target) {
  const moneyThresh = ns.getServerMaxMoney(target);
  const securityThresh = ns.getServerMinSecurityLevel(target);

  while (ns.getServerMoneyAvailable(target) < moneyThresh || ns.getServerSecurityLevel(target) > securityThresh) {
    await ns.grow(target);
    while (ns.getServerSecurityLevel(target) > securityThresh) {
      await ns.weaken(target);
    }
  }
}

export async function main(ns) {
  const choice = ns.args[0]

  await prime(ns, choice)
}
