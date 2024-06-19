export type FlowNode = {
    flow: number,
    capacity: number,
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
    flow: number,
    mark: "+" | "-"
}

export function getMaximumFlowData(graph: FlowNode[][], source: number, sink: number): MaximumFlowData {
    let avancedPath = findAdvancedPath(graph, source, sink)
    while (avancedPath != undefined) {

    }
}

function findAdvancedPath(graph: FlowNode[][], source: number, sink: number): AdvancedPathArc[] | undefined {
    const result: AdvancedPathArc[] = []
    for (const row of graph) {
        const gap = row[source].capacity - row[source].flow
        if (!isNaN(row[source].capacity) && gap > 0)  {

        }
    }
}
