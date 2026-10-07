import { execute } from '../src/cli.js';

await execute(process.argv.slice(2), { targetOptions: { refreshRemote: false } });
