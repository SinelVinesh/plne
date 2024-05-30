import './App.css'
import MathTex from "react-mathtex";
import React, {useState} from "react";
import {brunchAndBound, solveLP} from "./plne.ts";
import {Coefficient} from "./model.ts";

function App() {
  const [linearProgram, setLinearProgram] = useState("");
  const [integerProgrammingOutput, setIntegerProgrammingOutput] = useState("");
  const [integerProgramming, setIntegerProgramming] = useState(false);
  const [solutionCoefficients, setSolutionCoefficients] = useState<Coefficient[]>([])
  const updateLinearProgram = (input: string) => {
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
        setSolutionCoefficients(brunchAndBound(linearProgram))
      } else {
        setSolutionCoefficients(solveLP(linearProgram))
      }
    } catch (e) {
      console.log(e)
    }
  }
  const handleIntegerProgramming = (event: React.MouseEvent<HTMLInputElement,MouseEvent>) => {
    setIntegerProgramming((event.target as HTMLInputElement).checked)
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
            className="border border-gray-300"
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
      { solutionCoefficients.length != 0 && <div>
        <h2>Solution optimal du problem</h2>
          <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
            {
              "<$>\\begin{cases}"+
              solutionCoefficients.map((coefficient) => {
                return `x_{${coefficient.order+1}} = ${coefficient.value}`
              }).join("\\\\") +
              "\\end{cases}</$$>"
            }
          </MathTex>
      </div>}
    </>
  )
}

export default App
