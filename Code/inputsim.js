function simulate(element, eventName)
{
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;

    for (var name in eventMatchers)
    {
        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType)
        throw new SyntaxError('Only HTMLEvents, MouseEvents and TouchEvents interfaces are supported');

    if (document.createEvent)
    {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvent')
        {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        }
        else if (eventType == 'MouseEvent')
        {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, null);
        }
        else if (eventType == 'TouchEvent')
        {
            oEvent.initTouchEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
            options.button, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
            [{pageX: options.pointerX, pageY: options.pointerY}], null, null);
        }
        else if (eventType == 'KeyboardEvent')
        {
            oEvent = new KeyboardEvent(eventName, {bubbles : options.bubbles, cancelable : options.cancelable,
                                                    ctrlKey : options.ctrlKey, altKey : options.altKey, shiftKey : options.shiftKey, metaKey : options.metaKey,
                                                    code: options.code, key : options.key, keyCode: options.keyCode});
        }
        element.dispatchEvent(oEvent);
    }
    else
    {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        var evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent('on' + eventName, oEvent);
    }
    return element;
}

function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
}

var eventMatchers = {
    'HTMLEvent': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvent': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/,
    'TouchEvent': /^(?:touch(?:move|start|end))$/,
    'KeyboardEvent': /^(?:key(?:down|up|press))$/
}
var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
    keyCode: 0,
    key: "e",
    code: "KeyE"
}

var lastDown = {};

/**
 * Simulate key press
 */
function simulateKeyDown(keyCode, key, code) {
    if(gameInstance == null) return;
    lastDown[keyCode] = Date.now();
    simulate(gameInstance, "keydown", { keyCode: keyCode, key: key, code: code });
}
function simulateKeyUp(keyCode, key, code) {
    if(gameInstance == null) return;
    if(lastDown[keyCode] && Date.now() - lastDown[keyCode] < 50) {
        setTimeout(function() { simulateKeyUp(keyCode, key, code); }, 50 - Date.now() + lastDown[keyCode]);
        return;
    }
    simulate(gameInstance, "keypress", { keyCode: keyCode, key: key, code: code });
    simulate(gameInstance, "keyup", { keyCode: keyCode, key: key, code: code });
}
function simulateKey(keyCode, key, code) {
    simulateKeyDown(keyCode, key, code);
    setTimeout(function() { simulateKeyUp(keyCode, key, code); }, 100);
}
/**
 * Simulate click with absolute x and y.
 */
function simulateClickDown(x, y) {
    if(gameInstance == null) return;
    lastDown[-1] = Date.now();
    simulate(gameInstance, "mousemove", { pointerX: x, pointerY: y });
    setTimeout(function() {
        simulate(gameInstance, "mousedown", { pointerX: x, pointerY: y });
    }, 30);
}
function simulateClickUp(x, y) {
    if(gameInstance == null) return;
    if(lastDown[-1] && Date.now() - lastDown[-1] < 80) {
        setTimeout(function() { simulateClickUp(x, y); }, 80 - Date.now() + lastDown[-1]);
        return;
    }
    simulate(gameInstance, "mouseup", { pointerX: x, pointerY: y });
}
/**
 * Simulate click with relative x and y to canvas (ie 0.5, 0.5), z is unused
 */
function relativeToAbsolute(x, y) {
    var rect = document.getElementById("webgl-content").getBoundingClientRect();
    var xPix = (rect.right - rect.left) * parseFloat(x);// + rect.left;
    var yPix = (rect.bottom - rect.top) * parseFloat(y);// + rect.top;
    return [xPix, yPix];
}
function simulateClickDownRelative(x, y, z) {
    var coords = relativeToAbsolute(x, y);
    simulateClickDown(coords[0], coords[1]);
}
function simulateClickUpRelative(x, y, z) {
    var coords = relativeToAbsolute(x, y);
    simulateClickUp(coords[0], coords[1]);
}
function simulateClickRelative(x, y, z) {
    var coords = relativeToAbsolute(x, y);
    simulateClickDown(coords[0], coords[1]);
    setTimeout(function() { simulateClickUp(coords[0], coords[1]); }, 100);
}

function simulateButton(buttonData, type) {
    var simMethod;
    if(buttonData.isKeyboard) {
        switch (type) {
            case 'Up':
                simMethod = simulateKeyUp;
                break;
            case 'Down':
                simMethod = simulateKeyDown;
                break;
            case 'Press':
                simMethod = simulateKey;
                break;
            default:
                break;
        }
    }
    else {
        switch (type) {
            case 'Up':
                simMethod = simulateClickUpRelative;
                break;
            case 'Down':
                simMethod = simulateClickDownRelative;
                break;
            case 'Press':
                simMethod = simulateClickRelative;
                break;
            default:
                break;
        }
    }
    
    simMethod(buttonData.data[0], buttonData.data[1], buttonData.data[2]);
}