import {type JSX, useState} from 'react';

export function BrokenList(props: {items: string[]; eager: boolean}): JSX.Element {
    if (props.eager) {
        useState('');
        Promise.resolve('data');
    }
    return <ul>{props.items.map((item) => <li>{item}</li>)}<img src="logo.png" /></ul>;
}
