import {Dog} from "./dog"
import {
    PersonParamsSpFirstnamesCreateV1,
    sp_firstnames_create_v1
} from "./personwrapper"
import {getBaseLogger} from "./logger"

import {dog_subsidy, UserError} from "./helpers"
import {SAJ} from "./saj"
import fs from "fs"
import {Readable} from "node:stream"
import {v4 as uuidv4} from 'uuid'

const logger = getBaseLogger().child().withContext({src:'importdog'})

export async function import_dogs(file: string, print: boolean): Promise<string | null> {
    logger.info(`Processing file ${file}`)
    // https://github.com/nodejs/node/issues/58397
    // https://github.com/nodejs/node/issues/46347
    const fs_read_stream = fs.createReadStream(file, 'utf8')
    const web_read_stream =
        Readable.toWeb(fs_read_stream, {strategy: new CountQueuingStrategy({ highWaterMark: 100 })})
    //const web_read_stream = Readable.toWeb(fs_read_stream)
    const saj = new SAJ(web_read_stream)
    await saj.readListStart()
    let dog = await Dog.read_dog(saj)
    let success = true
    while ( dog instanceof Dog && success ) {
        logger.debug(`Dog=${JSON.stringify(dog)}`)
        if ( print ) {
            console.log(dog)
        }
        else {
            success = await import_dog(dog)
        }
        dog = await Dog.read_dog(saj)
    }
    logger.info(success ? `Done processing file ${file}` : `Failed processing file ${file}`)
    return success? null: file
}

const RETRIES = 17

export async function import_dog(dog: Dog): Promise<boolean> {
    let retries_left = RETRIES
    let error: string | null = null
    while ( retries_left > 0 ) {
        try {
            await dog_subsidy.begin(async conn => {
                const breeder_first_name =
                    new PersonParamsSpFirstnamesCreateV1(dog.breeder.first_name, undefined)
                const breeder_first_name_pk = await sp_firstnames_create_v1(breeder_first_name, uuidv4(), conn)
                if ( breeder_first_name_pk instanceof UserError ) {
                    throw new Error("Bad input")
                }

                const owner_first_name =
                    new PersonParamsSpFirstnamesCreateV1(dog.owner.first_name, undefined)
                const owner_first_name_pk = await sp_firstnames_create_v1(owner_first_name, uuidv4(), conn)
                if ( owner_first_name_pk instanceof UserError ) {
                    throw new Error("Bad input")
                }

                if ( dog.mom ) {
                    const mom_first_name =
                        new PersonParamsSpFirstnamesCreateV1(dog.mom.first_name, undefined)
                    const mom_first_name_pk = await sp_firstnames_create_v1(mom_first_name, uuidv4(), conn)
                    if ( mom_first_name_pk instanceof UserError ) {
                        throw new Error("Bad input")
                    }
                }

                if ( dog.master ) {
                    const master_first_name =
                        new PersonParamsSpFirstnamesCreateV1(dog.master.first_name, undefined)
                    const master_first_name_pk = await sp_firstnames_create_v1(master_first_name, uuidv4(), conn)
                    if ( master_first_name_pk instanceof UserError ) {
                        throw new Error("Bad input")
                    }
                }

                if ( retries_left != RETRIES) {
                    logger.warn(`Recovered after ${RETRIES-retries_left} retries from ${error}. `)
                }

                retries_left = 0
            })
        }
        catch (e) {
            error = (e as Error).message
            retries_left -= 1
            if (retries_left == 0) {
                logger.error(`${e}. dog = ${JSON.stringify(dog, function(k, v) { return v === undefined ? 'undefined' : v; })}. Retries = "${retries_left}". Aborting. Stack: "${(e as Error).stack}". `)
                return false
            }
            await new Promise(r => setTimeout(r, 100 * Math.random())) // Wait some if there is a race condition
        }
    }
    return true

}