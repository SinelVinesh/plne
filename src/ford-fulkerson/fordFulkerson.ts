export type FlowArc = {
    flow: number,
    capacity: number,
}

export type MaximumFlowData = {
    graph: FlowArc[][],
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

export function getMaximumFlowData(graph: FlowArc[][], source: number, sink: number): MaximumFlowData {
    const graphCopy = copyGraph(graph)
    let advancedPath = findAdvancedPath(graphCopy, source, sink, [],new Array(graphCopy.length).fill(false))
    while (advancedPath != undefined) {
        let minFlow = Infinity
        for (const arc of advancedPath) {
            minFlow = Math.min(minFlow, arc.gap)
        }
        for (const arc of advancedPath) {
            if (arc.mark === "+") {
                graphCopy[arc.from][arc.to].flow += minFlow
            } else {
                graphCopy[arc.from][arc.to].flow -= minFlow
            }
        }

        advancedPath = findAdvancedPath(graphCopy, source, sink, [], new Array(graphCopy.length).fill(false))
    }
    return {graph: graphCopy, source: source, sink: sink, maxFlow: graphCopy[source].reduce((acc, node) => acc + (isNaN(node.flow) ? 0 : node.flow), 0)}
}

function findAdvancedPath(graph: FlowArc[][], current: number, sink: number, path: AdvancedPathArc[], visited: boolean[]): AdvancedPathArc[] | undefined {
    visited[current] = true
    if (current === sink) {
        return path
    }
    const currentRow = graph[current]
    for (let i = 0; i < currentRow.length; i++) {
        const gap = currentRow[i].capacity - currentRow[i].flow
        if (i != current && !isNaN(currentRow[i].capacity) && gap > 0 && !visited[i]) {
            path.push({ from: current, to: i, gap: gap, mark: "+" })
            visited[i] = true
            const result = findAdvancedPath(graph, i, sink, path, visited)
            visited[i] = false
            if (result != undefined) {
                return result
            }
            path.pop()
        }
    }
    for (let i = 0; i < graph.length; i++) {
        if (i != current && !isNaN(graph[i][current].capacity) && graph[i][current].flow > 0 && !visited[i]) {
            path.push({from: i, to: current, gap: graph[i][current].flow, mark: "-"})
            visited[i] = true
            const result = findAdvancedPath(graph, i, sink, path,visited)
            visited[i] = false
            if (result != undefined) {
                return result
            }
            path.pop()
        }
    }
    return undefined
}

function copyGraph(graph: FlowArc[][]): FlowArc[][] {
    const newGraph = []
    for (let i = 0; i < graph.length; i++) {
        newGraph.push([] as FlowArc[])
        for (let j = 0; j < graph[i].length; j++) {
            newGraph[i].push({flow: graph[i][j].flow, capacity: graph[i][j].capacity})
        }
    }
    return newGraph
}