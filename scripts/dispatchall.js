import { best } from './bestservers'

/** @param {NS} ns */
export async function main(ns) {
  let servers = ns.args
  if (!ns.args.length) {
    servers = best(ns).map(i => i[0]).filter(i => ns.getServerMaxMoney(i) && ns.hasRootAccess(i) && ns.getServerRequiredHackingLevel(i) <= ns.getHackingLevel())
    ns.tprint("dispatching ", servers.join(" "))
  }
  ns.run("killall.js", 1, "true", "dispatch.js")
  await ns.sleep(100)
  for (let server of servers) {
    ns.run("dispatch.js", 1, server)
  }
}
