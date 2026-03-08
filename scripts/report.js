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

      ns.tprint(`[${target}]: \$${money.toExponential()} / \$${maxMoney.toExponential()} (${moneyPct}%); ${Math.round(sec * 100) / 100} security (min: ${minSec}, +${secOver})`);
    }
    await ns.sleep(60000)
  }
}
