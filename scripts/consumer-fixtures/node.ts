import {readFileSync} from 'node:fs';

export function load(): string {
    Promise.resolve('data');
    return readFileSync('config.json', 'utf8');
}
