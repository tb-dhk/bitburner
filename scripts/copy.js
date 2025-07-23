/** @param {NS} ns */
import { allServers } from './allservers'

async function copyToChildren(ns) {
  let totalThreads = 0
  const servers = allServers(ns).slice(1)
  ns.tprint("servers: ", servers)
  const scriptRAM = ns.getScriptRam(ns.args[0])
  for (let server in servers) {
    const target = servers[server]
    if (ns.args[0] === "batch.js") {
      for (let i of ["weaken", "hack", "grow", "batch"]) {
        ns.scp(i + ".js", target)
      }
    } else {
      ns.scp(ns.args[0], target)
    }
    try {
      const serverRAMLeft = (await ns.getServerMaxRam(target)) - (await ns.getServerUsedRam(target))
      let threads = Math.floor(serverRAMLeft / scriptRAM)
      if (ns.args[0] === "batch.js" && threads) {
        threads = 1
      }
      totalThreads += threads
      if (threads) {
        ns.exec(ns.args[0], target, threads, ...ns.args.slice(1))
        ns.tprint("finished setting up ", target, " with ", threads, " threads (", serverRAMLeft, "GB free, ", scriptRAM, "GB each)")
      } else {
        ns.tprint("no space left on ", target, ` (only ${serverRAMLeft}GB)`)
      }
    } catch (error) {
      if (error.includes("Not enough ports opened")) {
        ns.tprint(target, " failed due to not enough ports")
      } else {
        ns.tprint(target, " failed due to error:")
        ns.tprint(error)
      }
    }
  }
  ns.tprint("total ", totalThreads, " threads")
}

export async function main(ns) {
  await copyToChildren(ns)
}