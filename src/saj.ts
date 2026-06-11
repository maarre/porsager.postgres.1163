import {ReadableStream, ReadableStreamReadResult} from "node:stream/web"
import {getBaseLogger} from './logger'
import {inspect} from 'util'
import {get_type} from "./typing"

const logger = getBaseLogger().child().withContext({'src': 'saj'})

enum State {
    start
    , list
    , list_value_start
    , list_value
    , object
    , property_start
    , property_name
    , property_separator
    , property_value_start
    , property_end
    , string_start
    , string_token
    , string_value
    , string_escape
    , item_separator
    , boolean_value
    , number_value
    , null_value
}

export class ObjectStart  {
    [inspect.custom]() {
        return `ObjectStart {}`
    }
}
export class PropertyStart  {
    public readonly name: string
    constructor(name: string) {
        this.name = name
    }
    [inspect.custom]() {
        return `PropertyStart {${this.name}}`
    }
}
export class StringValue {
    public readonly value: string
    constructor(value: string) {
        this.value = value
    }
    [inspect.custom]() {
        return `StringValue {${this.value}}`
    }
}
export class NumberValue {
    public readonly value: number
    constructor(value: number) {
        this.value = value
    }
    [inspect.custom]() {
        return `NumberValue {${this.value}}`
    }
}
export class BooleanValue {
    public readonly value: boolean
    constructor(value: boolean) {
        this.value = value
    }
    [inspect.custom]() {
        return `BooleanValue {${this.value}}`
    }
}
export class NullValue {
    [inspect.custom]() {
        return `NullValue {}`
    }
}

export class PropertyEnd  {
    [inspect.custom]() {
        return `PropertyEnd {}`
    }
}
export class ObjectEnd  {
    [inspect.custom]() {
        return `ObjectEnd {}`
    }
}
export class ListStart  {
    [inspect.custom]() {
        return `ListStart {}`
    }
}
export class ListEnd {
    [inspect.custom]() {
        return `ListEnd {}`
    }
}
export class NotImplemented  {
    [inspect.custom]() {
        return `NotImplemented {}`
    }
}
export class ErrorState{
    [inspect.custom]() {
        return `ErrorState {}`
    }
}
export class Done{
    [inspect.custom]() {
        return `Done {}`
    }
}

export type ParseOptions = {
    debug: boolean
}

export class SAJ {
    private states: State[] = [State.start]
    private reader: ReadableStreamDefaultReader
    private reader_result: ReadableStreamReadResult<any> | undefined
    private value_buffer: string | null = null
    private value_start: number = -1
    private i: number = 0
    private l: number = 0
    private options: ParseOptions

    constructor(in_stream: ReadableStream, options: ParseOptions = {debug: false}) {
        logger.trace(`constructor() called`)
        this.reader = in_stream.getReader()
        this.options = options
        logger.trace(`constructor() exiting`)
    }

    async read(): Promise<ListStart
        | ListEnd
        | ObjectStart
        | ObjectEnd
        | PropertyStart
        | PropertyEnd
        | StringValue
        | NumberValue
        | BooleanValue
        | NullValue
        | Done
        | ErrorState
        | NotImplemented> {
        logger.trace(`read() called`)
        while (true) {
            const state = this.states[this.states.length - 1]
            if (!this.reader_result || (!this.reader_result.done && this.i >= this.reader_result.value.length)) {
                if (this.reader_result) {
                    // This is not the first buffer we see
                    if (this.value_buffer) {
                        // We have read through a full buffer while gathering a value buffer
                        this.value_buffer = this.value_buffer.concat(this.reader_result.value)
                        this.value_start = 0
                    } else if (this.value_start !== -1) {
                        // Value traverses first buffer boundary
                        this.value_buffer = this.reader_result.value.slice(this.value_start, this.i)
                        this.value_start = 0
                    }
                }
                this.reader_result = await this.reader.read()
                this.l += this.i
                this.i = 0
            }
            if (!this.reader_result) {
                throw new Error('this.reader_result must be something')
            }
            if (this.reader_result.done) {
                logger.trace(`read() exiting, returning Done`)
                return new Done()
            }
            const c = this.reader_result.value[this.i]
            if (this.options.debug) {
                process.stderr.write(c)
            }

            try {
                switch (state) {
                    case State.start: {
                        let start_result = this.handleStartState(c, state)
                        if (start_result) {
                            logger.trace(`read() exiting, returning ${inspect(start_result, false, null, true)}`)
                            return start_result
                        }
                        break
                    }
                    case State.object: {
                        let object_result = this.handleObjectState(c)
                        if (object_result) {
                            logger.trace(`read() exiting, returning ${inspect(object_result, false, null, true)}`)
                            return object_result
                        }
                        break
                    }
                    case State.property_start: {
                        this.handlePropertyStartState()
                        break
                    }
                    case State.string_start: {
                        this.handleStringStartState(c, state, this.reader_result)
                        break
                    }
                    case State.string_token: {
                        this.handleStringTokenState(c, this.reader_result)
                        break
                    }
                    case State.string_escape : {
                        const s = this.states.pop()
                        logger.trace(`Popped state ${s ? State[s] : undefined}`)
                        this.i++
                        break
                    }
                    case State.property_name: {
                        const propertyStart = this.handlePropertyNameState(state);
                        logger.trace(`read() exiting, returning ${inspect(propertyStart, false, null, true)}`)
                        return propertyStart
                    }
                    case State.property_separator: {
                        this.handlePropertySeparatorState(c, state)
                        break
                    }
                    case State.property_value_start: {
                        let property_value_result = this.handlePropertyValueStartState(c, state, this.reader_result)
                        if (property_value_result) {
                            logger.trace(`read() exiting, returning ${inspect(property_value_result, false, null, true)}`)
                            return property_value_result
                        }
                        break
                    }
                    case State.string_value: {
                        const stringValue = this.handleStringValueState(c);
                        logger.trace(`read() exiting, returning ${inspect(stringValue, false, null, true)}`)
                        return stringValue
                    }
                    case State.number_value: {
                        let number_value_result = this.handleNumberValueState(c, this.reader_result)
                        if (number_value_result) {
                            logger.trace(`read() exiting, returning ${inspect(number_value_result, false, null, true)}`)
                            return number_value_result
                        }
                        break
                    }
                    case State.boolean_value: {
                        let boolean_value_result = this.handleBooleanValueState(c, this.reader_result)
                        if (boolean_value_result) {
                            logger.trace(`read() exiting, returning ${inspect(boolean_value_result, false, null, true)}`)
                            return boolean_value_result
                        }
                        break
                    }
                    case State.null_value: {
                        let null_value_result = this.handleNullValueState(c, this.reader_result)
                        if (null_value_result) {
                            logger.trace(`read() exiting, returning ${inspect(null_value_result, false, null, true)}`)
                            return null_value_result
                        }
                        break
                    }
                    case State.property_end: {
                        logger.trace(`read() exiting, returning PropertyEnd`)
                        return this.handlePropertyEndState()
                    }
                    case State.item_separator: {
                        this.handleItemSeparatorState(c, state, this.reader_result)
                        break
                    }
                    case State.list: {
                        let list_result = this.handleListState(c)
                        if (list_result) {
                            logger.trace(`read() exiting returning ListEnd`)
                            return list_result
                        }
                        break
                    }
                    case State.list_value_start: {
                        let list_value_start_result = this.handleListValueStartState(c, state)
                        if (list_value_start_result) {
                            logger.trace(`read() exiting, returning ${inspect(list_value_start_result, false, null, true)}`)
                            return list_value_start_result
                        }
                        break

                    }
                    case State.list_value: {
                        this.handleListValueState()
                        break
                    }
                    default: {
                        logger.trace(`read() exiting, returning NotImplemented`)
                        return new NotImplemented()
                    }
                }
            } catch (e) {
                console.error(`Caugth ${e}, rethrowing. Input <${this.reader_result.value.slice(this.i > 100 ? this.i - 100 : 0, this.i + 1)}>`)
                throw e
            }
        }
    }

    private handleListValueState() {
        logger.trace(`handleListValueState() called`)
        const state = this.states.pop()
        logger.trace(`Popped state ${state ? State[state] : undefined}`)
        logger.trace(`handleListValueState() exiting`)
    }

    private handleListValueStartState(c: any, state: State.list_value_start) {
        logger.trace(`handleListValueStartState() called`)
        let list_value_start_result = null
        const s = this.states.pop()
        logger.trace(`Popped state ${s ? State[s] : undefined}`)
        switch (c) {
            case '"':
                this.states.push(State.item_separator)
                this.states.push(State.list_value)
                this.states.push(State.string_value)
                this.states.push(State.string_token)
                this.states.push(State.string_start)
                break
            case 'n':
                this.states.push(State.item_separator)
                this.states.push(State.null_value)
                break
            case '-':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                this.states.push(State.item_separator)
                this.states.push(State.number_value)
                break

            case '{':
                this.states.push(State.item_separator)
                this.states.push(State.list_value)
                this.states.push(State.object)
                this.i++
                list_value_start_result = new ObjectStart()
                break
            case '[':
                this.states.push(State.item_separator)
                this.states.push(State.list_value)
                this.states.push(State.list)
                this.i++
                list_value_start_result = new ListStart()
                break
            case ']':
                break
            case ' ':
            case '\t':
            case '\n':
            case '\r':
                this.i++
                break
            default:
                throw new Error(`Char ${c.charCodeAt(0).toString(16)} not allowed in state ${State[state]}`)
        }
        logger.trace(`handleListValueStartState() exiting, returning ${inspect(list_value_start_result, false, null, true)}`)
        return list_value_start_result
    }

    private handleListState(c: any) {
        logger.trace(`handleListState() called`)
        let list_result = null
        switch (c) {
            case ']':
                const s = this.states.pop()
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                this.i++
                list_result = new ListEnd()
                break
            default:
                this.states.push(State.list_value_start)
                break
        }
        logger.trace(`handleListState() exiting, returning ${inspect(list_result, false, null, true)}`)
        return list_result
    }

    private handleItemSeparatorState(c: any, state: State.item_separator, stream_reader_result: ReadableStreamReadResult<any>) {
        logger.trace(`handleItemSeparatorState() called`)
        switch (c) {
            case ',':
                const s1 = this.states.pop()
                logger.trace(`Popped state ${s1 ? State[s1] : undefined}`)
                this.i++
                const curr_state = this.states[this.states.length - 1]
                if (curr_state === State.object) {
                    this.states.push(State.property_start)
                } else if (curr_state === State.list) {
                    this.states.push(State.list_value_start)
                } else {
                    throw new Error(`Impossible else state=${State[curr_state]}`)
                }
                break
            case '}':
                const s2 = this.states.pop()
                logger.trace(`Popped state ${s2 ? State[s2] : undefined}`)
                break
            case ']':
                const s3 = this.states.pop()
                logger.trace(`Popped state ${s3 ? State[s3] : undefined}`)
                break
            case ' ':
            case '\t':
            case '\n':
            case '\r':
                this.i++
                break
            default:
                throw new Error(`Char "${c}" not allowed in state ${State[state]}. \n`)
        }
        logger.trace(`handleItemSeparatorState() exiting`)
    }

    private handlePropertyEndState() {
        logger.trace(`handlePropertyEndState() called`)
        const s = this.states.pop()
        logger.trace(`Popped state ${s ? State[s] : undefined}`)
        logger.trace(`handlePropertyEndState() exiting, returning PropertyEnd`)
        return new PropertyEnd()
    }

    private handleNullValueState(c: any, stream_reader_result: ReadableStreamReadResult<any>) {
        logger.trace(`handleNullValueState() called`)
        let null_value_result = null
        switch (c) {
            case 'n':
            case 'u':
            case 'l':
                this.i++
                break
            default:
                const s = this.states.pop()
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                this.setCurrentValue(stream_reader_result)
                null_value_result = new NullValue()
                this.value_buffer = null
                break
        }
        logger.trace(`handleNullValueState() exiting, returning ${inspect(null_value_result, false, null, true)}`)
        return null_value_result
    }

    private handleBooleanValueState(c: any, stream_reader_result: ReadableStreamReadResult<any>) {
        logger.trace(`handleBooleanValueState() called`)
        let boolean_value_result = null
        switch (c) {
            case 't':
            case 'r':
            case 'u':
            case 'e':
            case 'f':
            case 'a':
            case 'l':
            case 's':
                this.i++
                break
            default:
                const s = this.states.pop()
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                this.setCurrentValue(stream_reader_result)
                // This is now working, no need for logging
                // logger.debug(`this.value_buffer=${this.value_buffer}`)
                boolean_value_result = new BooleanValue(Boolean(this.value_buffer === 'true'))
                // logger.debug(`boolean_value_result=${JSON.stringify(boolean_value_result)}`)
                this.value_buffer = null
                break
        }
        logger.trace(`handleBooleanValueState() exiting, returning ${inspect(boolean_value_result, false, null, true)}`)
        return boolean_value_result
    }

    private handleNumberValueState(c: any, stream_reader_result: ReadableStreamReadResult<any>) {
        logger.trace(`handleNumberValueState() called`)
        let number_value_result = null
        switch (c) {
            case '-':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '.':
                this.i++
                break
            default:
                const s = this.states.pop()
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                this.setCurrentValue(stream_reader_result)
                number_value_result = new NumberValue(Number(this.value_buffer))
                this.value_buffer = null
                break
        }
        logger.trace(`handleNumberValueState() exiting, returning ${inspect(number_value_result, false, null, true)}`)
        return number_value_result
    }

    private handleStringValueState(c: any) {
        logger.trace(`handleStringValueState() called`)
        const s = this.states.pop()
        logger.trace(`Popped state ${s ? State[s] : undefined}`)
        // Shave off the last quote from the string
        if (c != '"') {
            throw Error(`Expected quote("), got ${c}`)
        }
        this.i++
        if (this.value_buffer == null) {
            throw new Error('token cannot be null for string value')
        }
        const string_value = new StringValue(JSON.parse(`"${this.value_buffer}"`))
        this.value_buffer = null
        logger.trace(`handleStringValueState() exiting, returning ${inspect(string_value, false, null, true)}`)
        return string_value
    }

    private handlePropertyValueStartState(c: any,
                                              state: State.property_value_start,
                                              stream_reader_result: ReadableStreamReadResult<any>) {
        logger.trace(`handlePropertyValueStartState() called`)
        let property_value_result = null
        switch (c) {
            case '"':
                const s1 = this.states.pop()
                logger.trace(`Popped state ${s1 ? State[s1] : undefined}`)
                this.states.push(State.string_value)
                this.states.push(State.string_token)
                this.states.push(State.string_start)
                break
            case '{':
                const s2 = this.states.pop()
                logger.trace(`Popped state ${s2 ? State[s2] : undefined}`)
                this.states.push(State.object)
                this.i++
                property_value_result = new ObjectStart()
                break
            case '[':
                const s3 = this.states.pop()
                logger.trace(`Popped state ${s3 ? State[s3] : undefined}`)
                this.states.push(State.list)
                this.i++
                property_value_result = new ListStart()
                break
            case '-':
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                const s4 = this.states.pop()
                logger.trace(`Popped state ${s4 ? State[s4] : undefined}`)
                this.states.push(State.number_value)
                this.value_start = this.i
                break
            case 't':
            case 'f':
                const s5 = this.states.pop()
                logger.trace(`Popped state ${s5 ? State[s5] : undefined}`)
                this.states.push(State.boolean_value)
                this.value_start = this.i
                break
            case 'n':
                const s6 = this.states.pop()
                logger.trace(`Popped state ${s6 ? State[s6] : undefined}`)
                this.states.push(State.null_value)
                this.value_start = this.i
                break
            case ' ':
            case '\t':
            case '\n':
            case '\r':
                this.i++
                break
            default:
                // console.debug(this.reader_result.value.slice(0, this.i))
                throw new Error(`Char ${c.charCodeAt(0).toString(16)} not allowed in state ${State[state]}. `)
        }
        logger.trace(`handlePropertyValueStartState() exiting, returning ${inspect(property_value_result, false, null, true)}`)
        return property_value_result
    }

    private handlePropertySeparatorState(c: any, state: State.property_separator) {
        logger.trace(`handlePropertySeparatorState() called`)
        switch (c) {
            case ':':
                const s = this.states.pop()
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                this.i++
                break
            case '"': // Shave off last quote from property string
            case ' ':
            case '\t':
            case '\n':
            case '\r':
                this.i++
                break
            default:
                throw new Error(`Char ${c.charCodeAt(0).toString(16)} not allowed in state ${State[state]}`)
        }
        logger.trace(`handlePropertySeparatorState() exiting`)
    }

    private handlePropertyNameState(state: State.property_name) {
        logger.trace(`handlePropertyNameState() called`)
        const s = this.states.pop()
        logger.trace(`Popped state ${s ? State[s] : undefined}`)
        this.i++
        if (!this.value_buffer) {
            throw new Error(`Null token value in state ${State[state]}`)
        }
        let property_start = new PropertyStart(this.value_buffer)
        this.value_buffer = null
        this.value_start = -1
        logger.trace(`handlePropertyNameState() exiting, returning PropertyStart`)
        return property_start
    }

    private handleStringTokenState(c: any, stream_reader: ReadableStreamReadResult<any>) {
        logger.trace(`handleStringTokenState() called`)
        switch (c) {
            case '"':
                this.setCurrentValue(stream_reader)
                // We cannot increment this.i here since there might be a boundary.
                const s = this.states.pop() // popping myself
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                break
            case '\\':
                this.states.push(State.string_escape)
                this.i++
                break
            default:
                this.i++
        }
        logger.trace(`handleStringTokenState() exiting`)
    }

    private handleStringStartState(c: any, state: State.string_start, stream_reader: ReadableStreamReadResult<any>) {
        logger.trace(`handleStringStartState() called`)
        switch (c) {
            case '"':
                const s = this.states.pop()
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                this.i++
                this.value_start = this.i
                break
            case ' ':
            case '\t':
            case '\n':
            case '\r':
                this.i++
                break
            default:
                throw new Error(`Char "${c}" not allowed in state ${State[state]}, states=${this.states}. \n${stream_reader.value.slice(0, this.i + 1)} `)
        }
        logger.trace(`handleStringStartState() exiting`)
    }

    private handlePropertyStartState() {
        logger.trace(`handlePropertyStartState() called`)
        const s = this.states.pop()
        logger.trace(`Popped state ${s ? State[s] : undefined}`)
        this.states.push(State.item_separator)
        this.states.push(State.property_end)
        this.states.push(State.property_value_start)
        this.states.push(State.property_separator)
        this.states.push(State.property_name)
        this.states.push(State.string_token)
        this.states.push(State.string_start)
        logger.trace(`handlePropertyStartState() exiting`)
    }

    private handleObjectState(c: any) {
        logger.trace(`handleObjectState() called`)
        let object_result = null
        switch (c) {
            case '}':
                const s = this.states.pop()
                logger.trace(`Popped state ${s ? State[s] : undefined}`)
                this.i++
                object_result = new ObjectEnd()
                break
            case ' ':
            case '\t':
            case '\n':
            case '\r':
                this.i++
                break
            default:
                this.states.push(State.property_start)
                break
        }
        logger.trace(`handleObjectState() exiting, returning ${inspect(object_result, false, null, true)}`)
        return object_result
    }

    private handleStartState(c: any, state: State.start) {
        logger.trace(`handleStartState() called`)
        let result = null
        switch (c) {
            case '[':
                this.states.push(State.list)
                this.i++
                result = new ListStart()
                break
            case '{':
                this.states.push(State.object)
                this.i++
                result = new ObjectStart()
                break
            case ' ':
            case '\t':
            case '\n':
            case '\r':
                this.i++
                break
            default:
                throw new Error(`Char ${c.charCodeAt(0).toString(16)} not allowed in state ${State[state]}`)
        }
        logger.trace(`handleStartState() exiting, returning ${inspect(result, false, null, true)}`)
        return result
    }

    private setCurrentValue(reader_result: ReadableStreamReadResult<any>) {
        logger.trace(`setCurrentValue() called`)
        const token: string = reader_result.value.slice(this.value_start, this.i)
        this.value_start = -1
        this.value_buffer = this.value_buffer ? this.value_buffer.concat(token) : token
        logger.trace(`setCurrentValue() exiting`)
    }

    public async readObjectStartOrListEnd() {
        logger.trace(`readObjectStartOrListEnd() called`)
        const object_start = await this.read()
        if (object_start instanceof ListEnd) {
            logger.trace(`readObjectStartOrListEnd() exiting, returning ListEnd`)
            return object_start
        }
        if (!(object_start instanceof ObjectStart)) {
            throw Error(`Expected type ObjectStart, got ${object_start.constructor.name}`)
        }
        logger.trace(`readObjectStartOrListEnd() exiting, returning ObjectStart`)
        return object_start
    }

    public async readObjectStartOrNullOrListEnd() {
        logger.trace(`readObjectStartOrNullOrListEnd() called`)
        const object_start = await this.read()
        if (object_start instanceof ListEnd) {
            logger.trace(`readObjectStartOrNullOrListEnd() exiting, returning ListEnd`)
            return object_start
        }
        if (object_start instanceof NullValue) {
            logger.trace(`readObjectStartOrNullOrListEnd() exiting returning NullValue`)
            return object_start
        }
        if (!(object_start instanceof ObjectStart)) {
            throw Error(`Expected type ObjectStart, got ${object_start.constructor.name}`)
        }
        logger.trace(`readObjectStartOrNullOrListEnd() exiting, returning ObjectStart`)
        return object_start
    }

    public async readObjectStartOrNull() {
        logger.trace(`readObjectStartOrNull() called`)
        const object_start = await this.read()
        if (object_start instanceof NullValue) {
            logger.trace(`readObjectStartOrNull() exiting, returning NullValue`)
            return object_start
        }
        if (!(object_start instanceof ObjectStart)) {
            throw Error(`Expected type ObjectStart, got ${object_start.constructor.name}`)
        }
        logger.trace(`readObjectStartOrNull() exiting, returning ObjectStart`)
        return object_start
    }

    public async readObjectStart() {
        logger.trace(`readObjectStart() called`)
        const object_start = await this.read()
        if (!(object_start instanceof ObjectStart)) {
            throw Error(`Expected type ObjectStart, got ${object_start.constructor.name}`)
        }
        logger.trace(`readObjectStart() exiting, returning ObjectStart`)
        return object_start
    }

    public async readNumberValue(property_name: string) {
        logger.trace(`readNumberValue() called`)
        const property_start = await this.read()
        if (!(property_start instanceof PropertyStart)) {
            throw Error(`Expected type PropertyStart, got ${property_start.constructor.name}`)
        }
        if (property_start.name !== property_name) {
            throw Error(`Expected ${property_name}, got ${property_start.name}`)
        }
        const number_value = await this.read()
        if (!(number_value instanceof NumberValue)) {
            throw Error(`Expected type NumberValue, got ${number_value.constructor.name}`)
        }
        const property_end = await this.read()
        if (!(property_end instanceof PropertyEnd)) {
            throw Error(`Expected type PropertyEnd, got ${property_end.constructor.name}`)
        }
        logger.trace(`readNumberValue() exiting, returning ${inspect(number_value, false, null, true)}`)
        return number_value
    }

    public async readNumberOrNullValue(property_name: string) {
        logger.trace(`readNumberOrNullValue() called`)
        const property_start = await this.read()
        if (!(property_start instanceof PropertyStart)) {
            throw Error(`Expected type PropertyStart, got ${property_start.constructor.name}`)
        }
        if (property_start.name !== property_name) {
            throw Error(`Expected ${property_name}, got ${property_start.name}`)
        }
        const number_value = await this.read()
        if (!(number_value instanceof NumberValue) && !(number_value instanceof NullValue)) {
            throw Error(`Expected type NumberValue or NullValue, got ${number_value.constructor.name}`)
        }
        const property_end = await this.read()
        if (!(property_end instanceof PropertyEnd)) {
            throw Error(`Expected type PropertyEnd, got ${property_end.constructor.name}`)
        }
        logger.trace(`readNumberOrNullValue() exiting, returning ${inspect(number_value, false, null, true)}`)
        return number_value
    }

    public async readBooleanValue(property_name: string) {
        logger.trace(`readBooleanValue() called`)
        await this.readPropertyStart(property_name)
        const boolean_value = await this.read()
        if (!(boolean_value instanceof BooleanValue)) {
            throw Error(`Expected type BooleanValue, got ${boolean_value.constructor.name}`)
        }
        await this.readPropertyEnd()
        logger.trace(`readBooleanValue() exiting, returning ${inspect(boolean_value, false, null, true)}`)
        return boolean_value
    }

    public async readBooleanOrNullValue(property_name: string) {
        logger.trace(`readBooleanOrNullValue() exiting`)
        const property_start = await this.read()
        if (!(property_start instanceof PropertyStart)) {
            throw Error(`Expected type PropertyStart, got ${property_start.constructor.name}`)
        }
        if (property_start.name !== property_name) {
            throw Error(`Expected ${property_name}, got ${property_start.name}`)
        }
        const boolean_value = await this.read()
        if (!(boolean_value instanceof BooleanValue) && !(boolean_value instanceof NullValue)) {
            throw Error(`Expected type BooleanValue or NullValue, got ${boolean_value.constructor.name}`)
        }
        const property_end = await this.read()
        if (!(property_end instanceof PropertyEnd)) {
            throw Error(`Expected type PropertyEnd, got ${property_end.constructor.name}`)
        }
        logger.trace(`readBooleanOrNullValue() exiting, returning ${inspect(boolean_value, false, null, true)}`)
        return boolean_value
    }

    public async readPropertyEnd() {
        logger.trace(`readPropertyEnd() called`)
        const property_end = await this.read()
        if (!(property_end instanceof PropertyEnd)) {
            throw Error(`Expected type PropertyEnd, got ${property_end.constructor.name}`)
        }
        logger.trace(`readPropertyEnd() exiting`)
    }

    public async readPropertyStart(property_name: string) {
        logger.trace(`readPropertyStart() called`)
        const property_start = await this.read()
        if (!(property_start instanceof PropertyStart)) {
            throw Error(`Expected type PropertyStart, got ${property_start.constructor.name}`)
        }
        if (property_start.name !== property_name) {
            throw Error(`Expected ${property_name}, got ${property_start.name}`)
        }
        logger.trace(`readPropertyStart() exiting`)
    }

    public async readStringValue(property_name: string) {
        logger.trace(`readStringValue() called`)
        const property_start = await this.read()
        if (!(property_start instanceof PropertyStart)) {
            throw Error(`Expected type PropertyStart, got ${typeof property_start}`)
        }
        if (property_start.name !== property_name) {
            throw Error(`Expected ${property_name}, got ${property_start.name}`)
        }
        const string_value = await this.read()
        if (!(string_value instanceof StringValue)) {
            logger.error(`this.l = ${this.l}. this.i=${this.i}`)
            logger.error(`this.value_buffer = ${this.value_buffer}`)
            throw Error(`Expected type StringValue for property ${property_name}, got ${typeof string_value}. string_value=${inspect(string_value, false, null, true)}`)
        }
        const property_end = await this.read()
        if (!(property_end instanceof PropertyEnd)) {
            throw Error(`Expected type PropertyEnd, got ${typeof property_end}`)
        }
        logger.trace(`readStringValue() exiting, returning ${inspect(string_value, false, null, true)}`)
        return string_value
    }

    public async readStringOrNullValue(property_name: string) {
        logger.trace(`readStringOrNullValue() called`)
        const property_start = await this.read()
        if (!(property_start instanceof PropertyStart)) {
            throw Error(`Expected type PropertyStart, got ${property_start.constructor.name}`)
        }
        if (property_start.name !== property_name) {
            throw Error(`Expected ${property_name}, got ${property_start.name}`)
        }
        const string_value = await this.read()
        if (!(string_value instanceof StringValue) && !(string_value instanceof NullValue)) {
            throw Error(`Expected type StringValue or NullValue, got ${string_value.constructor.name}`)
        }
        const property_end = await this.read()
        if (!(property_end instanceof PropertyEnd)) {
            throw Error(`Expected type PropertyEnd, got ${property_end.constructor.name}`)
        }
        logger.trace(`readStringOrNullValue() exiting, returning ${inspect(string_value, false, null, true)}`)
        return string_value
    }

    public async readObjectEnd() {
        logger.trace(`readObjectEnd() called`)
        const object_end = await this.read()
        if (object_end instanceof ObjectEnd) {
            logger.trace(`read_object_end() exiting, returning ObjectEnd`)
            return object_end
        }
        if (!(object_end instanceof ObjectStart)) {
            throw Error(`Expected type ObjectEnd, got ${object_end.constructor.name}`)
        }
        logger.trace(`readObjectEnd() exiting, returning ObjectStart`)
        return object_end
    }

    public async readListStart(): Promise<void> {
        logger.trace(`readListStart() called`)
        const list_start = await this.read()
        if (!(list_start instanceof ListStart)) {
            throw Error(`Expected type ListStart, got ${list_start.constructor.name}`)
        }
        logger.trace(`readListStart() exiting`)
    }

    public async readProperty(): Promise<string | ObjectEnd> {
        logger.trace(`readProperty() called`)
        const property_start = await this.read()
        if (property_start instanceof ObjectEnd) {
            logger.trace(`readProperty() exiting returning ObjectEnd`)
            return property_start
        }
        if (!(property_start instanceof PropertyStart)) {
            throw Error(`Expected type PropertyStart, got ${property_start.constructor.name}`)
        }

        logger.trace(`readProperty() exiting returning ${property_start.name}`)
        return property_start.name
    }

    async readObject(): Promise<Record<string, any>|ListEnd> {
        logger.trace(`readObject() called`)
        const record = await this.readJson(true);
        logger.trace(`readObject() exiting`)
        return record
    }

    async readJson(fragment: boolean = false): Promise<Record<string, any>|Array<any>|ListEnd> {
        logger.trace(`readJson() called`)
        let object_stack: Array<any> = new Array<any>()
        logger.debug(`Created object_stack`)
        let property_stack:  Array<string> = new Array<string>()
        logger.debug(`Created property_stack`)
        let token = await this.read()
        if (fragment && token instanceof ListEnd) {
            logger.trace(`readJson() exiting`)
            return token
        }
        while (!(token instanceof Done) && !(token instanceof ErrorState) && !(token instanceof NotImplemented)) {
            //logger.debug(`token = ${get_type(token)}`)
            logger.debug(`${inspect(token, false, null, true)}`)
            if (token instanceof ObjectStart) {
                const result: Record<string, any> = {}
                object_stack.push(result)
                logger.debug(`object_stack.push(${get_type(result)}), size=${object_stack.length}`)
            } else if (token instanceof PropertyStart) {
                const property = (token as PropertyStart).name
                property_stack.push(property)
                logger.debug(`property_stack.push(${get_type(property)}), size=${property_stack.length}`)
            } else if (token instanceof ListStart) {
                object_stack.push([])
                logger.debug(`object_stack.push([]), size=${object_stack.length}`)
            } else if (token instanceof PropertyEnd) {
            } else if (token instanceof ListEnd || token instanceof ObjectEnd) {
                if ( object_stack.length > 0 ) {
                    const current_top = object_stack.pop()
                    logger.debug(`object_stack.pop() = ${get_type(current_top)}, size=${object_stack.length}`)
                    if ( object_stack.length > 0 ) {
                        const stack_top = object_stack[object_stack.length - 1]
                        if (Array.isArray(stack_top)) {
                            const parent = stack_top as any[]
                            logger.debug(`parent.push(current_top))`)
                            parent.push(current_top)
                        } else {
                            const parent: Record<string, any> = stack_top as {}
                            const current_property = property_stack.pop()
                            logger.debug(`property_stack.pop() = ${get_type(current_property)}), size=${property_stack.length}`)
                            if (!current_property) {
                                throw Error(`current_property must be something.`)
                            }
                            parent[current_property] = current_top

                        }
                    }
                    else {
                        logger.trace(`readJson() exiting`)
                        return current_top
                    }
                }
            } else {
                const stack_top = object_stack[object_stack.length - 1]
                if (Array.isArray(stack_top)) {
                    const current_array = stack_top as any[]
                    if (!current_array) {
                        throw Error('current_array must be something!')
                    }
                    if (token instanceof StringValue) {
                        current_array.push((token as StringValue).value)
                    } else if (token instanceof NumberValue) {
                        current_array.push((token as NumberValue).value)
                    } else if (token instanceof BooleanValue) {
                        current_array.push((token as BooleanValue).value)
                    } else { //if ( token instanceof NullValue) {
                        current_array.push(null)
                    }
                } else {
                    const current_object: Record<string, any> = stack_top as {}
                    if (!current_object) {
                        throw Error('current_object must be something!')
                    }
                    const property = property_stack.pop()
                    logger.debug(`property_stack.pop() = ${get_type(property)}), size=${property_stack.length}`)
                    if (!property) {
                        throw Error('property must be something')
                    }
                    if (token instanceof StringValue) {
                        current_object[property] = (token as StringValue).value
                    } else if (token instanceof NumberValue) {
                        current_object[property] = (token as NumberValue).value
                    } else if (token instanceof BooleanValue) {
                        current_object[property] = (token as BooleanValue).value
                    } else { //if ( token instanceof NullValue) {
                        current_object[property] = null
                    }
                }
            }
            token = await this.read()
        }
        if (token instanceof ErrorState || token instanceof NotImplemented) {
            throw Error(`Bad token: ${token.constructor.name}`)
        }
        logger.trace(`readJson() exiting`)
        return object_stack[0]
    }
}
