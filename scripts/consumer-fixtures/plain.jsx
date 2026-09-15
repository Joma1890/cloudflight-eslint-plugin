import {join} from 'node:path';

export class Box {
    render() {
        return <div title={join('a', 'b')} />;
    }
}
