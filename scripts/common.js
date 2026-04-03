// export file for common utilities shared by index.js and sleeves.js
export const businessPositions = [
  "Business Intern",
  "Business Analyst",
  "Business Manager",
  "Operations Manager"
]
export const softwarePositions = [
  "Software Engineering Intern",
  "Junior Software Engineer",
  "Senior Software Engineer",
  "Lead Software Developer",
  "Head of Software",
  "Head of Engineering",
  "Vice President of Technology"
]

export function gym(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"]
  const skills = ns.getPlayer().skills
  const level = physical.sort((a, b) => skills[a] - skills[b])[0]
  return level.slice(0, 3)
}

export function maxCombat(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"]
  const skills = ns.getPlayer().skills
  return Math.max(...physical.map(i => skills[i]))
}

export function minCombat(ns) {
  const physical = ["strength", "defense", "dexterity", "agility"]
  const skills = ns.getPlayer().skills
  return Math.min(...physical.map(i => skills[i]))
}

export function nextCompany(ns) {
  const factions = ns.getPlayer().factions

  const companies = [
    "ECorp",
    "MegaCorp", 
    "KuaiGong International",
    "Four Sigma",
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "Bachman & Associates",
    "Clarke Incorporated",
    "Fulcrum Technologies"
  ]
  
  const sortedCompanies = companies
    .sort((a, b) => ns.singularity.getCompanyFavor(a) - ns.singularity.getCompanyFavor(b))
    .sort((a, b) => ns.singularity.getCompanyRep(a) - ns.singularity.getCompanyRep(b))

  const filteredCompanies = sortedCompanies.filter(i => 
    ns.singularity.getCompanyRep(i) < 4e5 
    && !(
      factions.includes(i) 
      || (i.startsWith("Fulcrum") && factions.includes("Fulcrum Secret Technologies"))
    )
  )

  if (filteredCompanies.length > 0) {
    // if there are still companies left with locked factions, work for the companies first
    // start from the company with the lowest rep
    return filteredCompanies[0]
  } else if (!companies.map(i => toString(ns.getPlayer().jobs[i])).some(i => i.startsWith("Chief") && i.endsWith("Officer"))) {
    // if there are no companies left with locked factions, work for the company with the highest rep
    // if there are ties, look for favor
    return sortedCompanies[sortedCompanies.length - 1]
  } else {
    return ""
  }
}

export function getCompanyPosition(ns, company) {
  return ns.getPlayer().jobs[company] || ""
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
  "Heist"
]

export function crimeForMoney(ns) {
  function crimeMoneyPerSecond(crime) {
    const stats = ns.singularity.getCrimeStats(crime)
    return ns.singularity.getCrimeChance(crime) * stats.money / stats.time * 1000
  }
  return crimes.sort((a, b) => crimeMoneyPerSecond(b) - crimeMoneyPerSecond(a))[0]
}

export function printTable(ns, data) {
  const counts = data[0].map((_, col) => {
    return Math.max(...data.map(row => row[col].length))
  })
  const length = data[0].map((cell, col) => cell.padEnd(counts[col])).join("     ").length
  ns.tprint("-".repeat(length))
  for (let row of data) {
    const rowString = row.map((cell, col) => cell.padEnd(counts[col])).join("     ")
    ns.tprint(rowString)
  }
  ns.tprint("-".repeat(length))
}