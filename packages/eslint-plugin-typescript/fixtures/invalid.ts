async function fetchData(): Promise<string> {
    return Promise.resolve('data');
}

export function run(element: HTMLElement): void {
    // typed rule: only detectable with type information (@typescript-eslint/no-floating-promises)
    fetchData();

    // custom rule (@cloudflight/typescript/no-on-event-assign)
    element.onclick = (): void => {};
}

// core rule (no-var)
var legacy = 'old';

export {legacy};
