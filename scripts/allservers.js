export function allServers(ns, parent="home", list=["home"]) {
  const directChildren = ns.scan(parent).filter(i => !list.includes(i))
  list = list.concat(directChildren)
  directChildren.forEach(child => {
    list = allServers(ns, child, list)
  })
  return list
}