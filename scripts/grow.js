/** @param {NS} ns **/
export async function main(ns) {
  const delay = ns.args[1] || 0;
  if (delay) {
    ns.print(`[${new Date().toISOString()}] `, "grow script called, waiting for ", delay, " ms")
    await ns.sleep(delay)
  }  
  ns.print(`[${new Date().toISOString()}] `, "begin grow")
  const target = ns.args[0];
  await ns.grow(target);
  ns.print(`[${new Date().toISOString()}] `, "finish grow")
}