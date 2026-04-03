/** @param {NS} ns */
export async function main(ns) {
  const homeFiles = ns.ls("home");
  const jsFiles = homeFiles.filter(f => f.endsWith(".js"));

  if (jsFiles.length === 0) {
      ns.tprint("no .js files found on home server.");
  } else {
      ns.tprint(`found ${jsFiles.length} .js files. downloading...`);
      for (const file of jsFiles) {
          ns.download(file);
          ns.tprint(`downloaded: ${file}`);
      }
      ns.tprint("all done.");
  }
}