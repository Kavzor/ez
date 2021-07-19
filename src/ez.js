function Ez(baseDir = "/src/components/") {
    this.root = document.querySelector('#root');
    this.root = this.root != undefined ? this.root : document.querySelector('body');
    this.components = {};
    this.baseDir = baseDir;
    this.contexts = {};
    this.context = undefined;
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
    this.contexts[this.context.component.name] = this.context;
    this.context = this.contexts[next.name];
    this.root.appendChild(this.context.component.tag);
    document.head.appendChild(this.context.component.style);
}

function addComponent() {
    var component = eval(this.component);
    component.name = this.component;
    ez.components[component.name] = component;
    loadFile(this.src.substring(0, this.src.lastIndexOf("/") + 1) + component.setting.template, template => {
        component.tag = document.createElement(this.component);
        component.template = template;
        component.tag.innerHTML = template;
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