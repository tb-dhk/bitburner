export async function main(ns) {
  const locations = ns.infiltration.getPossibleLocations();
  const list = [];
  const header = [
    "city",
    "name",
    "difficulty",
    "maxClearanceLevel",
    "startingSecurityLevel",
    "SoARep",
    "score",
  ];
  const num = Number(ns.args[0]) || 6;
  ns.tprintf(header.join(" "));
  for (let location of locations) {
    const infiltrations = ns.infiltration.getInfiltration(location.name);
    if (infiltrations.difficulty < 3) {
      list.push([
        infiltrations.location.city,
        infiltrations.location.name,
        (infiltrations.difficulty / 3) * 100,
        infiltrations.maxClearanceLevel,
        infiltrations.startingSecurityLevel,
        infiltrations.reward.SoARep,
        infiltrations.reward.SoARep ** 2 /
          infiltrations.maxClearanceLevel /
          infiltrations.startingSecurityLevel,
      ]);
    }
  }
  list.sort((a, b) => b[num] - a[num]);
  for (let row of list) {
    ns.tprintf(row.join(" "));
  }
  navigator.clipboard.writeText(
    [header, ...list].map((row) => row.join(", ")).join("\n"),
  );
}
