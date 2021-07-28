function Statement(text) {
    this.text = text;
}

function compile(...statements) {
    let list = new Array();
    statements.forEach((text, index) => {
        let statement = new Statement(text);
        statement.id = index;
        list.push(statement);
    });
    return list;
}

Array.prototype.shuffle = function () {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i)
        const temp = this[i]
        this[i] = this[j]
        this[j] = temp
    }
    return this;
}

let statements = compile(
    "I vår lokala arbetsplan står skrivet att vi skall göra museebesök",
    "Lärarstudenter gör intressanta stationer för barnen.",
    "Besöket vid Museum Gustavianum är centralt för vårt arbete med barnen.",
    "Det barnen upplever under besöket använder vi senare i skolan.",
    "Besöket ger mig som lärare en stunds vila.",
    "Stationerna som lärarstudenterna erbjuder är anpassat för förskolebarn.",
    "Studenternas lärarhandledning är något jag uppskattar.",
    "Som lärare önskar jag mig mera fortbildning om kulturarv och historia.",
    "Jag önskar som lärare att barnen engageras mera vid stationerna.",
    "Barnen har förväntningar innan de kommer till Museum Gustavianum.",
    "Jag som lärare har förväntningar på museebesöket.",
    "Som lärare får jag idéer till min egen undervisning.",
    "Barnen kan genomföra liknande experiment i skolan efter besöket.",
    "Barnen går från Museum Gustavianum med glädje."
).shuffle();

let sortedStatements = [];


/*const ez = new Ez();

ez.register("introduction/intro-controller.js", "IntroComponent");
ez.register("primary/primary-controller.js", "PrimaryComponent");*/

const ez = new Ez();

ez.add("components/primary/primary-controller.js", builder => builder.controller(PrimaryController));
ez.add("modules/events.js", builder => builder.module(Event));
