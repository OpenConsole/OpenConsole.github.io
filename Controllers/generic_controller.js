function arrayContains(arr, elem) {
    if(arr == null)
        return false;
    for(var i = 0; i < arr.length; i++) {
        if(arr[i] == elem)
            return true;
    }
    return false;
}
function isTouch() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

function GenericCtrl() {
  this.strict = true;
  this.controllerPageLocation = "https://openconsole.github.io";
  this.enabledButtons = new Array();
  this.pressed = [];
  this.btnSlots = document.getElementsByClassName("button");
  this.lastTouched = {};
  this.mouseIsDown = false;
}

GenericCtrl.prototype.initialize = function() {
  window.addEventListener("message", genericCtrl.receiveMessage, false);
  if (isTouch()){
    var lastTouchEnd = 0;
    window.addEventListener('touchstart', genericCtrl.onTouch, false);
    window.addEventListener('touchmove', function (e) { e.preventDefault(); e.stopPropagation(); genericCtrl.onTouch(e); } , false);
    window.addEventListener('touchend', function (e) { 
      if (Date.now() - lastTouchEnd <= 300) {
          e.preventDefault();
      }
      lastTouchEnd = Date.now();
      genericCtrl.onTouch(e); 
    }, false);
  }
  else {
    window.addEventListener('mousedown', function (e) { genericCtrl.mouseIsDown = true; genericCtrl.onPress(e); } );
    window.addEventListener('mousemove', function (e) { if(genericCtrl.mouseIsDown) genericCtrl.onPress(e); } );
    window.addEventListener('mouseup', function (e) { genericCtrl.mouseIsDown = false; genericCtrl.onPress(e); } );
  }
}

GenericCtrl.prototype.getTrustedUrl = function() {
  return genericCtrl.strict ? genericCtrl.controllerPageLocation : "*";
}
GenericCtrl.prototype.postKeyMessageToContainer = function (key, upDown) {
  parent.postMessage({ "type":"Key", "key":{ "keyId":key, "upDown":upDown } }, genericCtrl.getTrustedUrl());
}

GenericCtrl.prototype.signalFinalPress = function (key) {
  if(key == null || key == "") return;
  if(genericCtrl.enabledButtons == null || !arrayContains(genericCtrl.enabledButtons, key))
    return;
  // Protect from double clicks
  if(genericCtrl.lastTouched[key+"Up"] && (Date.now() - genericCtrl.lastTouched[key+"Up"] < 45))
    return;
  
  // Only buzz after long press
  if(genericCtrl.lastTouched[key+"Up"] == null || (Date.now() - genericCtrl.lastTouched[key+"Up"] > 35)) {
      if(genericCtrl.lastTouched[key+"Dn"] == null || (Date.now() - genericCtrl.lastTouched[key+"Dn"] > 75)) {
          if(window.navigator.vibrate)
              window.navigator.vibrate(75);
      }
  }
  genericCtrl.lastTouched[key+"Dn"] = Date.now();
  // Send down press
  genericCtrl.postKeyMessageToContainer(key, "Down");
}
GenericCtrl.prototype.signalFinalRelease = function (key) {
  if(key == null || key == "") return;
  if(genericCtrl.enabledButtons == null || !arrayContains(genericCtrl.enabledButtons, key))
    return;
  // Protect from double clicks
  if(genericCtrl.lastTouched[key+"Up"] && genericCtrl.lastTouched[key+"Dn"] && (genericCtrl.lastTouched[key+"Up"] > genericCtrl.lastTouched[key+"Dn"]))
      return;
  
  // Only buzz after long press
  if(genericCtrl.lastTouched[key+"Up"] == null || (Date.now() - genericCtrl.lastTouched[key+"Up"] > 100)) {
      if(genericCtrl.lastTouched[key+"Dn"] == null || (Date.now() - genericCtrl.lastTouched[key+"Dn"] > 35)) {
          if(window.navigator.vibrate)
              window.navigator.vibrate(35);
      }
  }
  genericCtrl.lastTouched[key+"Up"] = Date.now();
  // Send up press
  genericCtrl.postKeyMessageToContainer(key, "Up");
}

GenericCtrl.prototype.sendPress = function (elem, pos) {
  if(elem) {
    var buttonInfo = elem.id.split('-');
    if(buttonInfo[0] != "Btn") {
      return;
    }
    elem.classList.add("active");
    genericCtrl.signalFinalPress(buttonInfo[1]);
  }
}
GenericCtrl.prototype.sendRelease = function (elem, pos) {
  if(elem) {
    var buttonInfo = elem.id.split('-');
    if(buttonInfo[0] != "Btn") {
      return;
    }
    elem.classList.remove("active");
    genericCtrl.signalFinalRelease(buttonInfo[1]);
  }
}
    
GenericCtrl.prototype.updateTouches = function (touches) {
  var pressedElems = [];
  for (var i = 0; i < touches.length; i++) {
    var elemToAddToTouched = document.elementFromPoint(touches[i].clientX, touches[i].clientY);
    pressedElems.push({"elem":elemToAddToTouched, "pos":touches[i]});
  }
  
  for (var i = 0; i < pressedElems.length; i++) {
    var wasPressed = true;
    for (var j = 0; j < genericCtrl.pressed.length; j++) {
      if(pressedElems[i].elem == genericCtrl.pressed[i].elem) {
        wasPressed = false;
        break;
      }
    }
    if(wasPressed) {
      genericCtrl.sendPress(pressedElems[i].elem, pressedElems[i].pos);
    }
  }
  for (var i = 0; i < genericCtrl.pressed.length; i++) {
    var wasReleased = true;
    for (var j = 0; j < pressedElems.length; j++) {
      if(pressedElems[j].elem == genericCtrl.pressed[i].elem) {
        wasReleased = false;
        break;
      }
    }
    if(wasReleased) {
      genericCtrl.sendRelease(genericCtrl.pressed[i].elem, genericCtrl.pressed[i].pos);
    }
  }
  genericCtrl.pressed = pressedElems;
}
    
GenericCtrl.prototype.onTouch = function (e) {
  if(e instanceof MouseEvent)
    return;
  genericCtrl.updateTouches(e.touches);
}

GenericCtrl.prototype.onPress = function (e) {
  var pressedElem = document.elementFromPoint(e.clientX, e.clientY);
  if(genericCtrl.pressed.length == 0) {
    genericCtrl.sendPress(pressedElem, e);
  } 
  else {
    if(!genericCtrl.mouseIsDown) {
      genericCtrl.sendRelease(genericCtrl.pressed[0], e);
      genericCtrl.pressed = [];
      return;
    }
    else if(pressedElem != genericCtrl.pressed[0]) {
      genericCtrl.sendRelease(genericCtrl.pressed[0], e);
      genericCtrl.sendPress(pressedElem, e);
    }
  }
  genericCtrl.pressed = [pressedElem];
}

/**
 * Sets layout of controller
 */
GenericCtrl.prototype.setControllerLayout = function (keymap) {
  if (keymap == null) genericCtrl.enabledButtons = [];
  else genericCtrl.enabledButtons = Object.keys(keymap);

  for(var i = 0; i < genericCtrl.btnSlots.length; i++) {
    var btnElem = genericCtrl.btnSlots[i];
    var btnKey = btnElem.id.split('-')[1];
    btnElem.setAttribute("class", "button")
    // If disabled and should be enabled or vice versa toggle
    if(!arrayContains(genericCtrl.enabledButtons, btnKey)) {
      btnElem.classList.add('disabled');
      continue;
    }
    if (keymap[btnKey].innerHTML) btnElem.innerHTML = keymap[btnKey].innerHTML;
    if (keymap[btnKey].classList) btnElem.classList.add(...keymap[btnKey].classList);
  }
  /*
  // TODO: handle multikeys?
  if(tableButtonCounts && tableButtonCounts[0]) {
    SetTableButtons(tableButtonCounts);
  }
  */
}

GenericCtrl.prototype.receiveMessage = function (event) {
  // Do we trust the sender of this message?
  if (event.origin !== genericCtrl.controllerPageLocation && genericCtrl.strict)
    return;
        
  var message = event.data;
  switch(message.type) {
    case "SetLayout":
      genericCtrl.setControllerLayout(message.keymap);
      break;
  }
}


var genericCtrl = new GenericCtrl();
genericCtrl.initialize();