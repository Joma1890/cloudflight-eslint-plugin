import {RuleTester} from '@typescript-eslint/rule-tester';
import {AST_NODE_TYPES} from '@typescript-eslint/utils';

import {NoOnEventAssign, NoOnEventAssignName} from './no-on-event-assign';

const ruleTester = new RuleTester();

ruleTester.run(NoOnEventAssignName, NoOnEventAssign, {
    valid: [
        "target.addEventListener('click', () => {})",
        'count = 1',
        'target.title = "no event"',
    ],
    invalid: [
        {
            code: 'target.onclick = function(){}',
            errors: [{type: AST_NODE_TYPES.AssignmentExpression, messageId: 'noAssign'}],
        },
        {
            code: 'target.onclick = () => {}',
            errors: [{type: AST_NODE_TYPES.AssignmentExpression, messageId: 'noAssign'}],
        },
        {
            code: 'target.onclick = undefined',
            errors: [{type: AST_NODE_TYPES.AssignmentExpression, messageId: 'noAssign'}],
        },
    ],
});
