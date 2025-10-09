import { rootQuestion } from "./questions";
import { QuestionRenderer } from "./questionRenderer";
import { buildNetwork, NetworkContext } from "./networkBuilder";
import { validateContext } from "./networkValidator";
import yargs = require('yargs/yargs');
import chalk from "chalk";

export async function main(): Promise<void> {
    if (process.platform === "win32") {
        console.error(chalk.red(
            "Unfortunately this tool is not compatible with Windows at the moment.\n" +
            "We recommend running it under Windows Subsystem For Linux 2 with Docker Desktop.\n" +
            "Please visit the following pages for installation instructions.\n\n" +
            "https://docs.microsoft.com/en-us/windows/wsl/install-win10\n" +
            "https://docs.docker.com/docker-for-windows/wsl/"
        ));
        process.exit(1);
    }

    let answers = {};

    if(process.argv.slice(2).length > 0){
            const args = await yargs(process.argv.slice(2)).options({
                clientType: { type: 'string', demandOption: true, choices:['besu','goquorum'], describe: 'Ethereum client to use.' },
                privacy: { type: 'boolean', demandOption: true, default: false, describe: 'Enable support for private transactions' },
                monitoring: { type: 'string', demandOption: false, default: 'loki', choices: ['loki','splunk','elk'], describe: 'Monitoring / logging stack selection.' },
                blockscout: { type: 'boolean', demandOption: false, default: false, describe: 'Enable Blockscout explorer.' },
                chainlens: { type: 'boolean', demandOption: false, default: false, describe: 'Enable Chainlens explorer.' },
                outputPath: { type: 'string', demandOption: false, default: './quorum-test-network', describe: 'Location for config files.'},
                genesisPreset: { type: 'string', demandOption: false, choices: ['dev','ibft','qbft','clique'], describe: 'Genesis configuration preset (Phase 1 experimental).'},
                validators: { type: 'number', demandOption: false, default: 4, describe: 'Validator node count (consensus dependent).'},
                participants: { type: 'number', demandOption: false, default: 3, describe: 'Non-validator participant node count.'},
                chainId: { type: 'number', demandOption: false, describe: 'Explicit Chain ID override.' },
            consensus: { type: 'string', demandOption: false, choices: ['ibft','qbft','clique','ethash'], describe: 'Consensus mechanism selection (overrides preset if set).'},
                    azureDeploy: { type: 'boolean', demandOption: false, default: false, describe: 'Trigger Azure infra scaffold generation (experimental).'},
                    azureRegion: { type: 'string', demandOption: false, describe: 'Azure region for deployment scaffold (e.g. eastus).'},
                    cloudflareZone: { type: 'string', demandOption: false, describe: 'Cloudflare DNS zone (e.g. example.com).'},
                    cloudflareApiTokenEnv: { type: 'string', demandOption: false, describe: 'Environment variable name that will contain Cloudflare API token.'},
                    validate: { type: 'boolean', demandOption: false, default: false, describe: 'Validate configuration only (no files written if validation fails).' }
            }).argv;

            answers = {
                clientType: args.clientType,
                outputPath: args.outputPath,
                monitoring: args.monitoring,
                blockscout: args.blockscout,
                chainlens: args.chainlens,
                privacy: args.privacy,
                genesisPreset: args.genesisPreset,
                validators: args.validators,
                participants: args.participants,
                chainId: args.chainId,
                consensus: args.consensus
                    ,azureDeploy: args.azureDeploy
                    ,azureRegion: args.azureRegion
                    ,cloudflareZone: args.cloudflareZone
                    ,cloudflareApiTokenEnv: args.cloudflareApiTokenEnv
            };

    } else{
      const qr = new QuestionRenderer(rootQuestion);
      answers = await qr.render();
    }

    const validateFlag = (answers as { validate?: boolean }).validate === true;
    if (validateFlag) {
        const result = validateContext(answers as Partial<NetworkContext>);
        if (!result.valid) {
            const detail = result.issues.map(i => ` - ${i.field ?? 'unknown'}: ${i.message}`).join('\n');
            console.error(`Configuration validation failed:\n${detail}`);
            process.exit(1);
        }
        console.log("Configuration validation succeeded.");
    }

    await buildNetwork(answers as NetworkContext);
    setTimeout(() => {
        process.exit(0);
    }, 500);
}

if (require.main === module) {
    // note: main returns a Promise<void>, but we don't need to do anything
    // special with it, so we use the void operator to indicate to eslint that
    // we left this dangling intentionally...
    try {
        void main();
    } catch (err) {
        const e = err as { stack?: string; message?: string } | undefined;
        if (e?.stack && process.argv.length >= 3 && process.argv[2] === "--stackTraceOnError") {
            console.error(`Fatal error: ${e.stack}`);
        } else if (e?.message) {
            console.error(`Fatal error: ${e.message}`);
        } else if (err) {
            console.error(`Fatal error: ${String(err)}`);
        } else {
            console.error("Fatal error: unknown");
        }
        process.exit(1);
    }
}
