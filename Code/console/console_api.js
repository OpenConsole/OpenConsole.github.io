const eventMatchers = {
  'HTMLEvent': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
  'MouseEvent': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/,
  'TouchEvent': /^(?:touch(?:move|start|end))$/,
  'KeyboardEvent': /^(?:key(?:down|up|press))$/
}
const defaultOptions = {
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

function GameControl() {
  this.lastDown = {};
}

GameControl.prototype.simulate = function (element, eventName, options) {
  var allOptions = gCtrl.extend(defaultOptions, options || {});
  var oEvent, eventType = null;
  for (var name in eventMatchers) {
    if (eventMatchers[name].test(eventName)) { eventType = name; break; }
  }
  if (!eventType) return;
  if (document.createEvent) {
    oEvent = document.createEvent(eventType);
    switch (eventType) {
      case 'HTMLEvent':
        oEvent.initEvent(eventName, allOptions.bubbles, allOptions.cancelable);
        break;
      case 'MouseEvent':
        oEvent.initMouseEvent(eventName, allOptions.bubbles, allOptions.cancelable, document.defaultView,
            allOptions.button, allOptions.pointerX, allOptions.pointerY, allOptions.pointerX, allOptions.pointerY,
            allOptions.ctrlKey, allOptions.altKey, allOptions.shiftKey, allOptions.metaKey, allOptions.button, null);
        break;
      case 'TouchEvent':
        oEvent.initTouchEvent(eventName, allOptions.bubbles, allOptions.cancelable, document.defaultView,
            allOptions.button, allOptions.ctrlKey, allOptions.altKey, allOptions.shiftKey, allOptions.metaKey,
            [{pageX: allOptions.pointerX, pageY: allOptions.pointerY}], null, null);
        break;
      case 'KeyboardEvent':
        oEvent = new KeyboardEvent(eventName, {bubbles : allOptions.bubbles, cancelable : allOptions.cancelable,
                                               ctrlKey : allOptions.ctrlKey, altKey : allOptions.altKey, shiftKey : allOptions.shiftKey, metaKey : allOptions.metaKey,
                                               code: allOptions.code, key : allOptions.key, keyCode: allOptions.keyCode});
        break;
    }
    element.dispatchEvent(oEvent);
  }
  else {
    allOptions.clientX = allOptions.pointerX;
    allOptions.clientY = allOptions.pointerY;
    var evt = document.createEventObject();
    oEvent = gCtrl.extend(evt, options);
    element.fireEvent('on' + eventName, oEvent);
  }
}
GameControl.prototype.extend = function (destination, source) {
  for (var property in source)
      destination[property] = source[property];
    return destination;
}

/**
 * Simulate key press
 */
GameControl.prototype.simulateKeyDown = function (keyCode, key, code) {
  var gameInstance = gamesCtrl.getGameInstance();
  if(gameInstance == null) return;
  gCtrl.lastDown[keyCode] = Date.now();
  gCtrl.simulate(gameInstance, "keydown", { keyCode: keyCode, key: key, code: code });
}
GameControl.prototype.simulateKeyUp = function (keyCode, key, code) {
  var gameInstance = gamesCtrl.getGameInstance();
  if(gameInstance == null) return;
  if(gCtrl.lastDown[keyCode] && Date.now() - gCtrl.lastDown[keyCode] < 50) {
    setTimeout(function() { gCtrl.simulateKeyUp(keyCode, key, code); }, 50 - Date.now() + gCtrl.lastDown[keyCode]);
    return;
  }
  gCtrl.simulate(gameInstance, "keypress", { keyCode: keyCode, key: key, code: code });
  gCtrl.simulate(gameInstance, "keyup", { keyCode: keyCode, key: key, code: code });
}
GameControl.prototype.simulateKey = function (keyCode, key, code) {
  gCtrl.simulateKeyDown(keyCode, key, code);
  setTimeout(function() { gCtrl.simulateKeyUp(keyCode, key, code); }, 100);
}
/**
 * Simulate click with absolute x and y.
 */
GameControl.prototype.simulateClickDown = function (x, y) {
  var gameInstance = gamesCtrl.getGameInstance();
  if(gameInstance == null) return;
  gCtrl.lastDown[-1] = Date.now();
  gCtrl.simulate(gameInstance, "mousemove", { pointerX: x, pointerY: y });
  setTimeout(function() {
    gCtrl.simulate(gameInstance, "mousedown", { pointerX: x, pointerY: y });
  }, 30);
}
GameControl.prototype.simulateClickUp = function (x, y) {
  var gameInstance = gamesCtrl.getGameInstance();
  if(gameInstance == null) return;
  if(gCtrl.lastDown[-1] && Date.now() - gCtrl.lastDown[-1] < 80) {
    setTimeout(function() { gCtrl.simulateClickUp(x, y); }, 80 - Date.now() + gCtrl.lastDown[-1]);
    return;
  }
  gCtrl.simulate(gameInstance, "mouseup", { pointerX: x, pointerY: y });
}
/**
 * Simulate click with relative x and y to canvas (ie 0.5, 0.5), z is unused
 */
GameControl.prototype.relativeToAbsolute = function (x, y) {
  var rect = document.getElementById("webgl-content").getBoundingClientRect();
  var xPix = (rect.right - rect.left) * parseFloat(x);// + rect.left;
  var yPix = (rect.bottom - rect.top) * parseFloat(y);// + rect.top;
  return [xPix, yPix];
}
GameControl.prototype.simulateClickDownRelative = function (x, y) {
  var coords = gCtrl.relativeToAbsolute(x, y);
  gCtrl.simulateClickDown(coords[0], coords[1]);
}
GameControl.prototype.simulateClickUpRelative = function (x, y) {
  var coords = gCtrl.relativeToAbsolute(x, y);
  gCtrl.simulateClickUp(coords[0], coords[1]);
}
GameControl.prototype.simulateClickRelative = function (x, y) {
  var coords = gCtrl.relativeToAbsolute(x, y);
  gCtrl.simulateClickDown(coords[0], coords[1]);
  setTimeout(function() { gCtrl.simulateClickUp(coords[0], coords[1]); }, 100);
}

GameControl.prototype.simulateButton = function (buttonData, type) {
  // TODO: Handle buttonData.isMulti, with buttonData.x and buttonData.y set with strings of pressed pos;
          /*
      var myControls = settings.controls[conn.id];
      var buttonData = myControls[datas[1]];
      if(buttonData == null) {
          addMessage(peerString + data + " [IGNORED]");
          return;
      }
      var actualButtonData = buttonData;
      if(buttonData.isMulti) {
          var x = parseInt(datas[3]) % buttonData.data.width, y = Math.floor(parseInt(datas[3]) / buttonData.data.width);
          var xPos = parseFloat(buttonData.data.topLeft[0]) + x * parseFloat(buttonData.data.delta[0]);
          var yPos = parseFloat(buttonData.data.topLeft[1]) + y * parseFloat(buttonData.data.delta[1]);
          var actualButtonData = { "isKeyboard":buttonData.isKeyboard, 
           "data":[xPos, yPos, "0"] };
      }*/
      
  // Used EXTERNALLY
  var simMethod;
  if(buttonData.isKeyboard) {
    switch (type) {
      case 'Up':
        simMethod = gCtrl.simulateKeyUp;
        break;
      case 'Down':
        simMethod = gCtrl.simulateKeyDown;
        break;
      case 'Press':
        simMethod = gCtrl.simulateKey;
        break;
      default:
        break;
    }
  }
  else {
    switch (type) {
      case 'Up':
        simMethod = gCtrl.simulateClickUpRelative;
        break;
      case 'Down':
        simMethod = gCtrl.simulateClickDownRelative;
        break;
      case 'Press':
        simMethod = gCtrl.simulateClickRelative;
        break;
      default:
        break;
    }
  }
  
  simMethod(buttonData.data[0], buttonData.data[1], buttonData.data[2]);
}

var gCtrl = new GameControl();