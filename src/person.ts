import {getBaseLogger} from './logger'
import {
    BooleanValue,
    Done,
    ErrorState,
    ListEnd,
    ListStart,
    NotImplemented, NullValue,
    NumberValue,
    ObjectEnd,
    ObjectStart, ParseOptions,
    PropertyEnd,
    PropertyStart,
    SAJ,
    StringValue
} from "./saj"

const logger = getBaseLogger()

export class Person {
    social_security_number : string
    first_name : string
    last_name : string
    gender: string

    public constructor(social_security_number: string, first_name: string, last_name: string, gender: string) {
        this.social_security_number = social_security_number
        this.first_name = first_name
        this.last_name = last_name
        this.gender = gender
    }

    public static async read_person(reader: SAJ, property_name : string | null = null): Promise<NullValue|Person|ListEnd> {
        if ( property_name ) {
            await reader.readPropertyStart(property_name)
            const object_start = await reader.readObjectStartOrNull()
            if ( object_start instanceof NullValue ) {
                await reader.readPropertyEnd()
                return object_start
            }
        }
        else {
            const object_start = await reader.readObjectStartOrListEnd()
            if ( object_start instanceof ListEnd ) {
                return object_start
            }
        }
        const social_security_number =
            await reader.readNumberValue('social_security_number')

        const first_name = await reader.readStringValue('first_name')
        const last_name = await reader.readStringValue('last_name')
        const gender = await reader.readStringValue('gender')
        await reader.readObjectEnd()
        if ( property_name ) {
            await reader.readPropertyEnd()
        }

        return new Person(social_security_number.value.toString(), first_name.value, last_name.value, gender.value)
    }

    public static async read_list_person(reader: SAJ): Promise<Person|ListEnd> {
        const person = await this.read_person(reader)
        if ( person instanceof NullValue ) {
            throw new Error(`Expected Person or ListEnd, got ${person.constructor.name}`)
        }
        return person
    }

    public static async read_optional_person(reader: SAJ, property_name : string): Promise<Person|NullValue> {
        const person = await this.read_person(reader, property_name)
        if ( person instanceof ListEnd)  {
            throw new Error(`Expected Person, got ${person.constructor.name}`)
        }
        return person
    }

    public static async read_mandatory_person(reader: SAJ, property_name : string): Promise<Person> {
        const person = await this.read_person(reader, property_name)
        if ( !(person instanceof Person) ) {
            throw new Error(`Expected Person, got ${person.constructor.name}`)
        }
        return person
    }

    public static async parse_json_file(reader: SAJ): Promise<Person[]> {
        let result: Person[] = []
        await reader.readListStart()
        let person = await this.read_list_person(reader)
        while ( person instanceof Person ) {
            result.push(person)
            person = await this.read_list_person(reader)
        }
        return result
    }
}
