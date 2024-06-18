export function solveColoration(graph: number[][]): number[][] {
  const degreeMap = new Map<number, number>()
  for (let i = 0; i < graph.length; i++) {
    let degree = 0
    for (let j = 0; j < graph[i].length; j++) {
      degree += graph[i][j]
    }
    degreeMap.set(i, degree-1)
  }
  let sortedNodes = Array.from(degreeMap.keys()).sort((a, b) => degreeMap.get(b)! - degreeMap.get(a)!)
  const coloration: number[][] = []
  let color = 0
  while (sortedNodes.length > 0) {
    coloration.push([])
    const toRemove = []
    for (const node of sortedNodes) {
      let skipNode = false
      for (const coloredNode of coloration[color]) {
        if (graph[node][coloredNode] === 1) {
          skipNode = true
          break
        }
      }
      if (skipNode) {
        continue
      }
      coloration[color].push(node)
      toRemove.push(node)
    }
    for (const node of toRemove) {
      sortedNodes = sortedNodes.filter((n) => n !== node)
    }
    color += 1
  }
  return coloration
}
