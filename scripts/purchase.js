/** @param {NS} ns */
export async function main(ns) {
  let currentlyBought = await ns.getPurchasedServers().length
  let bought = 0

  ns.tprint(currentlyBought, " servers bought.")
  ns.tprint("attempting to buy up to ", ns.getPurchasedServerLimit(), " servers.")
  const ram = 8;

  while (currentlyBought < ns.getPurchasedServerLimit()) {
    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
      const name = ns.purchaseServer("pserv-" + currentlyBought, ram);
      ns.tprint("bought ", name)
      currentlyBought++
      bought++
    }
    await ns.sleep(1000)
  }
  ns.tprint("bought ", bought, " servers.")
}