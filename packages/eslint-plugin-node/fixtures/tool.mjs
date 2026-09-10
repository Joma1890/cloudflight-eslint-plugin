import {readFileSync} from 'node:fs';

// a synchronous call in a javascript tooling file must not crash the run
export const config = readFileSync('config.json', 'utf8');
