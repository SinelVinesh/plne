import MathTex from "react-mathtex";
import React, {useEffect, useState} from "react";
import {BnBGraphNode, brunchAndBound, LPResult, solveLP} from "./plne.ts";

import Fraction from "fraction.js";
import Collapsible from "react-collapsible";

function formatFrac(value: number) {
  const fraction = new Fraction(value)
  if (fraction.d === 1) {
    return `${fraction.s == 1 ? "" : "-"}${fraction.n}`
  }
  return `${fraction.s == 1 ? "" : "-"}${fraction.n}/${fraction.d}`
}


function Plne() {
  const [linearProgram, setLinearProgram] = useState("");
  const [originalLinearProblem, setOriginalLinearProgram] = useState("");
  const [integerProgrammingOutput, setIntegerProgrammingOutput] = useState("");
  const [integerProgramming, setIntegerProgramming] = useState(false);
  const [solution, setSolution] = useState<LPResult|undefined>(undefined)
  const [error, setError] = useState<string>("")
  const [BnBSections, setBnBSections] = useState<JSX.Element|undefined>()
  const [uniqueId, setUniqueId] = useState(0)
  const [BnBGraph, setBnBGraph] = useState<BnBGraphNode[]>([])
  const updateLinearProgram = (input: string) => {
    setError("")
    const re = /\n/g
    input = input.replace(re,"\\\\")
    formatIntegerProgrammingOutput(input)
    setLinearProgram(input)
  }

  const formatIntegerProgrammingOutput = (linearPrgramOutput: string) => {
    const variableRegex = /x_\d+/g
    const variablesOccurrences = linearPrgramOutput.match(variableRegex)
    const uniqueVariables = Array.from(new Set(variablesOccurrences))
    let output = ""
    uniqueVariables.forEach((variable) => {
      output += variable + ","
    })
    output = output.slice(0,-1)
    if (output.length > 0) {
      output += "\\in \\mathbb{N}"
    }
    setIntegerProgrammingOutput(output)
  }

  const handleSolve = () => {
    try {
      if (integerProgramming) {
        const result = brunchAndBound(linearProgram)
        setOriginalLinearProgram(linearProgram)
        setBnBGraph([{id: uniqueId, value:result, children: []}])
        setUniqueId(uniqueId+1)
      } else {
        setSolution(solveLP(linearProgram))
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message)
        setError(e.message)

      }
    }
  }
  const continueSolve = (linearProgram: string, parentId: number, parendBranch: number, parentLP: number) => {
    try {
      const result = brunchAndBound(linearProgram, originalLinearProblem)
      const parent = BnBGraph.find((node) => node.id == parentId)!
      const node = {id: uniqueId, value:result, children: [], parentBranch: parendBranch, parentLP: parentLP}
      parent.children.push(node)
      BnBGraph.push(node)
      setBnBGraph([...BnBGraph])
      setUniqueId(uniqueId+1)
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.message)
        setError(e.message)

      }
    }
  }

  const handleIntegerProgramming = (event: React.MouseEvent<HTMLInputElement,MouseEvent>) => {
    setIntegerProgramming((event.target as HTMLInputElement).checked)
  }

  function solutionSection(solution:LPResult) {
    return (
        <div>
          <h2 className="mt-4 mb-8 text-2xl font-bold">Solution non entiere du problem </h2>
          <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
            {
                "<$>\\begin{cases}" +
                solution.coefficients.map((coefficient) => {
                  return `x_{${coefficient.order}} = ${formatFrac(coefficient.value)}`
                }).join("\\\\") +
                "\\\\Z= " + formatFrac(solution.Z) +
                "\\end{cases}</$$>"
            }
          </MathTex>
        </div>
    )
  }

  function BnBSection(branch: [number, string[]], parentId: number, lp1Node: BnBGraphNode|undefined, lp2Node: BnBGraphNode|undefined) {
    return (
        <Collapsible
            trigger={`x_${branch[0]}`}
            className="mt-2 border-2 border-solid border-gray-300"
            openedClassName="mt-2 border-2 border-solid border-gray-300"
        >
          <Collapsible
            trigger={"LP1"}
            className="mt-2 border-2 border-solid border-gray-300"
            openedClassName="mt-2 border-2 border-solid border-gray-300"
          >
            <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
              {
                  "<$>\\begin{cases} " +
                  branch[1][0]
                  +
                  "\\end{cases}</$$>"
              }
            </MathTex>
            <div className="flex flex-row-reverse">
              <button className="bg-blue-500 border-blue-600 text-white mt-2" onClick={() => continueSolve(branch[1][0],parentId,branch[0],1)}>
                Solve
              </button>
            </div>
            {lp1Node != undefined &&
              generateBrunchAndBoundSections(lp1Node)
            }
          </Collapsible>
          <Collapsible
              trigger={"LP2"}
              className="mt-2 border-2 border-solid border-gray-300"
              openedClassName="mt-2 border-2 border-solid border-gray-300"
          >
            <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
              {
                  "<$>\\begin{cases}" +
                  branch[1][1] +
                  "\\end{cases}</$$>"
              }
            </MathTex>
            <div className="flex flex-row-reverse">
              <button className="bg-blue-500 border-blue-600 text-white mt-2"
                      onClick={() => continueSolve(branch[1][1],parentId,branch[0],2)}>
                Solve
              </button>
            </div>
            {lp2Node != undefined &&
                generateBrunchAndBoundSections(lp2Node)
            }
          </Collapsible>
        </Collapsible>
    )
  }

  function generateBrunchAndBoundSections(node: BnBGraphNode): JSX.Element {
    const branchNodes = []
    const solution = node.value
    if (solution != undefined) {
      console.log(solution)
      branchNodes.push(solutionSection(solution.solution))
      solution.branches = new Map([...solution.branches.entries()].sort((a,b) => a[0] - b[0]))
      for (const branch of solution.branches) {
        let lp1Node = undefined
        let lp2Node = undefined
        if (node.children.length > 0) {
          lp1Node = node.children.find((child) => child.parentBranch == branch[0] && child.parentLP == 1)
          lp2Node = node.children.find((child) => child.parentBranch == branch[0] && child.parentLP == 2)
        }
        branchNodes.push(BnBSection(branch,node.id, lp1Node,lp2Node))
      }
    }
      return (<Collapsible trigger={'Solution'}
                          className="mt-2 border-2 border-solid border-gray-300 font-bold"
                          openedClassName="mt-2 border-2 border-solid border-gray-300 font-bold">{branchNodes}</Collapsible>)
  }

  function updateBnBSections() {
    if (BnBGraph != undefined && BnBGraph.length > 0) {
      setBnBSections(generateBrunchAndBoundSections(BnBGraph[0]))
    }
  }

  useEffect(() => {
    updateBnBSections()
  }, [BnBGraph]);

  return (
    <>
      <h1 className="mb-8">Linear program Solver</h1>
      <div className="flex items-center" >
        <div className="flex flex-col items-start gap-2">
          <textarea
            rows={6}
            cols={30}
            id={"linear-program"}
            className="px-2 py-2 border border-gray-300"
            onChange={(e) => updateLinearProgram(e.target.value)}
          />
          <div className="flex gap-1">
            <input type="checkbox" onClick={(e) => {handleIntegerProgramming(e)}}/>
            <span>
              Integer programming
            </span>
          </div>
        </div>
        <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
          {
            "<$>\\begin{cases}"+
            linearProgram +
            ((integerProgramming && integerProgrammingOutput !== "") ? "\\\\"+integerProgrammingOutput : "") +
            "\\end{cases}</$$>"
          }
        </MathTex>
      </div>
      <div className="flex flex-row-reverse">
        <button className="bg-blue-500 border-blue-600 text-white mt-2" onClick={handleSolve}>
          Solve
        </button>
      </div>
      {solution != undefined && solution.coefficients.length != 0 && <div>
            <h2 className="mt-4 mb-8 text-2xl font-bold">Solution optimal du problem</h2>
            <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
              {
                "<$>\\begin{cases}"+
                solution.coefficients.map((coefficient) => {
                  return `x_{${coefficient.order}} = ${formatFrac(coefficient.value)}`
                }).join("\\\\") +
                "\\\\Z= "+formatFrac(solution.Z)+
                "\\end{cases}</$$>"
              }
            </MathTex>
        </div>
      }
      {error != "" && <div>
        <h2 className="mt-8 mb-4 text-2xl font-bold text-red-400">Error</h2>
        <h2 className="mb-8 text-xl font-bold text-red-400">{error}</h2>
      </div>
      }
      {
        BnBSections != undefined &&
        <div id="branch-bound-section" className="mt-4">
          {BnBSections != undefined && BnBSections}
        </div>
      }
    </>
  )
}

export default Plne
