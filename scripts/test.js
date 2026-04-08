import { getAction } from "./bladeburner.js"

/** @param {NS} ns */
export async function main(ns) {
  ns.tprint(getAction(ns));
}
