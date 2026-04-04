import { allServers } from "./allservers";

function dispatchProgram(ns, program, threads, ...args) {
  let count = 0;
  const scriptRAM = ns.getScriptRam(program);

  // iterate through all servers
  const servers = allServers(ns)
    .slice(1)
    .filter((i) => ns.hasRootAccess(i));
  for (let server of servers) {
    // find how many threads the program can push
    const factor = server === "home" ? 0.1 : 1;
    const ramLeft =
      (ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) * factor;
    const serverThreads = Math.min(
      Math.floor(ramLeft / scriptRAM),
      threads - count,
    );

    ns.scp(program, server);

    // push as many as possible (while under total thread limit)
    if (serverThreads) {
      ns.exec(program, server, serverThreads, ...args);
      count += serverThreads;
    }
    if (count >= threads) {
      break;
    }
  }
  return count;
}

async function findMaxThreads(ns, ramLeft, target) {
  // solely based on ram left
  // only for hack and weaken
  const hackRAM = ns.getScriptRam("hack.js");
  const weakenRAM = ns.getScriptRam("weaken.js");

  const server = ns.getServer(target);
  const player = ns.getPlayer();
  const formulas = ns.fileExists("Formulas.exe", "home");

  let loss = 0.0;
  let multiplier = 1 / (1 - loss);

  let hackThreads = 0;
  let weakenThreads = 0;

  if (ramLeft < hackRAM + weakenRAM) {
    return [0, 0];
  }

  let perHack = 0;

  let found = false;

  if (formulas) {
    perHack = Math.max(ns.formulas.hacking.hackPercent(server, player), 0.001);
  }

  while (true) {
    if (loss < 0 || multiplier < 1) {
      return 0;
    }

    if (formulas) {
      hackThreads = Math.floor(loss / perHack);
    } else {
      hackThreads = Math.floor(
        ns.hackAnalyzeThreads(
          target,
          Math.min(
            server.moneyAvailable * Math.min(1, multiplier),
            ns.getServerMaxMoney(target),
          ),
        ),
      );
    }

    const totalRAM = hackRAM * hackThreads + weakenRAM * weakenThreads;

    if (found || loss < 0 || loss === 1) {
      return Math.max(Math.floor(hackThreads), 0);
    }

    if (totalRAM > ramLeft) {
      loss = Math.max(0, loss - 0.01);
      multiplier = Math.min(1 / (1 - loss), server.moneyMax);
      found = true;
    } else {
      loss = Math.min(1, loss + 0.01);
      multiplier = Math.min(1 / (1 - loss), server.moneyMax);
    }
    await ns.sleep(1);
  }
}

/** @param {NS} ns */
export async function main(ns) {
  ns.ramOverride(10);

  const target = ns.args[0];

  let server = ns.getServer(target);
  const player = ns.getPlayer();

  const delayBetween = 200; // ms gap between finishes

  let hackTime = ns.getHackTime(target);
  let growTime = ns.getGrowTime(target);
  let weakenTime = ns.getWeakenTime(target);

  const formulas = ns.fileExists("Formulas.exe", "home");

  const weaken1Delay = 0;
  const growDelay = weakenTime - growTime + delayBetween;
  const weaken2Delay = delayBetween * 2;
  const hackDelay = weakenTime + delayBetween * 3 - hackTime;

  const weakenPerThread = ns.weakenAnalyze(1);

  // while true
  while (true) {
    if (formulas) {
      hackTime = ns.formulas.hacking.hackTime(server, player);
      growTime = ns.formulas.hacking.growTime(server, player);
      weakenTime = ns.formulas.hacking.weakenTime(server, player);
    }

    // find number of threads needed to grow
    server = ns.getServer(target);
    let growThreads = Math.ceil(
      ns.growthAnalyze(
        target,
        ns.getServerMaxMoney(target) / Math.max(server.moneyAvailable, 1),
      ),
    );
    if (formulas) {
      growThreads = Math.ceil(
        ns.formulas.hacking.growThreads(
          server,
          player,
          ns.getServerMaxMoney(target),
        ),
      );
    }

    // find number of threads needed to combat security increase
    const weaken1Threads = Math.ceil(
      (ns.getServerSecurityLevel(target) -
        ns.getServerMinSecurityLevel(target)) /
        weakenPerThread,
    );
    const weaken2Threads = Math.ceil(
      ns.growthAnalyzeSecurity(growThreads, target) / weakenPerThread,
    );

    // within this, try to balance remaining RAM
    // between hack and weaken
    let ramLeft = 0;
    for (let server of allServers(ns).slice(1)) {
      ramLeft += ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    }
    const hackThreads = await findMaxThreads(ns, ramLeft, target);

    // dispatch
    const realThreads = [
      dispatchProgram(
        ns,
        "weaken.js",
        weaken1Threads,
        target,
        Math.max(0, weaken1Delay),
      ),
      dispatchProgram(
        ns,
        "grow.js",
        growThreads,
        target,
        Math.max(0, growDelay),
      ),
      dispatchProgram(
        ns,
        "weaken.js",
        weaken2Threads,
        target,
        Math.max(0, weaken2Delay),
      ),
      dispatchProgram(
        ns,
        "hack.js",
        hackThreads,
        target,
        Math.max(0, hackDelay),
      ),
    ];

    const totalThreads = realThreads.reduce((a, b) => a + b, 0);
    const milliseconds = totalThreads
      ? weakenTime + delayBetween * 3 + 2000
      : 10000;

    await ns.sleep(milliseconds);
  }
}
