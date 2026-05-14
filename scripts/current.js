/** @param {NS} ns */
export async function main(ns) {
  ns.tprintf("you: " + ns.singularity.getCurrentWork());
  const sleeves = ns.sleeve.getNumSleeves();
  for (let i = 0; i < sleeves; i++) {
    ns.tprintf("sleeve " + i + ": " + ns.sleeve.getTask(i));
  }
}
