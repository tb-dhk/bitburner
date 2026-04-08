/** @param {NS} ns */
export async function main(ns) {
  const start = Date.now();
  await ns.grow("joesguns");
}
