import { allServers } from './allservers'

/** @param {NS} ns */
export async function main(ns) {
  const servers = allServers(ns).slice(1)
  for (let server in servers) {
    await ns.killall(servers[server])
  }
}