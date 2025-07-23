// status.js
/** @param {NS} ns **/
export async function main(ns) {
	const targets = ns.args;
	if (!targets.length) {
		ns.tprint("Usage: run status.js [server]");
		return;
	}

  while (true) {
    for (const target of targets) {
      const money = ns.getServerMoneyAvailable(target);
      const maxMoney = ns.getServerMaxMoney(target);
      const sec = ns.getServerSecurityLevel(target);
      const minSec = ns.getServerMinSecurityLevel(target);

      const moneyPct = ((money / maxMoney) * 100).toFixed(2);
      const secOver = (sec - minSec).toFixed(2);

      ns.tprint(`[${target}]`);
      ns.tprint(`  money: \$${money} / \$${maxMoney} (${moneyPct}%)`);
      ns.tprint(`  security: ${sec} (min: ${minSec}, +${secOver})`);
    }
    ns.tprint("")
    await ns.sleep(10000)
  }
}
