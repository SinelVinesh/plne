import { Matrix } from "ml-matrix"
import {Coefficient, Constraint, Objective} from "./model.ts";
type ProblemType = "max" | "min"

const coefficientRe = /[-\d]*x_[\d+]/g
const valueRe = /[-\d]*/
const orderRe = /(?<=x_)\d+/
const operationRe = /\\leq|\\geq|=/

export function solveLP(linearProgram: string) {
  const lines = linearProgram.split("\\\\\\\\")
  const constraints = getConstraints(lines.slice(1,lines.length))
  const objective = getObjective(lines[0])
  console.log(objective)
  console.log(constraints)
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
