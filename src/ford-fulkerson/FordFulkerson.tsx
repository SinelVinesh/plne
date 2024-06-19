import "./FordFulkerson.css"
import {useEffect, useState} from "react";
import {FlowArc, MaximumFlowData, getMaximumFlowData} from "./fordFulkerson.ts";

const defaultNodeNumber = 11

function FordFulkerson() {
  const [graph, setGraph] = useState<FlowArc[][]>([])
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [maximumFlowData, setMaximumFlowData] = useState<MaximumFlowData | undefined>(undefined)

  const initGraph = (n: number) => {
    const newGraph = []
    for (let i = 0; i < n; i++) {
      newGraph.push([] as FlowArc[])
      for (let j = 0; j < n; j++) {
        if (i === j) {
          newGraph[i].push({ flow: 0, capacity: 0})
        }
        newGraph[i].push({ flow: NaN, capacity: NaN })
      }
    }
    setGraph(newGraph)
  }

  const updateGraph = (i: number, j: number, flow: number|undefined, capacity: number|undefined) => {
    const newGraph = graph
    if (newGraph[i][j] === undefined) {
      newGraph[i][j] = { flow: flow ?? 0, capacity: capacity ?? 0 }
    } else {
      const node = newGraph[i][j]
      newGraph[i][j] = { flow: flow ?? (isNaN(node.flow) && (capacity !== undefined && !isNaN(capacity)) ? 0 : node.flow), capacity: capacity ?? node.capacity }
    }
    document.getElementById(`arc-${i}-${j}-flow`)?.setAttribute("value", isNaN(newGraph[i][j].flow) ? "NaN" : newGraph[i][j].flow.toString())
    setGraph(newGraph)
  }

  const expandGraph = (n: number) => {
    let newGraph = graph
    console.log(newGraph)
    for (let i = 0; i < n; i++) {
      if (newGraph[i] === undefined) {
        newGraph.push([] as FlowArc[])
      }
      for (let j = 0; j < n; j++) {
        if (newGraph[i][j] === undefined) {
          if (i === j) {
            newGraph[i].push({ flow: 0, capacity: 0 })
          } else {
            newGraph[i].push({ flow: NaN, capacity: NaN })
          }
        }
      }
      newGraph[i] = newGraph[i].slice(0,n)
    }
    newGraph = newGraph.slice(0,n)
    setGraph(newGraph)
  }

  const updateTable = (n: number) => {
    expandGraph(n)
    const initialCharCode = "A".charCodeAt(0)
    if (!isNaN(n) && n > 0) {
      const theadRow = document.querySelector("#input>thead>tr")
      if (theadRow) {
        theadRow.innerHTML = "<th>-></th>"
        for (let i = 0; i < n; i++) {
          const th = document.createElement("th")
          th.textContent = String.fromCharCode(initialCharCode + i)
          theadRow.appendChild(th)
        }
      }
    }
    const tbody = document.querySelector("#input>tbody")
    if (tbody) {
      tbody.innerHTML = ""
      for (let i = 0; i < n; i++) {
        const tr = document.createElement("tr")
        for (let j = 0; j < n+1; j++) {
          if (j === 0) {
            const th = document.createElement("th")
            th.textContent = String.fromCharCode(initialCharCode + i)
            tr.appendChild(th)
          } else {
            const td = document.createElement("td")
            const flowInput = document.createElement("input")
            flowInput.type = "number"
            flowInput.id = `arc-${i}-${j-1}-flow`
            flowInput.onchange = (e) => {updateGraph(i,j-1,parseInt((e.target as HTMLInputElement).value), undefined)}
            if (graph[i][j-1] !== undefined) {
              flowInput.setAttribute("value", graph[i][j-1].flow.toString())
            }
            if (i === j-1) {
              flowInput.setAttribute("disabled", "disabled")
            }
            const capacityInput = document.createElement("input")
            capacityInput.type = "number"
            capacityInput.id = `arc-${i}-${j-1}-capacity`
            capacityInput.onchange = (e) => {
              updateGraph(i,j-1,undefined,parseInt((e.target as HTMLInputElement).value))
            }
            if (graph[i][j-1] !== undefined) {
              capacityInput.setAttribute("value", graph[i][j-1].capacity.toString())
            }
            if (i === j-1) {
              capacityInput.setAttribute("disabled", "disabled")
            }
            const separator = document.createElement("span")
            separator.textContent = "/"
            td.appendChild(flowInput)
            td.appendChild(separator)
            td.appendChild(capacityInput)
            tr.appendChild(td)
          }
        }
        tbody.appendChild(tr)
      }
    }
  }

  const updateOutput = (n: number) => {
    const initialCharCode = "A".charCodeAt(0)
    if (!isNaN(n) && n > 0) {
      const theadRow = document.querySelector("#output>thead>tr")
      if (theadRow) {
        theadRow.innerHTML = "<th>-></th>"
        for (let i = 0; i < n; i++) {
          const th = document.createElement("th")
          th.textContent = String.fromCharCode(initialCharCode + i)
          theadRow.appendChild(th)
        }
      }
    }
    const tbody = document.querySelector("#output>tbody")
    if (tbody) {
      tbody.innerHTML = ""
      for (let i = 0; i < n; i++) {
        const tr = document.createElement("tr")
        for (let j = 0; j < n+1; j++) {
          if (j === 0) {
            const th = document.createElement("th")
            th.textContent = String.fromCharCode(initialCharCode + i)
            tr.appendChild(th)
          } else {
            const td = document.createElement("td")
            const flowInput = document.createElement("input")
            flowInput.type = "number"
            if (maximumFlowData?.graph[i][j-1] !== undefined) {
              flowInput.setAttribute("value", maximumFlowData?.graph[i][j-1].flow.toString())
            }
            flowInput.setAttribute("disabled", "disabled")
            const capacityInput = document.createElement("input")
            capacityInput.type = "number"
            if (maximumFlowData?.graph[i][j-1] !== undefined) {
              capacityInput.setAttribute("value", maximumFlowData?.graph[i][j-1].capacity.toString())
            }
            capacityInput.setAttribute("disabled", "disabled")
            const separator = document.createElement("span")
            separator.textContent = "/"
            td.appendChild(flowInput)
            td.appendChild(separator)
            td.appendChild(capacityInput)
            tr.appendChild(td)
          }
        }
        tbody.appendChild(tr)
      }
    }
  }

  const solveUsingForFulkerson = () => {
    setMaximumFlowData(getMaximumFlowData(graph, start.charCodeAt(0) - "A".charCodeAt(0), end.charCodeAt(0) - "A".charCodeAt(0)))
  }

  useEffect(() => {
    initGraph(defaultNodeNumber)
    updateTable(defaultNodeNumber)
  }, []);
  useEffect(() => {
    updateOutput(maximumFlowData?.graph.length ?? 0)
  }, [maximumFlowData]);

  return (
    <>
      <h1 className="mb-8">Maximum flow problem solver using Ford Fulkerson</h1>
      <div>
        <div className="flex gap-4">
          <label htmlFor="">Nombre de noeuds</label>
          <input className="border-solid border-2 px-1 w-12" type="number" id="nodenumber" defaultValue={defaultNodeNumber} onChange={(e) => updateTable(parseInt(e.target.value))}/>
        </div>
        <table id="input" className="mb-8">
          <thead>
          <tr>
            <th>-{">"}</th>
          </tr>
          </thead>
          <tbody>

          </tbody>
        </table>
        <div className="flex flex-col items-start gap-4">
          <div className="flex gap-4">
            <label htmlFor="">Source :</label>
            <input type="text" className="border-solid  border-2 w-10" value={start} onChange={(e) => setStart(e.target.value)}/>
          </div>
          <div className="flex gap-4">
            <label htmlFor="">Puits :</label>
            <input type="text" className="border-solid  border-2 w-10" value={end} onChange={(e) => setEnd(e.target.value)}/>
          </div>
        </div>
        <div className="flex flex-row-reverse">
          <button className="bg-blue-500 border-blue-600 text-white mt-2" onClick={() => solveUsingForFulkerson()}>
            Solve
          </button>
        </div>
      </div>
      {maximumFlowData != undefined &&
        <div>
          <h2 className="mt-8 mb-4 font-bold text-2xl">Results</h2>
          <div className="flex flex-col items-start">
            <div>
              <p className="text-lg"><span className="font-bold ">Tableau final</span></p>
              <table id="output" className="mb-8">
                <thead>
                <tr>
                  <th>-{">"}</th>
                </tr>
                </thead>
                <tbody>

                </tbody>
              </table>
            </div>
            <div>
              <p className="text-lg"><span className="font-bold ">Maximum flow : </span>{maximumFlowData.maxFlow}</p>
            </div>
          </div>
        </div>
      }
    </>
  )
}

export default FordFulkerson
