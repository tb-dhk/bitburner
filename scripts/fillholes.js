import { allServers } from "./allservers";

/** @param {NS} ns */
export async function main(ns) {
  const servers = allServers(ns).filter((s) => ns.hasRootAccess(s));
  const scriptRAM = ns.getScriptRam("homegrown.js");

  for (let server of servers) {
    ns.scp("homegrown.js", server, "home"); // fixed arg order
    const ramLeft = Math.max(
      ns.getServerMaxRam(server) -
        ns.getServerUsedRam(server) -
        (server === "home" ? 1000 : 0),
      0,
    );
    const numThreads = Math.floor(ramLeft / scriptRAM);
    if (numThreads > 0) {
      ns.exec("homegrown.js", server, numThreads);
    }
  }
}
