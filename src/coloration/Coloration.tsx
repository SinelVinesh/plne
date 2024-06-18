import './Coloration.css'
import {useEffect, useState} from "react";
import {solveColoration} from "./coloration.ts";

const defaultNodeNumber = 5

function Coloration() {
  const [graph, setGraph] = useState<number[][]>([])
  const [stables, setStables] = useState<number[][]|undefined>(undefined)

  const initGraph = (n: number) => {
    const newGraph = []
    for (let i = 0; i < n; i++) {
      newGraph.push([] as number[])
      for (let j = 0; j < n; j++) {
        if (i === j) {
          newGraph[i].push(1)
        } else {
          newGraph[i].push(0)
        }
      }
    }
    setGraph(newGraph)
  }

  const updateGraph = (i: number, j: number, value: boolean) => {
    const newGraph = graph
    newGraph[i][j] = value ? 1 : 0
    newGraph[j][i] = value ? 1 : 0
    setGraph(newGraph)
    if (value) {
      document.getElementById(`node-${j}-${i}`)?.setAttribute("checked", "checked")
    } else {
      document.getElementById(`node-${j}-${i}`)?.removeAttribute("checked")
    }
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
            newGraph[i].push(1)
          } else {
            newGraph[i].push(0)
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
            input.type = "checkbox"
            input.id = `node-${i}-${j-1}`
            input.onclick = (e) => {updateGraph(i,j-1,(e.target as HTMLInputElement).checked)}
            if (graph[i][j-1] === 1) {
              input.setAttribute("checked", "checked")
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

  const solveColorationProblem = () => {
    setStables(solveColoration(graph))
  }

  useEffect(() => {
    initGraph(defaultNodeNumber)
    updateTable(defaultNodeNumber)
  }, []);

  return (
    <>
      <h1 className="mb-8">Graph coloration solver</h1>
      <div>
        <div className="flex gap-4">
          <label htmlFor="">Nombre de noeuds</label>
          <input className="border-solid border-2 px-1 w-12" type="number" id="nodenumber" defaultValue={defaultNodeNumber} onChange={(e) => updateTable(parseInt(e.target.value))}/>
        </div>
        <table>
          <thead>
            <tr>
              <th>-</th>
            </tr>
          </thead>
          <tbody>

          </tbody>
        </table>
        <div className="flex flex-row-reverse">
          <button className="bg-blue-500 border-blue-600 text-white mt-2" onClick={() => solveColorationProblem()}>
            Solve
          </button>
        </div>
      </div>
      {stables && <div>
        <h2 className="mt-4 mb-8 text-2xl font-bold">Coloration du graphe</h2>
        <div className="flex gap-4">
          {stables.map((stable, i) => {
            return (
              <div key={i} className="flex flex-col gap-1">
                <span className="font-bold text-xl">Couleur {i+1}</span>
                <div className="flex gap-1">
                  {stable.map((node, j) => {
                    return (
                      <span key={j}>{String.fromCharCode("A".charCodeAt(0)+node)}</span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>}
    </>
  )
}

export default Coloration
