// Created from template  begin

import postgres from 'postgres'
import prexit from 'prexit'
import os from 'node:os'
import {getBaseLogger} from './logger'
import {get_type} from './typing'
import {PostgresError} from "postgres"


const plogger = getBaseLogger().child().withContext({'src': 'postgres'})
const logger = getBaseLogger().child().withContext({'src': 'helpers'})

function postgres_logger(connection : Number, query: string, params: string[], types: string[]): void {
    const logger = plogger.withMetadata({connection: connection, params: JSON.stringify(params), types: JSON.stringify(types)})
    logger.debug(`Executing sql: ${query}`)
}

export const dog_subsidy = postgres({
            user: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'dog_subsidy',
            max: os.cpus().length,
            debug: postgres_logger
        }) // will use psql environment variables

// export default dog_subsidy

// Why is this here?
prexit(async () => {
})

// Helper class for cursor function return values
export type RowTypeUnion = string|number|boolean|Date|null
export interface IfsCursorReturnValue {
    columns_: Array<string>
    types_: Array<string>
    rows_: Array<Array<RowTypeUnion>>
}

export class CursorReturnValue implements IfsCursorReturnValue {
    columns_: Array<string>
    types_: Array<string>
    rows_: Array<Array<RowTypeUnion>>
    constructor(columns: Array<string>, types: Array<string>, rows: Array<Array<RowTypeUnion>>) {
        this.columns_ = columns
        this.types_ = types
        this.rows_ = rows
    }
}

export const undef_replacer = (key: string, value: any) => {
    return value === undefined ? 'undefined' : value
}

export class UserError {
    message: string
    constructor(message: string) {
        this.message = message
    }
}

export function get_user_error(e: any) : UserError | null {
    const type = get_type(e)
    logger.debug(`type=${type}`)
    if ( type === 'PostgresError') {
        const e2 = e as PostgresError
        logger.debug(`e2=${JSON.stringify(e2)}`)
        if ( e2.code === '22003' || e2.code === '22P02' ) {
            logger.debug(`e2.code=${JSON.stringify(e2.code)}`)
            const base = e2.toString().replace('PostgresError: ', '')
            logger.debug(`base=${base}`)
            const detail = e2.detail
            return new UserError(detail ? detail : base.charAt(0).toUpperCase() + base.slice(1))
        }
    }
    return null
}

// Created from template  end