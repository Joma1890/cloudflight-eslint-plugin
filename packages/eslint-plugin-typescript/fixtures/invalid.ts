async function fetchData(): Promise<string> {
    return Promise.resolve('data');
}

export function run(element: HTMLElement, userInput: string): void {
    // typed rule: only detectable with type information (@typescript-eslint/no-floating-promises)
    fetchData();

    // security rule (no-unsanitized/property)
    element.innerHTML = userInput;

    // custom rule (@cloudflight/typescript/no-on-event-assign)
    element.onclick = (): void => {};
}

// core rule (no-var)
var legacy = 'old';

export {legacy};
