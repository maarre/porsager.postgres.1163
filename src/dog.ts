import {getBaseLogger} from './logger'
import {Person} from "./person"
import {ListEnd, NumberValue, SAJ} from "./saj"
import {Breed} from "./breed"

const logger = getBaseLogger().child().withContext({'src': 'dog'})

export class Dog {
    name : string
    breed: Breed
    breeder: Person
    owner: Person
    master: Person | null
    mom: Person | null
    applied_subsidy: number
    decided_subsidy: number|null

    public constructor(name: string,
                       breed: Breed,
                       breeder: Person,
                       owner: Person,
                       master: Person|null,
                       mom: Person|null,
                       applied_subsidy: number,
                       decided_subsidy: number|null) {
        this.name = name
        this.breed = breed
        this.breeder = breeder
        this.owner = owner
        this.master = master
        this.mom = mom
        this.applied_subsidy = applied_subsidy
        this.decided_subsidy = decided_subsidy
    }

    public static async read_dog(reader: SAJ): Promise<Dog|ListEnd> {
        const object_start = await reader.readObjectStartOrListEnd()
        if ( object_start instanceof ListEnd ) {
            return object_start
        }
        const name = await reader.readStringValue('name')
        const breed = await Breed.read_breed(reader, 'breed')
        const breeder = await Person.read_mandatory_person(reader, 'breeder')
        const owner = await Person.read_mandatory_person(reader, 'owner')
        const master= await Person.read_optional_person(reader, 'master')
        const mom= await Person.read_optional_person(reader, 'mom')

        const applied_subsidy = await reader.readNumberValue('applied_subsidy')
        const decided_subsidy = await reader.readNumberOrNullValue('decided_subsidy')

        await reader.readObjectEnd()
        const dog = new Dog(name.value,
            breed,
            breeder,
            owner,
            master instanceof Person? master : null,
            mom instanceof Person? mom : null,
            applied_subsidy.value,
            decided_subsidy instanceof NumberValue ? decided_subsidy.value : null)
        return dog
    }

    public static async parse_json_file(reader: SAJ): Promise<Dog[]> {
        let result: Dog[] = []
        await reader.readListStart()
        let dog = await this.read_dog(reader)
        while ( dog instanceof Dog ) {
            logger.debug(`dog=${JSON.stringify(dog)}`)
            result.push(dog)
            dog = await this.read_dog(reader)
        }
        return result
    }

}
