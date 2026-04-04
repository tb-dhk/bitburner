export default function findServer(
  ns,
  target,
  current = "home",
  visited = new Set(),
  path = [],
) {
  visited.add(current);
  path.push(current);

  if (current === target) return path;

  const neighbors = ns.scan(current);
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const result = findServer(ns, target, neighbor, visited, [...path]);
      if (result.length) return result;
    }
  }

  return []; // target not found
}

export async function main(ns) {
  const list = findServer(ns, ns.args[0]);
  ns.tprint(list);
  navigator.clipboard.writeText(list.map((i) => `connect ${i}`).join("; "));
  ns.tprint("copied to clipboard.");
}
