/** @param {NS} ns **/
import { allServers } from './allservers.js';

export async function main(ns) {
  const servers = allServers(ns);

  const hasBruteSSH = ns.fileExists('BruteSSH.exe', 'home');
  const hasFTPCrack = ns.fileExists('FTPCrack.exe', 'home');
  const hasRelaySMTP = ns.fileExists('relaySMTP.exe', 'home');
  const hasHTTPWorm = ns.fileExists('HTTPWorm.exe', 'home');
  const hasSQLInject = ns.fileExists('SQLInject.exe', 'home');

  for (const server of servers) {
    if (server === 'home') continue;

    if (!ns.hasRootAccess(server)) {
      if (hasBruteSSH) ns.brutessh(server);
      if (hasFTPCrack) ns.ftpcrack(server);
      if (hasRelaySMTP) ns.relaysmtp(server);
      if (hasHTTPWorm) ns.httpworm(server);
      if (hasSQLInject) ns.sqlinject(server);

      try {
        ns.nuke(server);
        ns.tprint(`nuked ${server}`);
      } catch (e) {
        if (e.includes("Not enough ports")) {
          ns.tprint(`failed to nuke ${server} due to not enough ports`)
        } else {
          ns.tprint(`failed to nuke ${server}: ${e}`);
        }
      }
    }
  }
}
