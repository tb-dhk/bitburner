import { allServers } from './allservers'

/** @param {NS} ns */
export function best(ns) {
  const player = ns.getPlayer()

  const servers = allServers(ns).slice(1).filter(i => ns.getServerMaxMoney(i) && ns.hasRootAccess(i) && ns.getServerRequiredHackingLevel(i) <= ns.getHackingLevel());
  const serverScores = [];

  // Process servers one by one
  for (const server of servers) {
    const maxMoney = ns.getServerMaxMoney(server);

    let growTime, weakenTime, hackTime, hackThreads;

    if (ns.fileExists("Formulas.exe", "home")) {
      let serverObj = ns.getServer(server);
      serverObj.hackDifficulty = serverObj.minDifficulty;
      serverObj.moneyAvailable = maxMoney / 2

      growTime = ns.formulas.hacking.growTime(serverObj, player);
      weakenTime = ns.formulas.hacking.weakenTime(serverObj, player);
      hackTime = ns.formulas.hacking.hackTime(serverObj, player);
      hackThreads = ns.formulas.hacking.hackPercent(serverObj, player)
    } else {
      growTime = ns.getGrowTime(server);
      weakenTime = ns.getWeakenTime(server);
      hackTime = ns.getHackTime(server);
      const moneyAvailable = ns.getServerMoneyAvailable(server)
      hackThreads = ns.hackAnalyzeThreads(server, moneyAvailable) * (maxMoney / moneyAvailable)
    }

    // pick the longest one
    let maxTime = Math.max(growTime, weakenTime, hackTime);

    const doubleThreads = ns.growthAnalyze(server, 2)

    const score = maxMoney ** 2 / maxTime / (doubleThreads + hackThreads);

    serverScores.push([server, [score, maxMoney, maxTime / 1000, doubleThreads, hackThreads]]);
  }

  // Sort after all scores are collected
  const sort = Number(ns.args[0]) || 0
  const asc = (ns.args[1] === "-a") ? -1 : 1
  serverScores.sort((a, b) => (b[1][sort] - a[1][sort]) * asc);

  return serverScores;
}

export async function main(ns) {
  const list = best(ns)
  ns.tprint(list.length, " servers found")
  ns.tprint(["name",["score","maxmoney","minsecurity","maxtime","doublethreads", "hackthreads"]])
  for (let i of list) {
    ns.tprint(i)
  }
  ns.tprint(best(ns).map(i => i[0]).join(" "))
}
