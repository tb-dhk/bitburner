async function findMaxThreads(ns, target, serverRAMLeft) {
  const growRAM = ns.getScriptRam("grow.js")
  const hackRAM = ns.getScriptRam("hack.js")
  const weakenRAM = ns.getScriptRam("weaken.js")

  let loss = 0.000
  let multiplier = 1 / (1 - loss)

  let growThreads = 0
  let hackThreads = 0
  let growSecurity = 0
  let hackSecurity = 0
  let weakenThreads = [0, 0]
  
  let found = false

  const server = ns.getServer(target)
  const player = ns.getPlayer()

  const formulas = ns.fileExists("Formulas.exe", "home")

  const weakenPerThread = ns.weakenAnalyze(1);
  
  if (serverRAMLeft < growRAM + weakenRAM * 2 + hackRAM) {
    ns.print("not enough RAM for even minimum threads")
    return [1, 1, 1, 1] // or [0,0,0,0] if you're okay with skipping
  }

  let perHack = 0

  if (formulas) {
    perHack = ns.formulas.hacking.hackPercent(server, player)
  }
  
  while (true) {
    if (formulas) {
      hackThreads = Math.floor(loss / perHack)
      const growPercent = ns.formulas.hacking.growPercent(server, 1, player)
      growThreads = Math.log(multiplier) / Math.log(1+growPercent)
    } else {
      hackThreads = Math.floor(ns.hackAnalyzeThreads(target, server.moneyAvailable * multiplier))
      growThreads = Math.floor(ns.growthAnalyze(target, multiplier))
    }    
    
    growSecurity = ns.growthAnalyzeSecurity(growThreads, target)
    hackSecurity = ns.hackAnalyzeSecurity(hackThreads, target)
    weakenThreads = [growSecurity / weakenPerThread, hackSecurity / weakenPerThread].map(i => Math.max(Math.ceil(i), 1))

    const totalRAM = growRAM * growThreads + hackRAM * hackThreads + weakenRAM * (weakenThreads[0] + weakenThreads[1])

    if (found || loss < 0) {
      ns.tprint(ns.getHostname(), " ", loss, " ", multiplier)
      ns.tprint(ns.getHostname(), " ", `(${growRAM} * ${growThreads} + ${hackRAM} * ${hackThreads} + ${weakenRAM} * (${weakenThreads[0]} + ${weakenThreads[1]})) = ${totalRAM} vs ${serverRAMLeft}`)
      return [weakenThreads[0], growThreads, weakenThreads[1], hackThreads].map(i => Math.max(Math.floor(i), 1))
    }

    if ((totalRAM) > serverRAMLeft) {
      loss -= 0.001
      multiplier = 1 / (1 - loss)
      found = true
    } else {
      loss += 0.001
      multiplier = 1 / (1 - loss)
    }
    if (loss < 0 || multiplier < 1) {
      return [weakenThreads[0], growThreads, weakenThreads[1], hackThreads].map(i => Math.max(Math.floor(i), 1))
    }

    await ns.sleep(20)
  }
}

/** @param {NS} ns **/
export async function main(ns) {
  const target = ns.args[0]

  const delayBetween = 200; // ms gap between finishes

  let hackTime = ns.getHackTime(target);
  let growTime = ns.getGrowTime(target);
  let weakenTime = ns.getWeakenTime(target);

  const server = ns.getServer(target)
  const player = ns.getPlayer()

  const formulas = ns.fileExists("Formulas.exe", "home")
  if (formulas) {
    hackTime = ns.formulas.hacking.hackTime(server, player)
    growTime = ns.formulas.hacking.growTime(server, player)
    weakenTime = ns.formulas.hacking.weakenTime(server, player)
  }

  const weaken1Delay = 0;
  const growDelay = weakenTime - growTime + delayBetween;
  const weaken2Delay = delayBetween * 2;
  const hackDelay = weakenTime + delayBetween * 3 - hackTime;

  const thisServer = ns.getServer().hostname
  const serverRAMLeft = (await ns.getServerMaxRam(thisServer)) - (await ns.getServerUsedRam(thisServer))

  const threads = await findMaxThreads(ns, target, serverRAMLeft)  

  ns.print(`[${new Date().toISOString()}] `, `scheduling batch on ${target}:`);
  ns.print(`[${new Date().toISOString()}] `, `weaken1 delay: ${weaken1Delay.toFixed(0)} ms`);
  ns.print(`[${new Date().toISOString()}] `, `grow delay: ${growDelay.toFixed(0)} ms`);
  ns.print(`[${new Date().toISOString()}] `, `weaken2 delay: ${weaken2Delay.toFixed(0)} ms`);
  ns.print(`[${new Date().toISOString()}] `, `hack delay: ${hackDelay.toFixed(0)} ms`);
  ns.print(`[${new Date().toISOString()}] `, `threads: ${threads}`)
  ns.print(`[${new Date().toISOString()}] `, `RAM left: ${serverRAMLeft}`)

  while (true) {
    ns.print(`[${new Date().toISOString()}] `, `threads: ${threads}`)
    const empty = ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) * 0.95
    const secure = ns.getServerMinSecurityLevel(target) >= ns.getServerBaseSecurityLevel(target) + 1
    const priming = empty || secure

    // spawn workers with the delays
    if (!priming) {
      ns.run('weaken.js', threads[2], target, Math.max(0, weaken2Delay));
      ns.run('hack.js', threads[3], target, Math.max(0, hackDelay));
    }
    ns.run('weaken.js', threads[0], target, Math.max(0, weaken1Delay));
    ns.run('grow.js', threads[1], target, Math.max(0, growDelay));
    await ns.sleep(weakenTime + delayBetween * 3 + 2000)
  }
}
