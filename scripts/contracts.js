/** @param {NS} ns **/
import { allServers } from './allservers.js';

export async function main(ns) {
  const delay = 60 * 1000; // 1 minute in ms
  const seenContracts = new Set();

  const servers = allServers(ns);

  for (const server of servers) {
    if (ns.hasRootAccess(server)) {
      const contracts = ns.ls(server, '.cct');
      for (const contract of contracts) {
        const id = `${server}:${contract}`;
        if (!seenContracts.has(id)) {
          seenContracts.add(id);
          ns.tprint(`[${new Date().toLocaleTimeString()}] Contract found on ${server}: ${contract}`);
        }
      }
    }
  }

  if (!Array.from(seenContracts).length) {
    ns.tprint(`[${new Date().toLocaleTimeString()}] no contracts found :(`);
  }
}