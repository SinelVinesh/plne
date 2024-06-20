import MathTex from "react-mathtex";
import React, {useState} from "react";
import {BnBResult, brunchAndBound, LPResult, solveLP} from "./plne.ts";

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
  const [integerProgrammingOutput, setIntegerProgrammingOutput] = useState("");
  const [integerProgramming, setIntegerProgramming] = useState(false);
  const [solution, setSolution] = useState<LPResult|undefined>(undefined)
  const [error, setError] = useState<string>("")
  const [PLNESolution, setPLNESolution] = useState<BnBResult|undefined>(undefined)
  const [BnBSections, setBnBSections] = useState<JSX.Element[]>([])
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
        setPLNESolution(brunchAndBound(linearProgram))
        generateBrunchAndBoundSections()
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
  const handleIntegerProgramming = (event: React.MouseEvent<HTMLInputElement,MouseEvent>) => {
    setIntegerProgramming((event.target as HTMLInputElement).checked)
  }

  function BnBSection(branch: [number,string[]]) {
    return (
      <Collapsible
        trigger={`x_${branch[0]}`}
        className="mt-2 border-2 border-solid border-gray-300"
        openedClassName="mt-2 border-4 border-solid border-gray-300"
      >
        <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
          {
            "<$>\\begin{cases} "+
            branch[1][0]
            +
            "\\end{cases}</$$>"
          }
        </MathTex>
        <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
          {
            "<$>\\begin{cases}"+
            branch[1][1] +
            "\\end{cases}</$$>"
          }
        </MathTex>
      </Collapsible>
    )
  }

  function generateBrunchAndBoundSections() {
    const branchNodes = []
    if (PLNESolution != undefined) {
      PLNESolution.branches = new Map([...PLNESolution.branches.entries()].sort((a,b) => a[0] - b[0]))
      for (const branch of PLNESolution.branches) {
        branchNodes.push(BnBSection(branch))
      }
    }
    setBnBSections(branchNodes)
  }


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
      {PLNESolution != undefined &&
        <div id="branch-bound-section" className="mt-4">
          {BnBSections}
        </div>
      }
    </>
  )
}

export default Plne
