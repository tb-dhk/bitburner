// export file for common utilities shared by index.js and sleeves.js
export const businessPositions = [
  "Business Intern",
  "Business Analyst",
  "Business Manager",
  "Operations Manager",
];
export const softwarePositions = [
  "Software Engineering Intern",
  "Junior Software Engineer",
  "Senior Software Engineer",
  "Lead Software Developer",
  "Head of Software",
  "Head of Engineering",
  "Vice President of Technology",
];

export const cityGroups = [
  ["Sector-12", "Aevum"],
  ["Chongqing", "Ishima", "New Tokyo"],
  ["Volhaven"],
];

export const cities = cityGroups.flat()

export const bladeburnerLimits = {
  Cloak: 25,
  "Short Circuit": 25,
  Tracer: 10,
  Datamancer: 0,
  "Cybers Edge": 0,
  "Hands Of Midas": 0,
  Hyperdrive: 20,
};

export function gym(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"];
  const skills = ns.getPlayer().skills;
  const level = physical.sort((a, b) => skills[a] - skills[b])[0];
  return level.slice(0, 3);
}

export function gymSleeve(ns, sleeve) {
  const physical = ["strength", "defense", "dexterity", "agility"];
  const skills = ns.sleeve.getSleeve(sleeve).skills;
  const level = physical.sort((a, b) => skills[a] - skills[b])[0];
  return level.slice(0, 3);
}

export function maxCombat(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"];
  const skills = ns.getPlayer().skills;
  return Math.max(...physical.map((i) => skills[i]));
}

export function minCombat(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"];
  const skills = ns.getPlayer().skills;
  return Math.min(...physical.map((i) => skills[i]));
}

export function nextCompanies(ns) {
  const factions = ns.getPlayer().factions;

  const companies = [
    "ECorp",
    "MegaCorp",
    "KuaiGong International",
    // four sigma excluded because its faction does not offer any unique augmentations
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "Bachman & Associates",
    "Clarke Incorporated",
    "Fulcrum Technologies",
  ];

  const sortedCompanies = companies
    .sort((a, b) => {
      const repDiff = ns.singularity.getCompanyRep(a) - ns.singularity.getCompanyRep(b);
      if (repDiff !== 0) return repDiff;
      return ns.singularity.getCompanyFavor(a) - ns.singularity.getCompanyFavor(b);
    })
  
  const filteredCompanies = sortedCompanies.filter(
    (i) =>
      ns.singularity.getCompanyRep(i) < 4e5 &&
      !(
        factions.includes(i) ||
        (i.startsWith("Fulcrum") &&
          factions.includes("Fulcrum Secret Technologies"))
      ),
  );

  if (filteredCompanies.length > 0) {
    // if there are still companies left with locked factions, work for the companies first
    // start from the company with the lowest rep
    return filteredCompanies;
  } else if (!ns.singularity.getOwnedAugmentations(true).includes("TITN-41 Gene-Modification Injection")) {
    // if there are no companies left with locked factions, work for the company with the highest rep
    // if there are ties, look for favor
    return [sortedCompanies[sortedCompanies.length - 1]];
  }
  return []
}

export function getCompanyPosition(ns, company) {
  return ns.getPlayer().jobs[company] || "";
}

const crimes = [
  "Shoplift",
  "Rob Store",
  "Mug",
  "Larceny",
  "Deal Drugs",
  "Bond Forgery",
  "Traffick Arms",
  "Homicide",
  "Grand Theft Auto",
  "Kidnap",
  "Assassination",
  "Heist",
];

export function crimeForMoney(ns) {
  function crimeMoneyPerSecond(crime) {
    const stats = ns.singularity.getCrimeStats(crime);
    return (
      ((ns.singularity.getCrimeChance(crime) * stats.money) / stats.time) * 1000
    );
  }
  return crimes.sort(
    (a, b) => crimeMoneyPerSecond(b) - crimeMoneyPerSecond(a),
  )[0];
}

export function printTable(ns, data, silent) {
  let string = "\n"
  const counts = data[0].map((_, col) => {
    return Math.max(...data.map((row) => row[col].length));
  });
  const length = data[0]
    .map((cell, col) => String(cell).padEnd(counts[col]))
    .join("   ").length;
  string += "-".repeat(length) + "\n"
  for (let row of data) {
    const rowString = row
      .map((cell, col) => String(cell).padEnd(counts[col]))
      .join("   ");
    string += rowString + "\n"
  }
  string += "-".repeat(length) + "\n"
  if (silent) {
    return string
  }
  ns.tprint(string)
}

export function study(ns) {
  const skills = ns.getPlayer().skills;
  return skills.charisma < skills.hacking ? "Leadership" : "Algorithms";
}