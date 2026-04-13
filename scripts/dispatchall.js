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
  }

  const runningScripts = ns.ps("home");
  const activeTargets = new Set(
    runningScripts
      .filter((proc) => proc.filename === "dispatch.js")
      .map((proc) => proc.args[0])
      .filter((arg) => arg !== undefined),
  );

  const filteredServers = servers.filter((i) => !activeTargets.has(i));
  if (filteredServers.length) {
    ns.tprint("dispatching ", filteredServers.join(" "));
  }

  for (let server of filteredServers) {
    ns.run("dispatch.js", 1, server);
    await ns.sleep(100); // small delay to avoid race conditions
  }
}
