import "./MooreDjikstra.css"
import {useEffect, useState} from "react";

const defaultNodeNumber = 5

function Coloration() {
  const [graph, setGraph] = useState<number[][]>([])

  const initGraph = (n: number) => {
    const newGraph = []
    for (let i = 0; i < n; i++) {
      newGraph.push([] as number[])
      for (let j = 0; j < n; j++) {
        if (i === j) {
          newGraph[i].push(0)
        }
        newGraph[i].push(NaN)
      }
    }
    setGraph(newGraph)
  }

  const updateGraph = (i: number, j: number, value: number) => {
    isNaN(value) ? console.log("NaN") : console.log(value)
    const newGraph = graph
    newGraph[i][j] = value ? value : 0
    newGraph[j][i] = value ? value : 0
    setGraph(newGraph)
    document.getElementById(`node-${j}-${i}`)?.setAttribute("value", isNaN(value) ? "" : value.toString())
  }

  const expandGraph = (n: number) => {
    let newGraph = graph
    console.log(newGraph)
    for (let i = 0; i < n; i++) {
      if (newGraph[i] === undefined) {
        newGraph.push([] as number[])
      }
      for (let j = 0; j < n; j++) {
        if (newGraph[i][j] === undefined) {
          if (i === j) {
            newGraph[i].push(0)
          } else {
            newGraph[i].push(NaN)
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
      const theadRow = document.querySelector("thead>tr")
      if (theadRow) {
        theadRow.innerHTML = "<th>-</th>"
        for (let i = 0; i < n; i++) {
          const th = document.createElement("th")
          th.textContent = String.fromCharCode(initialCharCode + i)
          theadRow.appendChild(th)
        }
      }
    }
    const tbody = document.querySelector("tbody")
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
            const input = document.createElement("input")
            input.type = "number"
            input.id = `node-${i}-${j-1}`
            input.onchange = (e) => {updateGraph(i,j-1,parseInt((e.target as HTMLInputElement).value))}
            if (graph[i][j-1] !== undefined) {
              input.setAttribute("value", graph[i][j-1].toString())
            }
            if (i === j-1) {
              input.setAttribute("disabled", "disabled")
            }
            td.appendChild(input)
            tr.appendChild(td)
          }
        }
        tbody.appendChild(tr)
      }
    }
  }

  const solveUsingMooreDjikstra = () => {
  }

  useEffect(() => {
    initGraph(defaultNodeNumber)
    updateTable(defaultNodeNumber)
  }, []);

  return (
    <>
      <h1 className="mb-8">Shortest Path solver using Moore Djikstra</h1>
      <div>
        <div className="flex gap-4">
          <label htmlFor="">Nombre de noeuds</label>
          <input className="border-solid border-2 px-1 w-12" type="number" id="nodenumber" defaultValue={defaultNodeNumber} onChange={(e) => updateTable(parseInt(e.target.value))}/>
        </div>
        <table className="mb-8">
          <thead>
          <tr>
            <th>-</th>
          </tr>
          </thead>
          <tbody>

          </tbody>
        </table>
        <div className="flex flex-col items-start gap-4">
          <div className="flex gap-4">
            <label htmlFor="">Depart :</label>
            <input type="text" className="border-solid  border-2 w-10"/>
          </div>
          <div className="flex gap-4">
            <label htmlFor="">Arrivee :</label>
            <input type="text" className="border-solid  border-2 w-10"/>
          </div>
        </div>
        <div className="flex flex-row-reverse">
          <button className="bg-blue-500 border-blue-600 text-white mt-2" onClick={() => solveUsingMooreDjikstra()}>
            Solve
          </button>
        </div>
      </div>
    </>
  )
}

export default Coloration
