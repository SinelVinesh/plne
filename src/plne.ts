import {Matrix} from "ml-matrix"
import {Coefficient, Constraint, Objective, ProblemType} from "./model.ts";
import Fraction from "fraction.js";
import {copy} from "./util.ts";

const coefficientRe = /[-\d/]*x_[\d+]/g
const valueRe = /[-\d/]*/
const orderRe = /(?<=x_)\d+/
const operationRe = /\\leq|\\geq|=/

export function solveLP(linearProgram: string) {
  const lines = linearProgram.split("\\\\")
  const constraints = getConstraints(lines.slice(1,lines.length))
  const objective = getObjective(lines[0])
  return twoPhaseSimplexe(objective, constraints)
}

export function brunchAndBound(linearProgram: string) {
  const lines = linearProgram.split("\\\\")
  const constraints = getConstraints(lines.slice(1,lines.length))
  const objective = getObjective(lines[0])
  return brunchAndBoundRecursive(objective, constraints, [], {value: NaN})
}

function brunchAndBoundRecursive(objective: Objective, constraints: Constraint[], coefficients: Coefficient[] = [], solution: {value: number}, depth: number = 0) {

  const optimalCoefficient = twoPhaseSimplexe(copy(objective), copy(constraints))
  const optimalSolution = calculateSolution(optimalCoefficient, objective.coefficients)
  for (const coefficient of optimalCoefficient) {
    if (coefficient.value % 1 !== 0) {
      const leqConstraint: Constraint = {
        coefficients: [{order: coefficient.order, value: 1}],
        operation: "\\leq",
        rightHandSide: Math.floor(coefficient.value)
      }
      const leqCoefficient: Coefficient[] = brunchAndBoundRecursive(objective, [...constraints, leqConstraint],coefficients, solution, depth + 1)
      const geqConstraint: Constraint = {
        coefficients: [{order: coefficient.order, value: 1}],
        operation: "\\geq",
        rightHandSide: Math.ceil(coefficient.value)
      }
      const geqCoefficient: Coefficient[] = brunchAndBoundRecursive(objective, [...constraints, geqConstraint],coefficients, solution, depth + 1)
      if (objective.type == "max") {
        if (calculateSolution(leqCoefficient, objective.coefficients) > calculateSolution(geqCoefficient, objective.coefficients)) {
          return leqCoefficient
        } else {
          return geqCoefficient
        }
      } else {
        if (calculateSolution(leqCoefficient, objective.coefficients) < calculateSolution(geqCoefficient, objective.coefficients)) {
          return leqCoefficient
        } else {
          return geqCoefficient
        }
      }
    }
  }
  if (isNaN(solution.value) || (objective.type == "max" && solution.value < optimalSolution) || (objective.type == "min" && solution.value > optimalSolution)) {
    coefficients = optimalCoefficient
  }
  return coefficients
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
    throw new Error(`${type} expression must have at least one coefficient`)
  }
  for (const match of matches) {
    const orderMatch = match.match(orderRe)
    if (orderMatch == null || orderMatch.length == 0) {
      throw new Error(`One of the ${type.toLowerCase()} variable have a syntax error`)
    }
    const order = parseInt(orderMatch[0]) - 1
    const valueMatch = match.match(valueRe)
    if (valueMatch == null || valueMatch.length == 0) {
      throw new Error(`One of the objective ${type.toLowerCase()} is missing`)
    }
    const value = new Fraction(valueMatch[0] == "" ? "1" : valueMatch[0]).valueOf()
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
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i]
    switch (constraint.operation) {
      case "\\leq":
        maxOrder += 1
        constraint.coefficients.push({
          order: maxOrder,
          value: 1
        })
        break
      case "\\geq":
        maxOrder += 1
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

function createSimplexeMatrix(objective: Objective, constraints: Constraint[], columns: number): Matrix {
  const rows = constraints.length + 1
  const matrix = new Matrix(rows, columns)
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i]
    for (let j = 0; j < constraint.coefficients.length; j++) {
      const coefficient = constraint.coefficients[j]
      matrix.set(i, coefficient.order, coefficient.value)
    }
    matrix.set(i, columns-1, constraint.rightHandSide)
  }
  for (let i = 0; i < objective.coefficients.length; i++) {
    const coefficient = objective.coefficients[i]
    matrix.set(rows - 1, coefficient.order, coefficient.value)
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

// function printMatrix(matrix: Matrix) {
//   let result = ""
//   for (let i = 0; i < matrix.rows; i++) {
//     let row = ""
//     for (let j = 0; j < matrix.columns; j++) {
//       if (matrix.get(i, j) % 1 === 0) {
//         row += matrix.get(i, j) + " "
//         continue
//       }
//       const fraction = new Fraction(matrix.get(i, j))
//       row += (fraction.s == -1 ? "-" : "") +fraction.n + '/' + fraction.d  + " "
//     }
//     result += row + "\n"
//   }
//   console.log(result)
// }

function calculateZ(matrix: Matrix, baseVariables: Map<number, number>, objective: Objective) {
  const lastRow = matrix.getRow(matrix.rows - 1)
  for (let i = 0; i < lastRow.length; i++) {
    let value = 0;
    for (const coefficient of objective.coefficients) {
      if (coefficient.order == i) {
        value -= coefficient.value
      }
    }
    for (let j = 0; j < matrix.rows; j++) {
      const matrixValue = matrix.get(j, i)
      const baseVariable = baseVariables.get(j)
      for (const coefficient of objective.coefficients) {
        if (coefficient.order == baseVariable) {
          value += matrixValue * coefficient.value
        }
      }
    }
    lastRow[i] = value
  }
  matrix.setRow(matrix.rows - 1, lastRow)
}

function twoPhaseSimplexe(objective: Objective, constraints: Constraint[]) {
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
        value: -1
      })
    }
    const auxiliaryMatrix = createSimplexeMatrix(auxiliarObjective,constraints, maxOrder+2)
    const auxiliaryBaseVariables = getBaseVariables(constraints)
    calculateZ(auxiliaryMatrix, auxiliaryBaseVariables, auxiliarObjective)
    // we solve the auxiliary matrix
    simplexe("min", auxiliaryMatrix, auxiliaryBaseVariables)
    // we check if the optimal solution of the auxiliary matrix is 0
    const z = auxiliaryMatrix.get(auxiliaryMatrix.rows - 1, auxiliaryMatrix.columns - 1)
    if (z != 0) {
      throw new Error("The problem has no solution")
    }
    // we drop the artificial variable columns and return to the original problem
    for (const artificalVariable of artificialVariables) {
      auxiliaryMatrix.removeColumn(artificalVariable)
    }
    matrix = auxiliaryMatrix
    baseVariables = auxiliaryBaseVariables
    objective.type = "min"
    // printMatrix(matrix)
  }
  if (matrix == undefined || baseVariables == undefined) {
    matrix = createSimplexeMatrix(objective, constraints, maxOrder + 2)
    baseVariables = getBaseVariables(constraints)
  }
  simplexe(objective.type, matrix, baseVariables)
  const optimalSolution: Coefficient[] = [];
  for (let i = 0; i < decisionVariables; i++) {
    let value = 0
    for (const [key, element] of baseVariables.entries()) {
      if (element == i) {
        value = matrix.get(key, matrix.columns - 1)
      }
    }
    optimalSolution.push({
      order: i,
      value: value
    })
  }
  return optimalSolution
}

/**
 * Implementation of the simplexe algorithm to solve linear programming problems
 * @param problemType
 * @param matrix
 * @param baseVariables
 */
export function simplexe(problemType: ProblemType, matrix:Matrix, baseVariables: Map<number, number>) {
  let enteringIndex = getEnteringVariableIndex(problemType, matrix)
  while (enteringIndex != -1) {
    const enteringColumn = matrix.getColumn(enteringIndex)
    const lastColumn = matrix.getColumn(matrix.columns - 1)
    const leavingIndex = getLeavingVariableIndex(enteringColumn, lastColumn)
    if (leavingIndex != -1) {
      let leavingRow = matrix.getRow(leavingIndex)
      const pivot = matrix.get(leavingIndex, enteringIndex)
      leavingRow = leavingRow.map((value) => value / pivot)
      matrix.setRow(leavingIndex, leavingRow)
      baseVariables.set(leavingIndex, enteringIndex)
      
      updateSimplexeMatrix(matrix,enteringColumn,leavingIndex)
    }
    enteringIndex = getEnteringVariableIndex(problemType, matrix)
  }
}

function getEnteringVariableIndex(problemType: ProblemType, matrix:Matrix): number {
  const lastRow = matrix.getRow(matrix.rows - 1)
  let value = undefined
  let index = -1
  for (let i = 0; i < lastRow.length-1; i++) {
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
  for (let i = 0; i < enteringColumn.length - 1; i++) {
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
  
  for (let i = 0; i < enteringColumn.length; i++) {
    if (i != leavingIndex) {
      const substractRow = multiplyVector(leavingRow,enteringColumn[i])
      const row = matrix.getRow(i)
      matrix.setRow(i,substractVector(row, substractRow))
    }
  }
}

function multiplyVector(vector: number[], scalar: number) {
  return vector.map((element) => element * scalar)
}

function substractVector(vector: number[], toSubstract: number[]) {
  return vector.map((element, index) => element - toSubstract[index])
}
