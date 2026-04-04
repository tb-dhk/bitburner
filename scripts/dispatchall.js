import { best } from "./bestservers";

/** @param {NS} ns */
export async function main(ns) {
  ns.ramOverride(6.9);
  let servers = ns.args;
  if (!ns.args.length) {
    servers = best(ns)
      .map((i) => i[0])
      .filter(
        (i) =>
          ns.getServerMaxMoney(i) &&
          ns.hasRootAccess(i) &&
          ns.getServerRequiredHackingLevel(i) <= ns.getHackingLevel(),
      );
    ns.tprint("dispatching ", servers.join(" "));
  }

  const runningScripts = ns.ps("home");
  const activeTargets = new Set(
    runningScripts
      .filter((proc) => proc.filename === "dispatch.js")
      .map((proc) => proc.args[0])
      .filter((arg) => arg !== undefined),
  );

  for (let server of servers) {
    if (!activeTargets.has(server)) {
      ns.run("dispatch.js", 1, server);
      await ns.sleep(100); // small delay to avoid race conditions
    }
  }
}
