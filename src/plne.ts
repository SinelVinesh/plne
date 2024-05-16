import { Matrix } from "ml-matrix"
type ProblemType = "max" | "min"

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