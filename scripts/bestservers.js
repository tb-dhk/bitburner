import { allServers } from './allservers'

/** @param {NS} ns */
function best(ns) {
  const player = ns.getPlayer()

  const servers = allServers(ns).slice(1).filter(i => ns.getServerMoneyAvailable(i) && ns.hasRootAccess(i));
  const serverScores = [];

  // Process servers one by one
  for (const server of servers) {
    const maxMoney = ns.getServerMaxMoney(server);
    const minSecurity = ns.getServerMinSecurityLevel(server);
    let growTime = ns.getGrowTime(server) / 1000;    // convert ms to seconds
    if (ns.fileExists("Formulas.exe", "home")) {
      const serverObj = ns.getServer(server)
      growTime = ns.formulas.hacking.growTime(serverObj, player)
    }
    const doubleThreads = ns.growthAnalyze(server, 2)

    const score = maxMoney / (minSecurity + 1) / growTime / doubleThreads;

    serverScores.push([server, [score, maxMoney, minSecurity, growTime / 1000, doubleThreads]]);
  }

  // Sort after all scores are collected
  serverScores.sort((a, b) => b[1][0] - a[1][0]);

  return serverScores;
}

export async function main(ns) {
  ns.tprint(["name","score","maxmoney","minsecurity","growtime","doublethreads"])
  for (let i of best(ns)) {
    ns.tprint(i)
  }
}
