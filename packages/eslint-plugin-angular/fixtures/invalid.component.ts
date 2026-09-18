import {ChangeDetectionStrategy, Component, computed, EventEmitter, Output, signal} from '@angular/core';

@Component({
    selector: 'app-invalid',
    // @angular-eslint/template/button-has-type (inline template, via processor)
    template: `
        <button (click)="save()">Save</button>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidComponent {
    // @angular-eslint/prefer-output-emitter-ref
    @Output() public readonly saved = new EventEmitter<string>();

    public readonly count = signal(0);

    // @angular-eslint/computed-must-return
    public readonly doubled = computed(() => {
        this.count();
    });

    // @angular-eslint/no-empty-lifecycle-method (and use-lifecycle-interface)
    public ngOnInit(): void {}

    // @angular-eslint/require-lifecycle-on-prototype
    public ngOnDestroy = (): void => {
        this.count();
    };

    public save(): void {
        // typed rule: floating promise, requires type information
        this.load();
    }

    private async load(): Promise<string> {
        return Promise.resolve('data');
    }
}
