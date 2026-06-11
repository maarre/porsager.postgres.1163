import whyIsNodeRunning from 'why-is-node-running'
import {Command} from "commander"
import {glob} from 'glob'
import {getBaseLogger} from './logger'
import {dog_subsidy} from "./helpers"
import {import_dogs} from "./importdog"
import {LogLevel} from 'loglayer'

const logger = getBaseLogger().child().withContext({src:`main`})

export const DOGS_DISCOVERY_PATTERN = /^.*dog.*\.json$/
export async function main() {
    const level_description = 'Logging level (fatal, error, warn, info, debug, trace)'
    const program = new Command()
    program.version('1.0.0')
        .description('Command line interface for dog subsidy import.')
        .option('-l, --level <level>', level_description, 'info')
        .option('-p, --print', 'Print parsed input files only', false)
        .argument('<files...>', 'Json indata files to process.')
        .action(async function (command_line_files, options) {
            getBaseLogger().setLevel(options.level)
            logger.debug(`options: ${JSON.stringify(options)}`)
            let input_files: string[] = []
            for (const command_line_file of command_line_files) {
                // We are globbing here in order to allow debugging. Globbing is probably already done
                // by the shell.
                let globbed_files = await glob.glob(command_line_file)
                for (const file of globbed_files) {
                    if (DOGS_DISCOVERY_PATTERN.test(file)) {
                        input_files.push(file)
                    } else {
                        console.warn(`Cannot process file ${file}`)
                    }
                }
            }
            let results =
                await Promise.all(input_files.map(async (file: string) => {return import_dogs(file, options.print)}))
            await dog_subsidy.end()  // Closing connections so that the program can exit
            const failed_files = results.filter(result => result !== null)
            for ( let failed of failed_files ) {
                logger.error(`Failed importing dogs file ${failed}`)
            }
            const debug_enabled = getBaseLogger().getLogLevelManager().isLevelEnabled(LogLevel.debug)
            if ( !options.print && failed_files.length === 0 && debug_enabled) {
                logger.debug('Calling whyiIsNodeRunning')
                await new Promise(r => setTimeout(r, 1000 )) // Wait some for timeouts
                whyIsNodeRunning(logger)
            }
            else {
                logger.debug('Not calling whyiIsNodeRunning')
            }
            if ( failed_files.length != 0 ) {
                logger.error(`failed_files.length=${failed_files.length}. calling process.exit(1)`)
                process.exit(1)
            }
        })

    program.parse()
}

await main()