import { nextCompanies } from "./common.js"

/** @param {NS} ns */
export async function main(ns) {
  ns.tprint(ns.gang.getTaskNames())
}
