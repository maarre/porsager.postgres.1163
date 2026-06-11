

import { dog_subsidy, UserError, IfsCursorReturnValue, CursorReturnValue, RowTypeUnion, undef_replacer, get_user_error} from "./helpers"
import {getBaseLogger} from './logger'
import {v4 as uuidv4} from 'uuid'
import {get_type} from './typing'
import {PostgresError} from "postgres"

import { IfsPersonParamsFnFirstnamesGetpkV1 } from './personwrapper.entity.js'
import { IfsPersonParamsFnFirstnamesFilterV1, IfsPersonReturnFnFirstnamesFilterV1 } from './personwrapper.entity.js'
import { IfsPersonParamsFnFirstnamesSelectV1 } from './personwrapper.entity.js'
import { IfsPersonParamsFnFirstnamesAggregateV1 } from './personwrapper.entity.js'
import { IfsPersonParamsSpFirstnamesCreateV1 } from './personwrapper.entity.js'

const context_logger = getBaseLogger().child().withContext({'src': 'personwrapper'})

export class PersonParamsFnFirstnamesGetpkV1 implements IfsPersonParamsFnFirstnamesGetpkV1 {
    first_name_: string
    constructor(
        first_name: string ,
) {
        this.first_name_ = first_name

    }
}

export async function fn_firstnames_getpk_v1(params: IfsPersonParamsFnFirstnamesGetpkV1, breadcrumb: string, db = dog_subsidy): Promise<number > {
    const logger = context_logger.withMetadata({ breadcrumb: breadcrumb })
    logger.trace(`fn_firstnames_getpk_v1(${JSON.stringify(params, function(k, v) { return v === undefined ? 'undefined' : v; })}) called `)
    try {
        const response = await db`SELECT person.fn_firstnames_getpk_v1(
                      CAST(${ params.first_name_  } AS text)        );`
        let result = response[0].fn_firstnames_getpk_v1
        logger.trace(`Returning ${result} from fn_firstnames_getpk_v1`)
        return result
    }
    catch ( e ) {
        logger.error(`fn_firstnames_getpk_v1: Caught and rethrowing ${e} for indata ${JSON.stringify(params, undef_replacer)}. Stack=${(e as Error).stack}`)
        throw e
    }
}

export class PersonParamsFnFirstnamesFilterV1 implements IfsPersonParamsFnFirstnamesFilterV1 {
    start_: number
    forward_: boolean
    pagesize_: number
    names_: string[]
    conditions_: string[]
    first_values_: string[]
    second_values_: string[]
    constructor(
        start: number ,
        forward: boolean,
        pagesize: number ,
        names: string[],
        conditions: string[],
        first_values: string[],
        second_values: string[],
    ) {
        this.start_ = start
        this.forward_ = forward
        this.pagesize_ = pagesize
        this.names_ = names
        this.conditions_ = conditions
        this.first_values_ = first_values
        this.second_values_ = second_values
    }
}

export class PersonReturnFnFirstnamesFilterV1 implements IfsPersonReturnFnFirstnamesFilterV1 {
    pk_: number
    first_name_: string
    created_at_: Date
    constructor(
        pk: number ,
        first_name: string,
        created_at: Date,
    ) {
        this.pk_ = pk
        this.first_name_ = first_name
        this.created_at_ = created_at
    }
}

export async function fn_firstnames_filter_v1(params: IfsPersonParamsFnFirstnamesFilterV1, breadcrumb: string, db = dog_subsidy): Promise<Array<IfsPersonReturnFnFirstnamesFilterV1>|UserError> {
    const logger = context_logger.withMetadata({ breadcrumb: breadcrumb })
    logger.trace(`fn_firstnames_filter_v1(${JSON.stringify(params, function(k, v) { return v === undefined ? 'undefined' : v; })}) called `)
    try {
        const cursor = db`SELECT * FROM person.fn_firstnames_filter_v1(
                  CAST(${params.start_  } AS integer),                   CAST(${params.forward_  } AS boolean),                   CAST(${params.pagesize_  } AS integer),                   CAST(${params.names_  } AS text[]),                   CAST(${params.conditions_  } AS text[]),                   CAST(${params.first_values_  } AS text[]),                   CAST(${params.second_values_  } AS text[])        );`.cursor()
        let result = new Array<PersonReturnFnFirstnamesFilterV1>();
        for await (const [row] of cursor) {

            let item = new PersonReturnFnFirstnamesFilterV1(row.pk, row.first_name, row.created_at)
            result.push(item)
        }
        logger.trace(`Returning ${JSON.stringify(result)} from fn_firstnames_filter_v1`)
        return result
    }
    catch ( e ) {
        const user_error = get_user_error(e)
        if ( user_error ) {
            logger.debug(`user_error=${JSON.stringify(user_error)}`)
            return user_error
        }
        else {
            logger.error(`fn_firstnames_filter_v1: Caught and rethrowing ${JSON.stringify(e)} for indata ${JSON.stringify(params, undef_replacer)}. Stack=${(e as Error).stack}`)
            throw e
        }

    }
}

export class PersonParamsFnFirstnamesSelectV1 implements IfsPersonParamsFnFirstnamesSelectV1 {
    start_: number
    forward_: boolean
    pagesize_: number
    names_: string[]
    conditions_: string[]
    first_values_: string[]
    second_values_: string[]
    select_: string[]
    constructor(
        start: number ,
        forward: boolean,
        pagesize: number ,
        names: string[],
        conditions: string[],
        first_values: string[],
        second_values: string[],
        select: string[],
) {
        this.start_ = start
        this.forward_ = forward
        this.pagesize_ = pagesize
        this.names_ = names
        this.conditions_ = conditions
        this.first_values_ = first_values
        this.second_values_ = second_values
        this.select_ = select
    }
}

export async function fn_firstnames_select_v1(params: IfsPersonParamsFnFirstnamesSelectV1, breadcrumb: string, db = dog_subsidy): Promise<IfsCursorReturnValue> {
    const logger = context_logger.withMetadata({ breadcrumb: breadcrumb })
    logger.trace(`fn_firstnames_select_v1(${JSON.stringify(params, function(k, v) { return v === undefined ? 'undefined' : v; })}) called `)
    try {
        let result_rows = new Array<Array<RowTypeUnion>>()
        let result_columns = new Array<string>()
        let result_types = new Array<string>()
        let refcursor = `${uuidv4()}-refcursor`
        await db.begin(async conn => {
            try {

                const query = conn`SELECT person.fn_firstnames_select_v1(CAST(${refcursor} AS refcursor),
                      CAST(${params.start_}  AS integer),                       CAST(${params.forward_}  AS boolean),                       CAST(${params.pagesize_}  AS integer),                       CAST(${params.names_}  AS text[]),                       CAST(${params.conditions_}  AS text[]),                       CAST(${params.first_values_}  AS text[]),                       CAST(${params.second_values_}  AS text[]),                       CAST(${params.select_}  AS text[])            );`
                await query
                const cursor = conn.unsafe(`FETCH ALL FROM "${refcursor}";`).cursor()
                let look_for_nulls_in_types = true  // Used to somewhat improve performance in finding the types.
                for await (const [row] of cursor) {
                    if (result_columns.length === 0) {
                        logger.debug(`first row=${JSON.stringify(row)}`)
                        Object.keys(row).forEach(key => {
                            let value = row[key]
                            const type = get_type(value)
                            // logger.debug(`row[${key}]=${value}:${type}`)
                            result_columns.push(key)
                            result_types.push(type)
                        });
                    }
                    else if ( look_for_nulls_in_types ) {
                        let null_in_iteration = false
                        for (let i = 0; i < result_types.length; i++) {
                            const type = result_types[i]
                            if ( type === 'null') {
                                const key = result_columns[i]
                                const value = row[key]
                                const type = get_type(value)
                                // logger.debug(`row[${key}]=${value}:${type}`)
                                result_types[i] = type
                            }
                            null_in_iteration = null_in_iteration || (result_types[i] === 'null')
                        }
                        look_for_nulls_in_types = null_in_iteration
                    }
                    let result_row: any[] = []
                    for (const column of result_columns) {
                        result_row.push(row[column])
                    }
                    result_rows.push(result_row)
                }

            }
            finally {
                conn`close ${refcursor};`
            }
        })
        let result = new CursorReturnValue(result_columns, result_types, result_rows)
        logger.trace(`Returning ${JSON.stringify(result)} from fn_firstnames_select_v1`)
        return result
    }
    catch ( e ) {
        const user_error = get_user_error(e)
        if ( user_error ) {
            logger.debug(`user_error=${JSON.stringify(user_error)}`)
            throw e // todo
        }
        else {
            logger.error(`fn_firstnames_select_v1: Caught and rethrowing ${JSON.stringify(e)} for indata ${JSON.stringify(params, undef_replacer)}. Stack=${(e as Error).stack}`)
            throw e
        }
    }
}

// Cursor function fn_firstnames_aggregate_v1
export class PersonParamsFnFirstnamesAggregateV1 implements IfsPersonParamsFnFirstnamesAggregateV1 {
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
    constructor(
        offset: number ,
        limit: number ,
        names: string[],
        conditions: string[],
        first_values: string[],
        second_values: string[],
        groupby: string[],
        count: string[],
        avg: string[],
        max: string[],
        min: string[],
        sum: string[],
        orderby: string[],
        asc_desc: string[],
) {
        this.offset_ = offset
        this.limit_ = limit
        this.names_ = names
        this.conditions_ = conditions
        this.first_values_ = first_values
        this.second_values_ = second_values
        this.groupby_ = groupby
        this.count_ = count
        this.avg_ = avg
        this.max_ = max
        this.min_ = min
        this.sum_ = sum
        this.orderby_ = orderby
        this.asc_desc_ = asc_desc
    }
}

// here
export async function fn_firstnames_aggregate_v1(params: IfsPersonParamsFnFirstnamesAggregateV1, breadcrumb: string, db = dog_subsidy): Promise<IfsCursorReturnValue> {
    const logger = context_logger.withMetadata({ breadcrumb: breadcrumb })
    logger.trace(`fn_firstnames_aggregate_v1(${JSON.stringify(params, function(k, v) { return v === undefined ? 'undefined' : v; })}) called `)
    try {
        let result_rows = new Array<Array<RowTypeUnion>>()
        let result_columns = new Array<string>()
        let result_types = new Array<string>()
        let refcursor = `${uuidv4()}-refcursor`
        await db.begin(async conn => {
            try {

                const query = conn`SELECT person.fn_firstnames_aggregate_v1(CAST(${refcursor} AS refcursor),
                      CAST(${params.offset_}  AS integer),                       CAST(${params.limit_}  AS integer),                       CAST(${params.names_}  AS text[]),                       CAST(${params.conditions_}  AS text[]),                       CAST(${params.first_values_}  AS text[]),                       CAST(${params.second_values_}  AS text[]),                       CAST(${params.groupby_}  AS text[]),                       CAST(${params.count_}  AS text[]),                       CAST(${params.avg_}  AS text[]),                       CAST(${params.max_}  AS text[]),                       CAST(${params.min_}  AS text[]),                       CAST(${params.sum_}  AS text[]),                       CAST(${params.orderby_}  AS text[]),                       CAST(${params.asc_desc_}  AS text[])            );`
                await query
                const cursor = conn.unsafe(`FETCH ALL FROM "${refcursor}";`).cursor()
                let look_for_nulls_in_types = true  // Used to somewhat improve performance in finding the types.
                for await (const [row] of cursor) {
                    if (result_columns.length === 0) {
                        logger.debug(`first row=${JSON.stringify(row)}`)
                        Object.keys(row).forEach(key => {
                            let value = row[key]
                            const type = get_type(value)
                            // logger.debug(`row[${key}]=${value}:${type}`)
                            result_columns.push(key)
                            result_types.push(type)
                        });
                    }
                    else if ( look_for_nulls_in_types ) {
                        let null_in_iteration = false
                        for (let i = 0; i < result_types.length; i++) {
                            const type = result_types[i]
                            if ( type === 'null') {
                                const key = result_columns[i]
                                const value = row[key]
                                const type = get_type(value)
                                // logger.debug(`row[${key}]=${value}:${type}`)
                                result_types[i] = type
                            }
                            null_in_iteration = null_in_iteration || (result_types[i] === 'null')
                        }
                        look_for_nulls_in_types = null_in_iteration
                    }
                    let result_row: any[] = []
                    for (const column of result_columns) {
                        result_row.push(row[column])
                    }
                    result_rows.push(result_row)
                }

            }
            finally {
                conn`close ${refcursor};`
            }
        })
        let result = new CursorReturnValue(result_columns, result_types, result_rows)
        logger.trace(`Returning ${JSON.stringify(result)} from fn_firstnames_aggregate_v1`)
        return result
    }
    catch ( e ) {
        const user_error = get_user_error(e)
        if ( user_error ) {
            logger.debug(`user_error=${JSON.stringify(user_error)}`)
            throw e // todo
        }
        else {
            logger.error(`fn_firstnames_aggregate_v1: Caught and rethrowing ${JSON.stringify(e)} for indata ${JSON.stringify(params, undef_replacer)}. Stack=${(e as Error).stack}`)
            throw e
        }
    }
}


export class PersonParamsSpFirstnamesCreateV1 implements IfsPersonParamsSpFirstnamesCreateV1 {
    first_name_: string
    created_at_: Date | undefined
    constructor(
        first_name: string,
        created_at: Date | undefined ,
) {
        this.first_name_ = first_name
        this.created_at_ = created_at
    }
}

export async function sp_firstnames_create_v1(params: IfsPersonParamsSpFirstnamesCreateV1, breadcrumb: string, db = dog_subsidy): Promise<number |UserError> {
    const logger = context_logger.withMetadata({ breadcrumb: breadcrumb })
    logger.trace(`sp_firstnames_create_v1(${JSON.stringify(params, function(k, v) { return v === undefined ? 'undefined' : v; })}) called `)
    try {
        let _pk = null;
        await db`CALL person.sp_firstnames_create_v1( CAST(${_pk} AS smallint),
                  CAST(${params.first_name_  } AS text),                   CAST(${params.created_at_  ? params.created_at_:null  } AS timestamp with time zone)    )`.cursor(async ([row]) => {
            _pk = row._pk
        })
        if ( ! _pk ) {
            throw Error('_pk null or undefined')
        }
        logger.trace(`Returning ${ _pk } from sp_firstnames_create_v1`)
        return _pk
    }
    catch ( e ) {
        const user_error = get_user_error(e)
        if ( user_error ) {
            return user_error
        }
        else {
            logger.error(`sp_firstnames_create_v1: Caught and rethrowing ${JSON.stringify(e)} for indata ${JSON.stringify(params, undef_replacer)}. Stack=${(e as Error).stack}`)
            throw e
        }
    }
}
