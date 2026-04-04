import { allServers } from "./allservers";

/** @param {NS} ns */
export async function main(ns) {
  let home = false;
  let match = "";
  if (ns.args.length) {
    home = ns.args[0];
    match = ns.args[1];
  }
  let servers = allServers(ns);
  if (!home) {
    servers = servers.slice(1);
  }
  for (let server of servers) {
    const scripts = ns
      .ps(server)
      .filter(
        (i) => (i.filename === match || !match) && i.filename !== "killall.js",
      );
    for (let script of scripts) {
      ns.kill(script.pid);
    }
  }
}
