/** @param {NS} ns */
export async function main(ns) {
  const start = Date.now()
  while (Date.now() < start + 9000) {
    await ns.grow("joesguns")
  }
}