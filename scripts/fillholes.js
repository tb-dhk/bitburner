import { allServers } from "./allservers";

/** @param {NS} ns */
export async function main(ns) {
  const servers = allServers(ns)
    .slice(1)
    .filter((s) => ns.hasRootAccess(s));
  const scriptRAM = ns.getScriptRam("homegrown.js");

  for (let server of servers) {
    ns.scp("homegrown.js", server, "home"); // fixed arg order
    const numThreads = Math.floor(
      ((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / scriptRAM) *
        (server === "home" ? 0.25 : 1),
    );
    if (numThreads > 0) {
      ns.exec("homegrown.js", server, numThreads);
    }
  }
}
