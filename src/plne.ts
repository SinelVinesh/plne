import { Matrix } from "ml-matrix"
import {Coefficient, Constraint, Objective, ProblemType} from "./model.ts";
import Fraction from "fraction.js";

const coefficientRe = /[-\d]*x_[\d+]/g
const valueRe = /[-\d]*/
const orderRe = /(?<=x_)\d+/
const operationRe = /\\leq|\\geq|=/

export function solveLP(linearProgram: string) {
  const lines = linearProgram.split("\\\\")
  const constraints = getConstraints(lines.slice(1,lines.length))
  const objective = getObjective(lines[0])
  const decisionVariables = objective.coefficients.length
  const maxOrder = standardizeProblem(objective,constraints)
  const matrix = createSimplexeMatrix(objective,constraints, maxOrder+1)
  const baseVariables = getBaseVariables(constraints)
  console.log("Objective : ")
  console.log(objective)
  console.log("Constraints : ")
  console.log(constraints)
  console.log("Base Variables : ")
  console.log(baseVariables)
  console.log("Matrix : ")
  printMatrix(matrix)
  simplexe(objective.type, matrix, baseVariables)
  console.log("Base Variables : ")
  console.log(baseVariables)
  console.log("Matrix : ")
  printMatrix(matrix)
  console.log("Optimal Solution : ")
  const optimalSolution: Coefficient[] = [];
  for (let i = 0; i < decisionVariables; i++) {
    let value = 0
    if (baseVariables.has(i)) {
      console.log(baseVariables.get(i))
      if (baseVariables.get(i)! < matrix.rows) {
        value = matrix.get(baseVariables.get(i)!, matrix.columns - 1)
      }
    }
    if (value % 1 === 0) {
      console.log(`x_${i+1} = ${value}`)
      continue
    }
    const fraction = new Fraction(value)
    console.log(`x_${i+1} = ${fraction.n} / ${fraction.d}`)
    optimalSolution.push({
      order: i,
      value: value
    })
  }
  return optimalSolution
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
    const order = parseInt(orderMatch[0])
    const valueMatch = match.match(valueRe)
    if (valueMatch == null || valueMatch.length == 0) {
      throw new Error(`One of the objective ${type.toLowerCase()} is missing`)
    }
    const value = parseInt(valueMatch[0] == "" ? "1" : valueMatch[0])
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
  const rightHandSide = parseInt(constraint.split(operation)[1])
  return {
    coefficients: coefficients,
    operation: operation,
    rightHandSide: rightHandSide
  }
}

function standardizeProblem(objective: Objective, constraints: Constraint[]): number {
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
        constraint.operation = "="
        break
    }
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
      matrix.set(i, coefficient.order-1, coefficient.value)
    }
    matrix.set(i, columns - 1, constraint.rightHandSide)
  }
  for (let i = 0; i < objective.coefficients.length; i++) {
    const coefficient = objective.coefficients[i]
    matrix.set(rows - 1, coefficient.order-1, coefficient.value)
  }
  return matrix
}

function getBaseVariables(constraints: Constraint[]): Map<number, number> {
  const baseVariables = new Map<number, number>()
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i]
    const lastCoefficient = constraint.coefficients[constraint.coefficients.length - 1]
    if (lastCoefficient.value == 1) {
      baseVariables.set(i, lastCoefficient.order-1)
    }
  }
  return baseVariables
}

function printMatrix(matrix: Matrix) {
  let result = ""
  for (let i = 0; i < matrix.rows; i++) {
    let row = ""
    for (let j = 0; j < matrix.columns; j++) {
      if (matrix.get(i, j) % 1 === 0) {
        row += matrix.get(i, j) + " "
        continue
      }
      const fraction = new Fraction(matrix.get(i, j))
      row += fraction.n + '/' + fraction.d  + " "
    }
    result += row + "\n"
  }
  console.log(result)
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
