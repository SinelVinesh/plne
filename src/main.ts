import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'
import {simplexe} from "./plne.ts";
import {Matrix} from "ml-matrix";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

const matrix = new Matrix([
  [1, -1, 1, 0, 0, 1],
  [2, -1, 0, 1, 0, 2],
  [1,  1, 0, 0, 1, 7],
  [-1, 0, 0, 0, 0, 0]
])
const bases = new Map<number,number>()
bases.set(0,2)
bases.set(1,3)
bases.set(2,4)

simplexe("min",matrix,bases)

console.log(matrix)
console.log(bases)