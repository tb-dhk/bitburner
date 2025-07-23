export function findServer(ns, target, current = "home", visited = new Set(), path = []) {
  visited.add(current);
  path.push(current);

  if (current === target) return path;

  const neighbors = ns.scan(current);
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const result = findServer(ns, target, neighbor, visited, [...path]);
      if (result) return result;
    }
  }

  return null; // target not found
}

export async function main(ns) {
  const list = findServer(ns, ns.args[0])
  ns.tprint(list)
  ns.tprint(list.map(i => `connect ${i}`).join("; "))
}