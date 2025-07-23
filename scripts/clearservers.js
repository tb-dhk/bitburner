export async function main(ns) {
  for (let server of ns.getPurchasedServers()) {
    ns.deleteServer(server)
  }
}
