import {LogLayer, BlankTransport} from 'loglayer'
import {OneWayLogLevelManager} from '@loglayer/log-level-manager-one-way'
import * as util from "node:util"

const default_logging_level: any = process.env.NODE_LOGGING_LEVEL ? process.env.NODE_LOGGING_LEVEL : 'info'
const baselogger = new LogLayer({
    transport: new BlankTransport({
        shipToLogger: ({logLevel, messages, data, hasData}) => {
            const level = logLevel.padEnd(5)
            process.stderr.write(util.formatWithOptions({ colors: true },`\n[${level}] [${new Date().toISOString()}]`, ...messages, data && hasData ? data : ''))
            // Return value is used for debugging when consoleDebug is enabled
            return messages
        }
    })
}).withLogLevelManager(new OneWayLogLevelManager()).setLevel(default_logging_level)

export function getBaseLogger(): LogLayer {
    return baselogger
}
