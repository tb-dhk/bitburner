import { allServers } from "./allservers";

/** @param {NS} ns */
export function next(ns) {
  const servers = allServers(ns)
    .slice(1)
    .filter((i) => ns.getServerRequiredHackingLevel(i) > ns.getHackingLevel());
  const serverScores = servers
    .map((i) => [i, ns.getServerRequiredHackingLevel(i)])
    .sort((a, b) => a[1] - b[1]);

  return serverScores;
}

export async function main(ns) {
  const list = next(ns);
  ns.tprint(list.length, " servers");
  ns.tprint(["name", "level"]);
  for (let i of list) {
    ns.tprint(i);
  }
}
