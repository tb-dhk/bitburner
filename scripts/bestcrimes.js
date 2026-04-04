import { printTable } from "./common.js";

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

/** @param {NS} ns */
export async function main(ns) {
  function crimeMoneyPerSecond(crime) {
    const stats = ns.singularity.getCrimeStats(crime);
    return (
      ((ns.singularity.getCrimeChance(crime) * stats.money) / stats.time) * 1000
    );
  }
  const sortedCrimes = crimes.sort(
    (a, b) => crimeMoneyPerSecond(b) - crimeMoneyPerSecond(a),
  );
  printTable(ns, [
    ["crime", "money per second", "time"],
    ...sortedCrimes.map((i) => [
      i,
      crimeMoneyPerSecond(i).toExponential(3),
      (ns.singularity.getCrimeStats(i).time / 1000).toString(),
    ]),
  ]);
}
