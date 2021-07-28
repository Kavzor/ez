
const PrimaryController = (function () {
    const setting = {
        tag: "primary",
        template: "primary-page.html",
        style: "primary-style.css",
        path: ""
    };

    const keys = {
        'ArrowLeft': () => { statements[statements.length - 1].state = 'positive'; },
        'ArrowRight': () => { statements[statements.length - 1].state = 'negative'; },
        'ArrowDown': () => { statements[statements.length - 1].state = 'neutral'; },
        'all': function (component) {
            component.statements = 3;
            component.added = 2;
            console.log(component);
            component.test[0] = 3;
            /*sortedStatements.push(statements.pop());
            component.added = sortedStatements.length; //statements.reduce(function (n, statement) { return n + (statement.state != undefined) }, 0);
            component.statement = statements[statements.length - 1].text;
            component.selected = statements[statements.length - 1].id;*/
        }
    };

    let component = function () { }

    let data = {
        statement: statements[0],
        statments: statements.length,
        added: 0, //statements.filter(s => { return s.state != undefined }).length
        test: [2, 2, 3]
    };

    return {
        setting: setting,
        component: component,
        data: data,
        keys: keys
    };
})();