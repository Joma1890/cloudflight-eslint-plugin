import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
    selector: 'app-invalid',
    // @angular-eslint/template/button-has-type (inline template, via processor)
    template: `
        <button (click)="save()">Save</button>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvalidComponent {
    // @angular-eslint/no-empty-lifecycle-method (and use-lifecycle-interface)
    public ngOnInit(): void {}

    public save(): void {
        // typed rule: floating promise, requires type information
        this.load();
    }

    private async load(): Promise<string> {
        return Promise.resolve('data');
    }
}
