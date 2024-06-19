export type FlowNode = {
    flow: number,
    capacity: number,
    visited: boolean,
}

export type MaximumFlowData = {
    graph: FlowNode[][],
    source: number,
    sink: number,
    maxFlow: number,
}

type AdvancedPathArc = {
    from: number,
    to: number,
    gap: number,
    mark: "+" | "-"
}

export function getMaximumFlowData(graph: FlowNode[][], source: number, sink: number): MaximumFlowData {
    const graphCopy = copyGraph(graph)
    let advancedPath = findAdvancedPath(graphCopy, source, sink, [])
    while (advancedPath != undefined) {
        let minFlow = Infinity
        for (const arc of advancedPath) {
            minFlow = Math.min(minFlow, arc.gap)
        }
        for (const arc of advancedPath) {
            if (arc.mark === "+") {
                graphCopy[arc.from][arc.to].flow += minFlow
            } else {
                graphCopy[arc.to][arc.from].flow -= minFlow
            }
        }
        advancedPath = findAdvancedPath(graphCopy, source, sink, [])
    }
    return {graph: graphCopy, source: source, sink: sink, maxFlow: graphCopy[source].reduce((acc, node) => acc + (isNaN(node.flow) ? 0 : node.flow), 0)}
}

function findAdvancedPath(graph: FlowNode[][], current: number, sink: number, path: AdvancedPathArc[]): AdvancedPathArc[] | undefined {
    if (current === sink) {
        return path
    }
    const currentRow = graph[current]
    for (let i = 0; i < currentRow.length; i++) {
        const gap = currentRow[i].capacity - currentRow[i].flow
        if (i != current && !isNaN(currentRow[i].capacity) && gap > 0 && !currentRow[i].visited) {
            path.push({ from: current, to: i, gap: gap, mark: "+" })
            currentRow[i].visited = true
            const result = findAdvancedPath(graph, i, sink, path)
            currentRow[i].visited = false
            if (result != undefined) {
                return result
            }
            path.pop()
        }
    }
    for (let i = 0; i < graph.length; i++) {
        if (i != current && !isNaN(graph[i][current].capacity) && graph[i][current].flow > 0 && !graph[i][current].visited) {
            path.push({from: i, to: current, gap: graph[i][current].flow, mark: "-"})
            graph[i][current].visited = true
            const result = findAdvancedPath(graph, i, sink, path)
            currentRow[i].visited = false
            if (result != undefined) {
                return result
            }
            path.pop()
        }
    }
    return undefined
}

function copyGraph(graph: FlowNode[][]): FlowNode[][] {
    const newGraph = []
    for (let i = 0; i < graph.length; i++) {
        newGraph.push([] as FlowNode[])
        for (let j = 0; j < graph[i].length; j++) {
            newGraph[i].push({flow: graph[i][j].flow, capacity: graph[i][j].capacity, visited: false})
        }
    }
    return newGraph
}