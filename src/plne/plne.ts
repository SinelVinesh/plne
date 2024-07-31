import {Matrix} from "ml-matrix"
import {Coefficient, Constraint, Objective, ProblemType} from "../model.ts";
import Fraction from "fraction.js";
import {copy} from "../util.ts";

const variableMap = new Map<number,string>()

export type LPResult = {
  Z: number,
  coefficients: Coefficient[],
  matrix?: Matrix
}

export type BnBResult = {
  solution: LPResult,
  branches: Map<number,string[]>
}

export type BnBGraphNode = {
  id: number,
  parentBranch?: number,
  parentLP?:number,
  value?: BnBResult
  children: BnBGraphNode[]
}

const coefficientRe = /[-\d/]*x_[\d+]/g
const valueRe = /[-\d/]*/
const orderRe = /(?<=x_)\d+/
const operationRe = /\\leq|\\geq|=/


export function solveLP(linearProgram: string) {
  variableMap.clear()
  const lines = linearProgram.split("\\\\")
  const constraints = getConstraints(lines.slice(1,lines.length))
  const objective = getObjective(lines[0])
  return twoPhaseSimplexe(objective, constraints)
}

export function brunchAndBound(linearProgram: string) {
  const lines = linearProgram.split("\\\\")
  const constraints = getConstraints(lines.slice(1,lines.length))
  const objective = getObjective(lines[0])
  console.log(brunchAndBoundRecursiveAuto(objective, constraints, {Z: NaN, coefficients: []}, {value: NaN}, 0, []))
  return brunchAndBoundRecursive(objective, constraints)
}

function brunchAndBoundRecursive(objective: Objective, constraints: Constraint[]): BnBResult {
  const twoPhaseSolution = twoPhaseSimplexe(copy(objective), copy(constraints))
  const result: BnBResult = {
    solution: {
      Z: twoPhaseSolution.Z,
      coefficients: twoPhaseSolution.coefficients,
      matrix: twoPhaseSolution.matrix
    },
    branches: new Map<number, string[]>()
  }
  for (const coefficient of twoPhaseSolution.coefficients) {
    if (coefficient.value % 1 !== 0) {
      const leqConstraint: Constraint = {
        coefficients: [{order: coefficient.order, value: 1}],
        operation: "\\leq",
        rightHandSide: Math.floor(coefficient.value)
      }
      const geqConstraint: Constraint = {
        coefficients: [{order: coefficient.order, value: 1}],
        operation: "\\geq",
        rightHandSide: Math.ceil(coefficient.value)
      }
      result.branches.set(coefficient.order, [buildProblem(objective, constraints, leqConstraint), buildProblem(objective, constraints, geqConstraint)])
    }
  }
  return result
}

function buildProblem(objective: Objective, constraints: Constraint[], constraint: Constraint): string {
  let problem = "";
  problem += `${objective.type}\\quad`
  for (let i = 0; i < objective.coefficients.length; i++) {
    const coefficient = objective.coefficients[i]
    if (i > 0 && coefficient.value > 0) {
      problem += "+"
    }
    problem += `${coefficient.value == 1 ? "" : coefficient.value == -1 ? "-" : coefficient.value}x_${coefficient.order}`
  }
  problem += "\\\\"
  const allConstraints = [...constraints, constraint]
  for (const constraint of allConstraints) {
    for (let i = 0; i < constraint.coefficients.length; i++) {
      const coefficient = constraint.coefficients[i]
      if (i > 0 && coefficient.value > 0) {
        problem += "+"
      }
      problem += `${coefficient.value == 1 ? "" : coefficient.value == -1 ? "-" : coefficient.value}x_${coefficient.order}`
    }
    problem += `${constraint.operation} ${constraint.rightHandSide}\\\\`
  }
  problem = problem.slice(0, problem.length - 2)
  return problem
}

function brunchAndBoundRecursiveAuto(objective: Objective, constraints: Constraint[], result: LPResult, solution: {value: number}, depth: number = 0, solutionRegistry: LPResult[]): LPResult {
  try {
    const twoPhaseSolution = twoPhaseSimplexe(copy(objective), copy(constraints))
    for (const solution of solutionRegistry) {
      if (solution.coefficients.every((coefficient, index) => coefficient.value == twoPhaseSolution.coefficients[index].value)) {
        return result
      }
    }
    solutionRegistry.push(twoPhaseSolution)
    const optimalSolution = calculateSolution(twoPhaseSolution.coefficients, objective.coefficients)
    for (const coefficient of twoPhaseSolution.coefficients) {
      const temp = new Fraction(coefficient.value)
      if (temp.d != 1 && temp.n != 0 && temp.n != temp.d) {
        const leqConstraint: Constraint = {
          coefficients: [{order: coefficient.order, value: 1}],
          operation: "\\leq",
          rightHandSide: Math.floor(coefficient.value)
        }
        const leqResult: LPResult = brunchAndBoundRecursiveAuto(objective, [...constraints,leqConstraint], result, solution, depth + 1, solutionRegistry)
        const geqConstraint: Constraint = {
          coefficients: [{order: coefficient.order, value: 1}],
          operation: "\\geq",
          rightHandSide: Math.ceil(coefficient.value)
        }
        const geqResult: LPResult = brunchAndBoundRecursiveAuto(objective, [...constraints,geqConstraint], result, solution, depth + 1, solutionRegistry)
        if (objective.type == "max") {
          if (calculateSolution(leqResult.coefficients, objective.coefficients) > calculateSolution(geqResult.coefficients, objective.coefficients)) {
            return leqResult
          } else {
            return geqResult
          }
        } else {
          if (calculateSolution(leqResult.coefficients, objective.coefficients) < calculateSolution(geqResult.coefficients, objective.coefficients)) {
            return leqResult
          } else {
            return geqResult
          }
        }
      }
    }
    if (isNaN(solution.value) || (objective.type == "max" && solution.value < optimalSolution) || (objective.type == "min" && solution.value > optimalSolution)) {
      result = twoPhaseSolution
      solution.value = optimalSolution
    }
    return result
  } catch (e) {
    return result
  }
}

function calculateSolution(optimalCoefficient: Coefficient[], objective: Coefficient[]) {
  let result = 0
  for (const coefficient of optimalCoefficient) {
    for (const obj of objective) {
      if (coefficient.order == obj.order) {
        result += coefficient.value * obj.value
      }
    }
  }
  return result
}

function getObjective(objective: string): Objective {
  objective = objective.toLowerCase()
  const objectiveType = objective.includes("max") ? "max" : "min"
  const coefficients = getCoefficients(objective)
  return {
    type: objectiveType,
    coefficients: coefficients
  }
}

function getCoefficients(expression: string, type: string = "Objective"): Coefficient[] {
  const matches = expression.match(coefficientRe)
  const coefficients: Coefficient[] = []
  if (matches == null) {
    throw new Error(`${type} expression must have at least one coefficient or the input contains empty lines `)
  }
  for (const match of matches) {
    const orderMatch = match.match(orderRe)
    if (orderMatch == null || orderMatch.length == 0) {
      throw new Error(`One of the ${type.toLowerCase()} variable have a syntax error`)
    }
    const order = parseInt(orderMatch[0])
    const valueMatch = match.match(valueRe)
    if (valueMatch == null || valueMatch.length == 0) {
      throw new Error(`One of the objective ${type.toLowerCase()} is missing`)
    }
    const value = new Fraction(valueMatch[0] == "-" ? "-1" : valueMatch[0] == "" ? "1" : valueMatch[0]).valueOf()
    variableMap.set(order, `x_${order}`)
    coefficients.push({
      order: order,
      value: value
    })
  }
  coefficients.sort((a, b) => a.order - b.order)
  return coefficients
}

function getConstraints(constraints: string[]): Constraint[] {
  const constraintsArray: Constraint[] = []
  for (const constraint of constraints) {
    constraintsArray.push(getConstraint(constraint))
  }
  return constraintsArray
}

function getConstraint(constraint: string): Constraint {
  const coefficients = getCoefficients(constraint, "Constraint")
  const operationMatch = constraint.match(operationRe)
  if (operationMatch == null || operationMatch.length == 0) {
    throw new Error("One of the constraints is missing an operation or using an invalid one")
  }
  const operation = operationMatch[0] as "\\leq" | "\\geq" | "="
  const rightHandSide = new Fraction(constraint.split(operation)[1].trim()).valueOf()
  return {
    coefficients: coefficients,
    operation: operation,
    rightHandSide: rightHandSide
  }
}

function standardizeProblem(objective: Objective, constraints: Constraint[], artificialVariables: number[]): number {
  let maxOrder = objective.coefficients[objective.coefficients.length - 1].order
  let sCounter = 0
  let aCounter = 0
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i]
    switch (constraint.operation) {
      case "\\leq":
        maxOrder += 1
        sCounter += 1
        variableMap.set(maxOrder, `s_${sCounter}`)
        constraint.coefficients.push({
          order: maxOrder,
          value: 1
        })
        break
      case "\\geq":
        maxOrder += 1
        sCounter += 1
        variableMap.set(maxOrder, `s_${sCounter}`)
        constraint.coefficients.push({
          order: maxOrder,
          value: -1
        })
        break
      default :
        break
    }
  }
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i]
    if (constraint.operation == "\\geq" || constraint.operation == "=") {
      maxOrder += 1
      aCounter += 1
      variableMap.set(maxOrder, `a_${aCounter}`)
      constraint.coefficients.push({
        order: maxOrder,
        value: 1
      })
      artificialVariables.push(maxOrder)
    }
    constraint.operation = "="
  }
  return maxOrder
}

function createSimplexeMatrix(objective: Objective, constraints: Constraint[], baseVariables:Map<number,number>, columns: number): Matrix {
  const rows = constraints.length + 2
  const matrix = new Matrix(rows, columns)
  for (let i = 1; i < columns-1; i++) {
    matrix.set(0, i, i)
  }
  matrix.set(0, columns-1, NaN)
  matrix.set(0, 0, NaN)
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i]
    for (let j = 0; j < constraint.coefficients.length; j++) {
      const coefficient = constraint.coefficients[j]
      matrix.set(i+1, coefficient.order, coefficient.value)
    }
    matrix.set(i+1, columns-1, constraint.rightHandSide)
  }
  for (let i = 0; i < objective.coefficients.length; i++) {
    const coefficient = objective.coefficients[i]
    matrix.set(rows - 1, coefficient.order, coefficient.value)
  }
  matrix.set(rows-1,0,NaN)
  for (const [key, value] of baseVariables.entries()) {
    matrix.set(key+1, 0, value)
  }
  return matrix
}

function getBaseVariables(constraints: Constraint[]): Map<number, number> {
  const baseVariables = new Map<number, number>()
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i]
    const lastCoefficient = constraint.coefficients[constraint.coefficients.length - 1]
    if (lastCoefficient.value == 1) {
      baseVariables.set(i, lastCoefficient.order)
    }
  }
  return baseVariables
}

function calculateZ(matrix: Matrix, objective: Objective) {
  const lastRow = matrix.getRow(matrix.rows - 1)
  const firstRow = matrix.getRow(0)
  for (let i = 1; i < lastRow.length; i++) {
    let value = 0;
    for (const coefficient of objective.coefficients) {
      if (coefficient.order == firstRow[i]) {
        value += coefficient.value
      }
    }
    for (let j = 1; j < matrix.rows; j++) {
      const matrixValue = matrix.get(j, i)
      const baseVariable = matrix.get(j,0)
      for (const coefficient of objective.coefficients) {
        if (coefficient.order == baseVariable) {
          value -= matrixValue * coefficient.value
        }
      }
    }
    lastRow[i] = value
  }
  matrix.setRow(matrix.rows - 1, lastRow)
}

function twoPhaseSimplexe(objective: Objective, constraints: Constraint[]): LPResult {
  const decisionVariables = objective.coefficients.length
  const artificialVariables: number[] = []
  const maxOrder = standardizeProblem(objective,constraints, artificialVariables)
  let matrix: Matrix|undefined = undefined
  let baseVariables: Map<number, number>|undefined = undefined
  // After standardizing the problem, we need to check if there are artificial variables
  if (artificialVariables.length > 0) {
    // we create an auxiliary objective to solve the problem
    const auxiliarObjective: Objective = {
      type: "min",
      coefficients: []
    }
    for (const artificialVariable of artificialVariables) {
      auxiliarObjective.coefficients.push({
        order: artificialVariable,
        value: 1
      })
    }
    const auxiliaryBaseVariables = getBaseVariables(constraints)
    const auxiliaryMatrix = createSimplexeMatrix(auxiliarObjective,constraints,auxiliaryBaseVariables, maxOrder+2)
    calculateZ(auxiliaryMatrix, auxiliarObjective)
    // we solve the auxiliary matrix
    simplexe("min", auxiliaryMatrix)
    // we check if the optimal solution of the auxiliary matrix is 0
    const z = auxiliaryMatrix.get(auxiliaryMatrix.rows - 1, auxiliaryMatrix.columns - 1)
    if (z != 0) {
      throw new Error("The problem has no solution")
    }


    let bases = auxiliaryMatrix.getColumn(0)
    bases = bases.slice(1, bases.length -1)
    let baseContainsArtificial = false
    for (const artificial of artificialVariables) {
      for (const base of bases) {
        if (artificial == base) {
          baseContainsArtificial = true
        }
      }
    }
    if (!baseContainsArtificial) {
        //Case 2 : Optimal is 0 and no artificial variables are in the base
        for (const artificial of artificialVariables) {
            const index = auxiliaryMatrix.getRow(0).findIndex((value) => value == artificial)
            if (index != -1) {
                removeColumn(auxiliaryMatrix, artificial)
            }
        }
    } else {
        // Case 3: Optimal is 0 and there are artificial variables in the base
        // We remove all non-base variables
        let firstRow = auxiliaryMatrix.getRow(0)
        for (const cell of firstRow) {
          const cellInBase = bases.findIndex((value) => value == cell) != -1
          if (!cellInBase) {
            const index = auxiliaryMatrix.getRow(0).findIndex((value) => value == cell)
            if (index != -1) {
              removeColumn(auxiliaryMatrix, cell)
            }
          }
        }
        // We remove all variable from the original problem that has a negative coefficient
        const lastRow = auxiliaryMatrix.getRow(auxiliaryMatrix.rows - 1)
        firstRow = auxiliaryMatrix.getRow(0)
        for (let i = 1; i < lastRow.length-1; i++) {
          if (lastRow[i] < 0 && firstRow[i] <= decisionVariables) {
            removeColumn(auxiliaryMatrix, firstRow[i])
          }
        }
    }

    // Remove non-base variables with a Z value of 1
    // const lastRow = auxiliaryMatrix.getRow(auxiliaryMatrix.rows - 1)
    // const firstRow = auxiliaryMatrix.getRow(0)
    // for (let i = 1; i < lastRow.length; i++) {
    //   if (lastRow[i] > 0) {
    //     removeColumn(auxiliaryMatrix, firstRow[i])
    //   }
    // }

    matrix = auxiliaryMatrix
    baseVariables = auxiliaryBaseVariables
    calculateZ(matrix, objective)
  }
  if (matrix == undefined || baseVariables == undefined) {
    baseVariables = getBaseVariables(constraints)
    matrix = createSimplexeMatrix(objective, constraints,baseVariables, maxOrder + 2)
  }
  simplexe(objective.type, matrix)
  const optimalSolution: Coefficient[] = [];
  for (let i = 1; i < matrix.rows-1;i++) {
    if (matrix.get(i,0) <= decisionVariables) {
      optimalSolution.push({
        order: matrix.get(i,0),
        value: matrix.get(i,matrix.columns-1)
      })
    }
  }
  return {
    Z: -matrix.get(matrix.rows-1,matrix.columns-1),
    coefficients: optimalSolution,
    matrix: matrix
  }
}

/**
 * Implementation of the simplexe algorithm to solve linear programming problems
 * @param problemType
 * @param matrix
 */
export function simplexe(problemType: ProblemType, matrix:Matrix) {
  let enteringIndex = getEnteringVariableIndex(problemType, matrix)
  while (enteringIndex != -1) {
    const enteringColumn = matrix.getColumn(enteringIndex)
    const lastColumn = matrix.getColumn(matrix.columns - 1)
    const leavingIndex = getLeavingVariableIndex(enteringColumn, lastColumn)
    if (leavingIndex != -1) {
      let leavingRow = matrix.getRow(leavingIndex)
      const pivot = matrix.get(leavingIndex, enteringIndex)
      leavingRow = leavingRow.map((value, index) => {
        if (index != 0) {
          return value / pivot
        }
        return value
      })
      matrix.setRow(leavingIndex, leavingRow)
      const enteringVariable = matrix.get(0, enteringIndex)
      matrix.set(leavingIndex, 0, enteringVariable)
      
      updateSimplexeMatrix(matrix,enteringColumn,leavingIndex)
    }
    enteringIndex = getEnteringVariableIndex(problemType, matrix)
  }
}

function getEnteringVariableIndex(problemType: ProblemType, matrix:Matrix): number {
  const lastRow = matrix.getRow(matrix.rows - 1)
  let value = undefined
  let index = -1
  for (let i = 1; i < lastRow.length-1; i++) {
    if (problemType == "max" && (value == undefined || (value < lastRow[i])) && (lastRow[i] > 0)) {
      value = lastRow[i]
      index = i
    } else  if (problemType == "min" && (value == undefined || (value > lastRow[i])) && (lastRow[i] < 0)) {
        value = lastRow[i]
        index = i
    }
  }
  return index
}

function getLeavingVariableIndex(enteringColumn: number[], lastColumn: number[]): number {
  let quotient = undefined
  let index = -1
  for (let i = 1; i < enteringColumn.length - 1; i++) {
    if (enteringColumn[i] > 0) {
      const rowQuotient = lastColumn[i] / enteringColumn[i]
      if (quotient == undefined || quotient > rowQuotient) {
        quotient = rowQuotient
        index = i
      }
    }
  }
  return index
}

function updateSimplexeMatrix(matrix: Matrix, enteringColumn: number[], leavingIndex: number) {
  const leavingRow =  matrix.getRow(leavingIndex)
  
  for (let i = 1; i < enteringColumn.length; i++) {
    if (i != leavingIndex) {
      const subtractRow = multiplySimplexeRow(leavingRow,enteringColumn[i])
      const row = matrix.getRow(i)
      matrix.setRow(i,subtractSimplexRow(row, subtractRow))
    }
  }
}

function multiplySimplexeRow(vector: number[], scalar: number) {
  return vector.map((element, index) => {
    if (index != 0) {
      return element * scalar
    }
    return element
  })
}

function subtractSimplexRow(vector: number[], toSubstract: number[]) {
  return vector.map((element, index) => {
    if (index != 0) {
      return element - toSubstract[index]
    }
    return element
  })
}

function removeColumn(matrix: Matrix, column: number) {
  const firstRow = matrix.getRow(0)
  for (let i = 0; i < firstRow.length; i++) {
    if (firstRow[i] == column) {
      matrix.removeColumn(i)
      return
    }
  }
}

export function getVariableRepresentation(order: number): string {
  return variableMap.get(order) ?? ``
}
