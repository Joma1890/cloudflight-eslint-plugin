// minimal shim so the fixtures type-check without installing @angular/core
declare module '@angular/core' {
    export function Component(metadata: Record<string, unknown>): ClassDecorator;
    export enum ChangeDetectionStrategy {
        OnPush = 0,
    }
    export interface OnInit {
        ngOnInit(): void;
    }
    export interface OnDestroy {
        ngOnDestroy(): void;
    }
    export function Output(alias?: string): PropertyDecorator;
    export class EventEmitter<T> {
        public emit(value: T): void;
    }
    export interface Signal<T> {
        (): T;
    }
    export function signal<T>(initialValue: T): Signal<T>;
    export function computed<T>(computation: () => T): Signal<T>;
}
