/** @param {NS} ns */
export async function main(ns) {
  let currentlyBought = []

  while (true) {
    currentlyBought = ns.getPurchasedServers()
    if (currentlyBought.length >= 25) {
      const leastRAM = currentlyBought.sort((a, b) => (ns.getServerMaxRam(a) - ns.getServerMaxRam(b)))[0]
      const newRAM = ns.getServerMaxRam(leastRAM) * 2
      const upgradeCost = ns.getPurchasedServerUpgradeCost(leastRAM, newRAM)
      if (ns.getServerMaxRam(leastRAM) === ns.getPurchasedServerMaxRam()) {
        ns.tprint("all servers upgraded to max.")
        return
      }
      if (ns.getServerMoneyAvailable("home") >= upgradeCost * 100) {
        ns.upgradePurchasedServer(leastRAM, newRAM)
        ns.tprint("upgrading ", leastRAM, " to ", newRAM, "GB ($", upgradeCost, ")")
        await ns.sleep(20)
      } else {
        ns.tprint("next upgrade (to ", newRAM, "GB) costs $", upgradeCost, ", will buy at $", upgradeCost * 100)
        await ns.sleep(60000)
      }
    } else {
      let currentlyBought = await ns.getPurchasedServers().length

      ns.tprint(currentlyBought, " servers bought.")
      ns.tprint("attempting to buy up to ", ns.getPurchasedServerLimit(), " servers.")
      const ram = 1 

      while (currentlyBought < ns.getPurchasedServerLimit()) {
        currentlyBought = await ns.getPurchasedServers().length
        if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
          const name = ns.purchaseServer("pserv-" + currentlyBought, ram);
          ns.tprint("bought ", name)
        }
        await ns.sleep(20)
      }
    }
    await ns.sleep(20)
  }
}
