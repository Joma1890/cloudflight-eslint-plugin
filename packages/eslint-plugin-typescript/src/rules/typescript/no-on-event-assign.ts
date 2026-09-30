import type {TSESTree} from '@typescript-eslint/utils';

import {createRule} from '../../util/create-rule';

const disallowedEvents = [
    'onabort',
    'onanimationcancel',
    'onanimationend',
    'onanimationiteration',
    'onanimationstart',
    'onauxclick',
    'onbeforeinput',
    'onblur',
    'oncancel',
    'oncanplay',
    'oncanplaythrough',
    'onchange',
    'onclick',
    'onclose',
    'oncontextmenu',
    'oncuechange',
    'ondblclick',
    'ondrag',
    'ondragend',
    'ondragenter',
    'ondragleave',
    'ondragover',
    'ondragstart',
    'ondrop',
    'ondurationchange',
    'onemptied',
    'onended',
    'onerror',
    'onfocus',
    'onformdata',
    'ongotpointercapture',
    'oninput',
    'oninvalid',
    'onkeydown',
    'onkeypress',
    'onkeyup',
    'onload',
    'onloadeddata',
    'onloadedmetadata',
    'onloadstart',
    'onlostpointercapture',
    'onmousedown',
    'onmouseenter',
    'onmouseleave',
    'onmousemove',
    'onmouseout',
    'onmouseover',
    'onmouseup',
    'onpause',
    'onplay',
    'onplaying',
    'onpointercancel',
    'onpointerdown',
    'onpointerenter',
    'onpointerleave',
    'onpointermove',
    'onpointerout',
    'onpointerover',
    'onpointerup',
    'onprogress',
    'onratechange',
    'onreset',
    'onresize',
    'onscroll',
    'onsecuritypolicyviolation',
    'onseeked',
    'onseeking',
    'onselect',
    'onselectionchange',
    'onselectstart',
    'onslotchange',
    'onstalled',
    'onsubmit',
    'onsuspend',
    'ontimeupdate',
    'ontoggle',
    'ontouchcancel',
    'ontouchend',
    'ontouchmove',
    'ontouchstart',
    'ontransitioncancel',
    'ontransitionend',
    'ontransitionrun',
    'ontransitionstart',
    'onvolumechange',
    'onwaiting',
    'onwebkitanimationend',
    'onwebkitanimationiteration',
    'onwebkitanimationstart',
    'onwebkittransitionend',
    'onwheel',
];

function assignedPropertyName(member: TSESTree.MemberExpression): string | undefined {
    if (!member.computed && member.property.type === 'Identifier') {
        return member.property.name;
    }

    // dynamic keys cannot be resolved statically, only string literals are checked
    if (member.computed && member.property.type === 'Literal' && typeof member.property.value === 'string') {
        return member.property.value;
    }

    // a template literal without expressions is a constant key as well
    if (member.computed && member.property.type === 'TemplateLiteral' && member.property.expressions.length === 0) {
        return member.property.quasis[0]?.value.cooked ?? undefined;
    }

    return undefined;
}

export const NoOnEventAssignName = 'no-on-event-assign';
/**
 * Comment needed to prevent type declaration generation, which is broken.
 * @internal
 */
export const NoOnEventAssign = createRule<[], 'noAssign'>({
    name: NoOnEventAssignName,
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallows assigning event handlers to `on*` properties, use `addEventListener` instead.',
        },
        schema: [],
        messages: {
            noAssign: 'Directly assigning to the `on` events is not recommended. Use `addEventListener` instead.',
        },
    },
    defaultOptions: [],
    create(context) {
        return {
            AssignmentExpression(node) {
                if (node.left.type !== 'MemberExpression') {
                    return;
                }

                const name = assignedPropertyName(node.left);

                if (name !== undefined && disallowedEvents.includes(name)) {
                    context.report({node, messageId: 'noAssign'});
                }
            },
        };
    },
});
