// Early Game Factions
const earlyGameFactions = [
  // "CyberSec", repeated later
  "Tian Di Hui",
  "Netburners",
  // "Shadows of Anarchy", irrelevant
];

// City Factions (mutually exclusive)
const cityFactions = [
  "Sector-12",
  "Chongqing",
  "New Tokyo",
  "Ishima",
  "Aevum",
  "Volhaven",
];

// Hacking Groups (progression)
const hackingGroups = [
  "CyberSec", // Already in early game, but listed here too
  "NiteSec",
  "The Black Hand",
  "BitRunners",
];

// Megacorporations
const megacorpFactions = [
  "ECorp",
  "MegaCorp",
  "KuaiGong International",
  "Four Sigma",
  "NWO",
  "Blade Industries",
  "OmniTek Incorporated",
  "Bachman & Associates",
  "Clarke Incorporated",
  "Fulcrum Secret Technologies",
];

// Criminal Organizations
const criminalFactions = [
  "Slum Snakes",
  "Tetrads",
  "Silhouette",
  "Speakers for the Dead",
  "The Dark Army",
  "The Syndicate",
];

// Lategame Factions
const lategameFactions = ["The Covenant", "Illuminati", "Daedalus"];

// Endgame Factions (BitNode specific)
const endgameFactions = ["Bladeburners", "Church of the Machine God"];

// Complete list (excluding duplicates like CyberSec appearing twice)
const allFactions = [
  ...earlyGameFactions,
  ...cityFactions,
  ...hackingGroups.filter((f) => f !== "CyberSec"), // Remove duplicate
  ...megacorpFactions,
  ...criminalFactions,
  ...lategameFactions,
  ...endgameFactions,
];

/** @param {NS} ns */
export async function main(ns) {
  // matrix starts with one column for faction names
  const matrix = [["name"]];
  const dictionary = {};
  for (let faction of allFactions) {
    const augs = ns.singularity.getAugmentationsFromFaction(faction);

    // push the row with info for the augs already in the matrix
    matrix.push([
      faction,
      ...matrix[0].slice(1).map((i) => Number(augs.includes(i))),
    ]);
    // add on new columns for new augs
    const remainder = augs.filter((i) => !matrix[0].includes(i));
    matrix.forEach((_, row) => {
      if (row === 0) {
        matrix[row] = [...matrix[row], ...remainder]; // add on new column headers
      } else {
        matrix[row] = [
          ...matrix[row],
          ...Array(remainder.length).fill(Number(row === matrix.length - 1)),
        ];
        // new columns should have zeroes except for the last row which should have ones
      }
    });

    // add to dictionary as well
    augs.forEach((aug) => {
      if (aug in dictionary) {
        dictionary[aug].push(faction);
      } else {
        dictionary[aug] = [faction];
      }
    });
  }

  const remainingAugs = matrix[0].slice(1);
  const factions = [];
  const uniqueRemoved = remainingAugs.filter((aug) => {
    if (dictionary[aug].length === 1) {
      const faction = dictionary[aug][0];
      if (!factions.includes(faction)) {
        factions.push(faction);
      }
      return false;
    }
    return true;
  });
  ns.tprint(factions);
  const removedRemainder = uniqueRemoved.filter((aug) => {
    return !dictionary[aug].some((i) => factions.includes(i));
  });

  ns.tprint(factions);
  ns.tprint(removedRemainder);
}
