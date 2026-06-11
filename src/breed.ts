import {SAJ} from "./saj"

export class Breed {
    breed: string
    approved: boolean
    standard_subsidy: number

    public constructor(breed: string, approved: boolean, standard_subsidy: number) {
        this.breed = breed
        this.approved = approved
        this.standard_subsidy = standard_subsidy
    }

    public static async read_breed(reader: SAJ, property_name: string | null = null): Promise<Breed> {
        if (property_name) {
            await reader.readPropertyStart(property_name)
        }
        await reader.readObjectStart()
        const breed = await reader.readStringValue('breed')
        const approved = await reader.readBooleanValue('approved')
        const standard_subsidy = await reader.readNumberValue('standard_subsidy')
        await reader.readObjectEnd()
        if (property_name) {
            await reader.readPropertyEnd()
        }

        return new Breed(breed.value, approved.value, standard_subsidy.value)
    }

}