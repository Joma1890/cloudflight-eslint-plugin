import {ChangeDetectionStrategy, Component, signal} from '@angular/core';

@Component({
    selector: 'app-invalid',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '<button>Go</button>',
})
export class InvalidComponent {
    public ready = signal(false);
    public async ngOnInit(): Promise<void> {
        if (!this.ready) {
            Promise.resolve('data');
        }
        await Promise.resolve();
    }
}
