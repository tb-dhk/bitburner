/** @param {NS} ns */
export async function main(ns) {
  ns.tprint("you: ", ns.singularity.getCurrentWork())
    const sleeves = ns.sleeve.getNumSleeves()
    for (let i = 0; i < sleeves; i++) {
      ns.tprint("sleeve ", i, ": ", ns.sleeve.getTask(i))
    }
}