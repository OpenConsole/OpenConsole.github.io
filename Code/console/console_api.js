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
  which: 1,
  key: "e",
  code: "KeyE"
}
const minDownTime = 60;

function GameControl() {
  this.seenIDs = {};
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
        oEvent.which = 1;
        break;
      case 'TouchEvent':
        oEvent.initTouchEvent(eventName, allOptions.bubbles, allOptions.cancelable, document.defaultView,
            allOptions.button, allOptions.ctrlKey, allOptions.altKey, allOptions.shiftKey, allOptions.metaKey,
            [{pageX: allOptions.pointerX, pageY: allOptions.pointerY}], null, null);
        break;
      case 'KeyboardEvent':
        oEvent = new KeyboardEvent(eventName, {bubbles : allOptions.bubbles, cancelable : allOptions.cancelable,
                                               ctrlKey : allOptions.ctrlKey, altKey : allOptions.altKey, shiftKey : allOptions.shiftKey, metaKey : allOptions.metaKey,
                                               code: allOptions.code, key : allOptions.key, keyCode: allOptions.keyCode, which:allOptions.keyCode });
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
  gCtrl.simulate(gameInstance, "keydown", { keyCode: keyCode, key: key, code: code });
}
GameControl.prototype.simulateKeyUp = function (keyCode, key, code) {
  var gameInstance = gamesCtrl.getGameInstance();
  if(gameInstance == null) return;
  gCtrl.simulate(gameInstance, "keypress", { keyCode: keyCode, key: key, code: code });
  gCtrl.simulate(gameInstance, "keyup", { keyCode: keyCode, key: key, code: code });
}
GameControl.prototype.simulateKey = function (keyCode, key, code) {
  gCtrl.simulateKeyDown(keyCode, key, code);
  setTimeout(function() { gCtrl.simulateKeyUp(keyCode, key, code); }, minDownTime);
}
/**
 * Simulate click with absolute x and y.
 */
GameControl.prototype.simulateClickDown = function (x, y) {
  var gameInstance = gamesCtrl.getGameInstance();
  if(gameInstance == null) return;
  gCtrl.simulate(gameInstance, "mousemove", { pointerX: x, pointerY: y });
  setTimeout(function() {
    gCtrl.simulate(gameInstance, "mousedown", { pointerX: x, pointerY: y });
  }, 30);
}
GameControl.prototype.simulateClickUp = function (x, y) {
  var gameInstance = gamesCtrl.getGameInstance();
  if(gameInstance == null) return;
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
  setTimeout(function() { gCtrl.simulateClickUp(coords[0], coords[1]); }, minDownTime);
}

GameControl.prototype.simulateButton = function (buttonData, type, pressID) {
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
  var simMethodKeyboard, simMethodMouse;
  switch (type) {
    case 'Up':
      if(gCtrl.seenIDs[pressID] != null) {
        if (gCtrl.seenIDs[pressID] == -1) return; // Up got sent twice, ignore this one
        if (Date.now() - gCtrl.seenIDs[pressID] < minDownTime) {
          // Wait to send up
          setTimeout (function() {
            gCtrl.simulateButton(buttonData, type, pressID);
          }, minDownTime - Date.now() + gCtrl.seenIDs[pressID]);
          return;
        }
        else {
          // Simulate normally
          simMethodKeyboard = gCtrl.simulateKeyUp; // Up got sent after Down
          simMethodMouse = gCtrl.simulateClickUpRelative;
          gCtrl.seenIDs[pressID] = null;
        }
      } else {
        gCtrl.seenIDs[pressID] = -1; // Up got sent before Down, simulate click
        simMethodKeyboard = gCtrl.simulateKey;
        simMethodMouse = gCtrl.simulateClickRelative;
      }
      break;
    case 'Down':
      if(gCtrl.seenIDs[pressID] != null) { // Down got sent twice or after Up, ignore this one
        if (gCtrl.seenIDs[pressID] == -1) gCtrl.seenIDs[pressID] = null; // Down got sent after Up
        return;
      } else {
        simMethodKeyboard = gCtrl.simulateKeyDown; // Down got sent before Up, simulate down
        simMethodMouse = gCtrl.simulateClickDownRelative;
        gCtrl.seenIDs[pressID] = Date.now();
      }
      break;
    case 'Press':
      simMethodKeyboard = gCtrl.simulateKey;
      simMethodMouse = gCtrl.simulateClickRelative;
      break;
    default:
      break;
  }
  var simMethod = buttonData.isKeyboard ? simMethodKeyboard : simMethodMouse;
  simMethod(buttonData.data[0], buttonData.data[1], buttonData.data[2]);
}

var gCtrl = new GameControl();