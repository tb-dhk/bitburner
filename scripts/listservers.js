import { allServers } from "./allservers";

export async function main(ns) {
  const servers = allServers(ns);
  ns.tprint(["name", "root", "money", "level", "ram"]);
  for (let server of servers) {
    ns.tprint([
      server,
      ns.hasRootAccess(server),
      ns.getServerMaxMoney(server),
      ns.getServerRequiredHackingLevel(server),
      ns.getServerMaxRam(server),
    ]);
  }
}
