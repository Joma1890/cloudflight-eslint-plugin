async function fetchData(): Promise<string> {
    return Promise.resolve('data');
}

export function run(element: HTMLElement): void {
    // @typescript-eslint/no-floating-promises, needs type information
    fetchData();

    // @cloudflight/typescript/no-on-event-assign
    element.onclick = (): void => {};
}

// no-var
var legacy = 'old';

// import-x/no-mutable-exports
export let counter = 0;

export {legacy};
