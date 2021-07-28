function View(controller, script) {
    this.subviews = new Array();
    this.proxies = new Array();
    this.context = { controller: controller, script: script, bindings: [], listeners: {} };
}

function ScriptBuilder(element) {
    this.element = element;
}

ScriptBuilder.prototype.controller = function (controller) {
    let view = new View(controller, this.element);
    ez.views[controller.setting.tag] = view;
    ez.load(view, ez.discoverProxies, ez.attachProxies);
}

ScriptBuilder.prototype.module = function (module) {
    ez.modules.push(module);
}

function Ez(baseDir = "/src/", root = document.body) {
    this.root = root;
    this.views = new Array();
    this.modules = new Array();
    this.baseDir = baseDir;
    this.activeView = undefined;
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

Ez.prototype.load = function (view, ...then) {
    let ref = view.context.script.src;
    ref = ref.substring(0, ref.lastIndexOf("/") + 1) + view.context.controller.setting.template;
    fetch(ref).then(response => response.text().then(template => {
        view.context.template = template;
        view.context.html = document.createElement(view.context.controller.setting.tag);
        view.context.html.append(...(new DOMParser().parseFromString(template, 'text/html')).body.childNodes);
        view.context.listeners.keys = {
            type: "keydown",
            action: event => {
                if (this.activeView.context.controller.keys[event.key]) {
                    this.activeView.context.controller.keys[event.key](this.activeView.context.controller);
                    this.activeView.context.controller.keys['all'](this.activeView.context.controller);
                }
            }
        }
        then.forEach(invocation => invocation(view));
        if (window.location.hash == view.context.controller.setting.path) {
            this.activeView = view;
            ez.changeView(view);
        }
    }));
}

Ez.prototype.changeView = function (view) {
    if (this.activeView.context.html.parentNode) {
        this.activeView.context.html.parentNode.removeChild(this.activeView.context.html);
    }

    this.root.removeEventListener(this.activeView.context.listeners.keys.type, this.activeView.context.listeners.keys.action)

    this.activeView = view;
    this.root.appendChild(view.context.html);

    this.root.addEventListener(this.activeView.context.listeners.keys.type, this.activeView.context.listeners.keys.action)
}


Ez.prototype.refresh = function (binding) {
    binding.nodes.forEach(node => {
        let expressions = binding.raw.match(/(?<=\{\{).+?(?=\}\})/g);
        let nodeContent = binding.raw;
        expressions.forEach(expression => {
            nodeContent = nodeContent.replace(`{{${expression}}}`, this.activeView.context.controller[expression]);
        });
        node.nodeValue = nodeContent
    });
}

Ez.prototype.discoverProxies = function (view) {
    view.context.html.querySelectorAll('*').forEach(node => {
        node.childNodes.forEach(childNode => {
            if (childNode.nodeType == Node.TEXT_NODE) {
                let bindings = childNode.nodeValue.match(/(?<=\{\{).+?(?=\}\})/g);
                let rawContent = childNode.nodeValue;
                if (bindings) {
                    bindings.forEach(binding => {
                        if (!view.context.bindings[binding]) {
                            let value = view.context.controller.data[binding]
                            if (binding.includes(".")) {
                                let seperations = binding.split(".");
                                value = view.context.controller.data[seperations[0]][seperations[1]];
                                for (let i = 2; i < seperations.length; i++) {
                                    value = value[seperations[i]];
                                }
                            }
                            view.context.bindings[binding] = {
                                nodes: [],
                                value: value,
                                raw: rawContent
                            }
                        }
                        view.context.bindings[binding].nodes.push(childNode);
                        childNode.nodeValue = childNode.nodeValue.replace(`{{${binding}}}`, view.context.bindings[binding].value);
                    });
                }
            }
        });
    });
}

Ez.prototype.attachProxies = function (view) {
    view.context.controller.component = new Proxy(view.context.controller.data, {
        get: function (target, prop, receiver) {
            return target[prop];
        },
        set: function (obj, prop, newval) {
            obj[prop] = newval;
            ez.refresh(view.context.bindings[prop]);
            return true;
            //controller.data[prop][index].value = value;
            //ez.updateContext(controller, prop, value);
        }
    });
    console.log(view.context.controller.component);
}

function addcontroller() {
    var controller = eval(this.controller);
    controller.name = this.controller;
    ez.controllers[controller.name] = controller;
    loadFile(this.src.substring(0, this.src.lastIndexOf("/") + 1) + controller.setting.template, template => {
        controller.template = template;
        controller.tag = document.createElement(this.controller);
        attachDom(controller.tag, template);
        adaptAndListen(controller);
        loadFile(this.src.substring(0, this.src.lastIndexOf("/") + 1) + controller.setting.style, style => {
            controller.style = document.createElement('style');
            controller.style.innerHTML = this.controller + " " + style.replace(" ", "").replace("} ", `} ${this.controller} `);
            if (window.location.hash.substring(2) == controller.setting.path) {
                ez.swapContext(controller);
            }
        });
    });

}

window.addEventListener('hashchange', function (event) {
    let path = event.target.location.hash.substring(2);
    for (view in ez.views) {
        if (path == view.context.controller.setting.path) {
            ez.changeView(view);
            return true;
        }
    }
});
