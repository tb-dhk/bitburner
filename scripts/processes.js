import { allServers } from "./allservers.js";
import { printTable } from "./common.js";

/** @param {NS} ns */
export async function main(ns) {
  const servers = allServers(ns);
  const table = [["server", "filename", "args", "threads"]];
  for (let server of servers) {
    if (ns.hasRootAccess(server)) {
      const processes = ns.ps(server);
      for (let process of processes) {
        table.push([
          server,
          process.filename,
          process.args.join(" "),
          process.threads,
        ]);
      }
    }
  }
  printTable(ns, table);
}
