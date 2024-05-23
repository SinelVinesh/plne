import './App.css'
import MathTex from "react-mathtex";
import {useState} from "react";
import {solveLP} from "./plne.ts";

function App() {
  const [linearProgram, setLinearProgram] = useState("");
  const updateLinearProgram = (input: string) => {
    const re = /\n/g
    input = input.replace(re,"\\\\")
    setLinearProgram(input)
  }
  const handleSolve = () => {
    try {
      solveLP(linearProgram)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <>
      <h1 className="mb-8">PLNE Solver</h1>
      <div className="flex items-center" >
        <textarea
          rows={6}
          cols={30}
          id={"linear-program"}
          className="border border-gray-300"
          onChange={(e) => updateLinearProgram(e.target.value)}
        />
        <MathTex classname="h-fit ml-4 text-xl min-w-[200px]">
          {
            "<$>\\begin{cases}"+
            linearProgram+
            "\\end{cases}</$$>"
          }
        </MathTex>
      </div>
      <div className="flex flex-row-reverse">
        <button className="bg-blue-500 border-blue-600 text-white mt-2" onClick={handleSolve}>
          Solve
        </button>
      </div>
    </>
  )
}

export default App
