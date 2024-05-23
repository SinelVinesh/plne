export type Objective = {
    type: "max" | "min"
    coefficients: Coefficient[]
}

export type Constraint = {
    coefficients: Coefficient[]
    operation: "\\leq" | "\\geq" | "="
    rightHandSide: number
}

export type Coefficient = {
    order: number
    value: number
}
