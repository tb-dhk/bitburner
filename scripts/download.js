/** @param {NS} ns */
export async function main(ns) {
  const files = ns.ls().filter((i) => i.endsWith(".js"));
  const path =
    "https://raw.githubusercontent.com/tb-dhk/bitburner/refs/heads/main/scripts/";

  for (let file of files) {
    ns.wget(path + file, file);
  }
}