function View(component) {
    this.subviews = new Array();
    this.proxies = new Array();
    this.component = component;
}

View.prototype.getTag = function () { return this.component.tag };

function ScriptBuilder(tag) {
    this.scriptTag = tag;
}

ScriptBuilder.prototype.component = function (component) {
    ez.components.push(component);
}

ScriptBuilder.prototype.module = function (module) {
    ez.modules.push(module);
}

function Ez(baseDir = "/src/", root = document.body) {
    this.root = root;
    this.components = new Array();
    this.modules = new Array();
    this.baseDir = baseDir;
    /*this.components = {};
    this.baseDir = baseDir;
    this.contexts = {};
    this.context = undefined;*/
}

Ez.prototype.add = function (ref, callback) {
    let script = document.createElement('script');
    script.src = this.baseDir + ref;
    script.onload = function (event) {
        if (event.eventPhase == 2) {
            callback(new ScriptBuilder(script));
        }
    }
    document.body.appendChild(script);
}

Ez.prototype.register = function (componentRef, component) {
    let script = document.createElement('script');
    script.src = this.baseDir + componentRef;
    script.component = component;
    script.componentRef = componentRef;
    script.onload = addComponent;
    document.body.appendChild(script);
}



Ez.prototype.swapContext = function (next) {
    if (!this.context) {
        this.context = { component: next };
    }
    if (!this.contexts[next.name]) {
        this.contexts[next.name] = { component: next };
    }
    if (this.context.component.style.parentNode) {
        this.context.component.style.parentNode.removeChild(this.context.component.style);
    }
    if (this.context.component.tag.parentNode) {
        this.context.component.tag.parentNode.removeChild(this.context.component.tag);
    }
    if (!this.context.keyHandler) {
        this.context.keyHandler = bindKeyHandler(this.context.component);
    }
    this.root.removeEventListener('keydown', this.context.keyHandler);

    this.contexts[this.context.component.name] = this.context;
    this.context = this.contexts[next.name];
    this.root.appendChild(this.context.component.tag);
    document.head.appendChild(this.context.component.style);

    this.root.addEventListener('keydown', this.context.keyHandler);
}

Ez.prototype.updateContext = function (component, exp, value) {
    let text = component.data[exp].raw;
    component.data[exp].raw.match(/(?<=\{\{).+?(?=\}\})/g).forEach(hit => {
        text = text.replace(`{{${hit}}}`, component.data[hit].value);
    });
    component.data[exp].node.nodeValue = text;
}

function bindKeyHandler(component) {
    return function (event) {
        if (component.keys[event.key]) {
            component.keys[event.key](component);
            component.keys['all'](component);
        }
    };
}

function addComponent() {
    var component = eval(this.component);
    component.name = this.component;
    ez.components[component.name] = component;
    loadFile(this.src.substring(0, this.src.lastIndexOf("/") + 1) + component.setting.template, template => {
        component.template = template;
        component.tag = document.createElement(this.component);
        attachDom(component.tag, template);
        adaptAndListen(component);
        loadFile(this.src.substring(0, this.src.lastIndexOf("/") + 1) + component.setting.style, style => {
            component.style = document.createElement('style');
            component.style.innerHTML = this.component + " " + style.replace(" ", "").replace("} ", `} ${this.component} `);
            if (window.location.hash.substring(2) == component.setting.path) {
                ez.swapContext(component);
            }
        });
    });

}

function loadFile(ref, callback) {
    fetch(ref).then(response => {
        response.text().then(content => {
            callback(content);
        });
    });
}

var attachDom = function (tag, dom) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(dom, 'text/html');
    tag.append(...doc.body.childNodes);
};

function adaptAndListen(component) {
    let exp = component.template.match(/(?<=\{\{).+?(?=\}\})/g);
    if (exp) {
        exp.forEach(expression => {
            if (expression.match(/(?<=\[).+?(?=\])/g)) {
                let props = expression.split("[");
                let prop = props[0];
                let index = props[1].replace("]", "");
                if (component[prop] == undefined) {
                    component[prop] = { [index]: component.data[prop][index] };
                    component.data[prop][index] = {
                        value: component.data[prop][index],
                    };
                    Object.defineProperty(component, prop, {
                        get: function () {
                            return component.data[prop][index].value;
                        },
                        set: function (value) {
                            component.data[prop][index].value = value;
                            ez.updateContext(component, prop, value);
                        }
                    });
                }
            } else {
                if (component[expression] == undefined) {
                    component[expression] = component.data[expression];
                    component.data[expression] = {
                        value: component.data[expression],
                    };
                    Object.defineProperty(component, expression, {
                        get: function () {
                            return component.data[expression].value;
                        },
                        set: function (value) {
                            component.data[expression].value = value;
                            ez.updateContext(component, expression, value);
                        }
                    });
                }
            }
        });
        component.tag.querySelectorAll("*").forEach(node => {
            node.childNodes.forEach(childNode => {
                if (childNode.nodeType == Node.TEXT_NODE) {
                    let bindings = childNode.nodeValue.match(/(?<=\{\{).+?(?=\}\})/g);
                    if (bindings) {
                        bindings.forEach(binding => {
                            if (component.data[binding]) {

                                component.data[binding].raw = childNode.nodeValue;
                                component.data[binding].node = childNode;
                                component.data[binding].node.nodeValue = childNode.nodeValue.replace(`{{${binding}}}`, component.data[binding].value);
                                //ez.updateContext(component, binding, component.data[binding].value);
                            }
                        });
                    }
                }
            });
        });
    }
}

window.addEventListener('hashchange', function (event) {
    let path = event.target.location.hash.substring(2);
    for (component in ez.components) {
        component = ez.components[component]
        if (path == component.setting.path) {
            ez.swapContext(component);
            return true;
        }
    }
});

const ez = new Ez();