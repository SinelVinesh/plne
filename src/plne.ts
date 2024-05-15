import { Matrix } from "ml-matrix"
type ProblemType = "max" | "min"

/**
 * Implementation of the simplexe algorithm to solve linear programming problems
 * @param problemType
 * @param matrix
 * @param baseVariables
 */
function simplexe(problemType: ProblemType, matrix:Matrix, baseVariables: Map<number, number>) {
    const enteringIndex = getEnteringVariableIndex(problemType, matrix)
    if (enteringIndex != -1) {
        const enteringColumn = matrix.getColumn(enteringIndex)
        const lastColumn = matrix.getColumn(matrix.columns - 1)
        const leavingIndex = getLeavingVariableIndex(enteringColumn, lastColumn)
        let leavingRow = matrix.getRow(leavingIndex)
        const pivot = matrix.get(leavingIndex, enteringIndex)
        leavingRow = leavingRow.map((value) => value / pivot)
        matrix.setRow(leavingIndex, leavingRow)
        baseVariables.set(leavingIndex, enteringIndex)
    }
}