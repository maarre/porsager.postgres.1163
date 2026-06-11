
export interface IfsPersonParamsFnFirstnamesGetpkV1  {
    first_name_: string
}

export interface IfsPersonReturnFnFirstnamesGetpkV1 {
    value_: number
}

export interface IfsPersonParamsFnFirstnamesFilterV1  {
    start_: number
    forward_: boolean
    pagesize_: number
    names_: string[]
    conditions_: string[]
    first_values_: string[]
    second_values_: string[]
}

export interface IfsPersonReturnFnFirstnamesFilterV1  {
    pk_: number
    first_name_: string
    created_at_: Date
}

export interface IfsPersonParamsFnFirstnamesSelectV1  {
    start_: number
    forward_: boolean
    pagesize_: number
    names_: string[]
    conditions_: string[]
    first_values_: string[]
    second_values_: string[]
    select_: string[]
}

export interface IfsPersonParamsFnFirstnamesAggregateV1  {
    offset_: number
    limit_: number
    names_: string[]
    conditions_: string[]
    first_values_: string[]
    second_values_: string[]
    groupby_: string[]
    count_: string[]
    avg_: string[]
    max_: string[]
    min_: string[]
    sum_: string[]
    orderby_: string[]
    asc_desc_: string[]
}


export interface IfsPersonParamsSpFirstnamesCreateV1  {
    first_name_: string
    created_at_: Date | undefined
}
