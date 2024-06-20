export type Pi = {
    value: number
    path: number[]
    visited: boolean
}

export function getShortestPathUsingMooreDjikstra(orientedGraph: number[][], start: number): Map<number,Pi> {
    const pi = new Map<number,Pi>
    const S = [start]
    pi.set(start,({ value: 0, path: [start], visited: true}))
    const _S = []
    for (let i = 0; i < orientedGraph.length; i++) {
        if (i !== start) {
            _S.push(i)
        }
    }
    let currentPath = [start]
    while (_S.length > 0) {
        const _pi = pi.get(currentPath[currentPath.length-1])!
        let min = Infinity
        for (const _s of _S) {
            if (!isNaN(orientedGraph[currentPath[currentPath.length-1]][_s])) {
                const value = _pi.value + orientedGraph[currentPath[currentPath.length-1]][_s]
                const path = _pi.path.concat([_s])
                if (pi.has(_s)) {
                    if (value < pi.get(_s)!.value) {
                        pi.set(_s,{ value, path, visited: false })
                    }
                } else {
                    pi.set(_s,{ value, path, visited: false })
                }
                if (value < min) {
                    min = value
                }
            }
        }
        const minPi = getMinPi(pi)
        if (minPi === undefined) {
            break
        }
        pi.get(minPi)!.visited = true
        S.push(minPi)
        _S.splice(_S.indexOf(minPi),1)
        currentPath = pi.get(minPi)!.path
    }
    return pi
}

function getMinPi(pi: Map<number,Pi>): number|undefined {
    let min = Infinity
    let minVertex: number|undefined = undefined
    for (const [vertex,{ value, visited }] of pi) {
        if (value < min && !visited) {
            min = value
            minVertex = vertex
        }
    }
    return minVertex
}