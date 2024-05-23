export type ProblemType = "max" | "min"
export type Operation = "\\leq" | "\\geq" | "="
export type Objective = {
    type: ProblemType
    coefficients: Coefficient[]
}

export type Constraint = {
    coefficients: Coefficient[]
    operation: Operation
    rightHandSide: number
}

export type Coefficient = {
    order: number
    value: number
}
