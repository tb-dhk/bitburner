import { allServers } from './allservers'

async function dispatchProgram(ns, program, threads, ...args) {
  let count = 0
  const scriptRAM = ns.getScriptRam(program)
  ns.tprint(`dispatching ${program}, aiming for ${threads} threads`)

  // iterate through all servers
  for (let server of allServers(ns).slice(1)) {
    // find how many threads the program can push
    const RAMLeft = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
    const serverThreads = Math.min(Math.floor(RAMLeft / scriptRAM), threads - count)

    // push as many as possible (while under total thread limit)
    if (serverThreads) {
      ns.exec(program, server, serverThreads, ...args)
    }
    count += serverThreads
    if (count >= threads) {
      break
    }
  }
  ns.tprint(`dispatched ${program} with ${count} threads`)
}

async function findMaxThreads(ns, RAMLeft, target) {
  // works similar to batch.js version
  // solely based on ram left
  // only for hack and weaken
  const hackRAM = ns.getScriptRam("hack.js")
  const weakenRAM = ns.getScriptRam("weaken.js")

  const server = ns.getServer(target)
  const player = ns.getPlayer()
  const formulas = ns.fileExists("Formulas.exe", "home")

  let loss = 0.000
  let multiplier = 1 / (1 - loss)

  let hackThreads = 0
  let hackSecurity = 0
  let weakenThreads = 0

  const weakenPerThread = ns.weakenAnalyze(1);

  if (RAMLeft < hackRAM + weakenRAM) {
    return [0, 0]
  }

  let perHack = 0

  let found = false

  if (formulas) {
    perHack = Math.max(ns.formulas.hacking.hackPercent(server, player), 0.01)
  }
  
  while (true) {
    if (formulas) {
      hackThreads = Math.floor(loss / perHack) 
    } else {
      hackThreads = Math.floor(ns.hackAnalyzeThreads(target, server.moneyAvailable * multiplier))
    }    
    
    hackSecurity = ns.hackAnalyzeSecurity(hackThreads, target)
    weakenThreads = Math.ceil(hackSecurity / weakenPerThread)

    const totalRAM = hackRAM * hackThreads + weakenRAM * weakenThreads

    if (found || loss < 0) {
      ns.tprint(loss, " ", multiplier)
      return [hackThreads, weakenThreads].map(i => Math.floor(i))
    }

    if (totalRAM > RAMLeft || loss > 1) {
      loss -= 0.01
      multiplier = 1 / (1 - loss)
      found = true
    } else {
      loss += 0.01
      multiplier = 1 / (1 - loss)
    }
    if (loss < 0 || multiplier < 1) {
      return [hackThreads, weakenThreads].map(i => Math.floor(i))
    }

    await ns.sleep(20)
  }
}

export async function main(ns) {
  const target = ns.args[0]

  const server = ns.getServer(target)
  const player = ns.getPlayer()

  const delayBetween = 200; // ms gap between finishes

  let hackTime = ns.getHackTime(target);
  let growTime = ns.getGrowTime(target);
  let weakenTime = ns.getWeakenTime(target);

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

  const weakenPerThread = ns.weakenAnalyze(1);

  // while true
  while (true) {
    // find number of threads needed to grow
    const growThreads = Math.ceil(ns.formulas.hacking.growThreads(server, player, ns.getServerMaxMoney(target)))
    ns.tprint("required threads to grow back to max: ", growThreads)

    // find number of threads needed to combat security increase
    const growSecurity = ns.growthAnalyzeSecurity(growThreads, target)
    const weaken1Threads = Math.floor(growSecurity / weakenPerThread)

    // within this, try to balance remaining RAM
    // between hack and weaken
    let RAMLeft = 0
    for (let server of allServers(ns).slice(1)) {
      RAMLeft += ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
    }
    const [hackThreads, weaken2Threads] = await findMaxThreads(ns, RAMLeft, target)

    // dispatch
    ns.tprint(`[${new Date().toISOString()}] `, `threads: ${[growThreads, weaken1Threads, hackThreads, weaken2Threads]}`)
    dispatchProgram(ns, 'grow.js', growThreads, target, Math.max(0, growDelay));
    dispatchProgram(ns, 'weaken.js', weaken1Threads, target, Math.max(0, weaken2Delay));
    dispatchProgram(ns, 'hack.js', hackThreads, target, Math.max(0, hackDelay));
    dispatchProgram(ns, 'weaken.js', weaken2Threads, target, Math.max(0, weaken1Delay));
    ns.tprint("sleeping ", (weakenTime + delayBetween * 3 + 2000) / 1000, "s") 
    await ns.sleep(weakenTime + delayBetween * 3 + 2000)
  }
}
