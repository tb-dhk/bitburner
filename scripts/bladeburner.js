import { cities } from "./common"

function currentAction(ns, sleeveNo) {
  // get current task
  let current = ns.bladeburner.getCurrentAction();
  const task = ns.sleeve.getTask(sleeveNo)
  if (task) {
    current = {
      type: task.actionType,
      name: task.actionName
    }
  } else {
    current = {}
  }
  return current
}

export function getAction(ns) {
  const contracts = ns.bladeburner.getContractNames();
  const operations = ns.bladeburner.getOperationNames();

  const current = ns.bladeburner.getCurrentAction()

  if (!ns.bladeburner.inBladeburner()) {
    return [] 
  }

  // recruit if possible
  const recruitmentViable =
    ns.bladeburner.getActionEstimatedSuccessChance(
      "General",
      "Recruitment"
    )[0] === 1;
  let generalAction = recruitmentViable ? "Recruitment" : "Training";
  let action = ["General", generalAction];

  let chance = [0, 0];

  // check contracts
  const ls = [0, 2, 1];
  for (let i = 0; i < 3; i++) {
    const nchance = ns.bladeburner.getActionEstimatedSuccessChance(
      "Contracts",
      contracts[ls[i]]
    );
    const contractName = contracts[ls[i]]
    if (
      nchance[1] === 1 &&
      ns.bladeburner.getActionCountRemaining("Contracts", contracts[ls[i]]) > 0
    ) {
      action = ["Contracts", contractName];
      chance = nchance;
    }
  }

  // check operations
  for (let i = 0; i < 2; i++) {
    ns.bladeburner.setTeamSize(
      "Operations",
      operations[i],
      ns.bladeburner.getTeamSize(),
    );
    const nchance = ns.bladeburner.getActionEstimatedSuccessChance(
      "Operations",
      operations[i]
    );
    const operationName = operations[ls[i]]
    if (
      nchance[1] === 1 &&
      ns.bladeburner.getActionCountRemaining("Operations", operations[i]) > 0
    ) {
      action = ["Operations", operations[i]];
      chance = nchance;
    }
  }

  // check blackops
  const nextBlackOp = ns.bladeburner.getNextBlackOp();
  if (nextBlackOp) {
    ns.bladeburner.setTeamSize(
      "Black Operations",
      nextBlackOp.name,
      ns.bladeburner.getTeamSize(),
    );
    const nchance = ns.bladeburner.getActionEstimatedSuccessChance(
      "Black Operations",
      nextBlackOp.name
    );
    if (
      nextBlackOp.rank <= ns.bladeburner.getRank() && 
      nchance[1] >= 0.75
    ) {
      action = ["Black Operations", nextBlackOp.name];
      chance = nchance;
    }
  }

  // field analysis to reconcile top chance
  if (chance[0] !== chance[1]) {
    action = ["General", "Field Analysis"];
  }

  // diplomacy to fix chaos
  const city = ns.bladeburner.getCity();
  const chaos = ns.bladeburner.getCityChaos(city);
  if (chaos >= 50) {
    const bestCity = cities.sort(
      (a, b) => ns.bladeburner.getCityChaos(a) - ns.bladeburner.getCityChaos(b)
    )[0]
    ns.bladeburner.switchCity(bestCity)
  } else if (chaos >= 40) {
    action = ["General", "Diplomacy"]
  }

  const stamina = ns.bladeburner.getStamina();
  if (stamina[0] < stamina[1] / 2 || (current && current[1] == "Hyperbolic Regeneration Chamber" && stamina[0] < stamina[1])) {
    action = ["General", "Hyperbolic Regeneration Chamber"];
  }
  
  return action
}