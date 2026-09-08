declare const value: any;

export function start(): string {
    // typed rule: only detectable with type information (@typescript-eslint/no-unsafe-member-access)
    value.start();

    return value.name;
}
