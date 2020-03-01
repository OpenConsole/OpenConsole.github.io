const capture = {
  capture : true
};

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

function GenericButton(elem) {
  this.elem = elem;
  this.btnKey = elem.id.split('-')[1];
  this.isActive = false;
}
GenericButton.prototype.initialize = function(thisBtn) {
  if (isTouch()) {
    thisBtn.initializeTouchButton(thisBtn);
  }
  else {
    thisBtn.initializeMouseButton(thisBtn);
  }
}
GenericButton.prototype.setActive = function(keymapBtn, thisBtn) {
  thisBtn.elem.setAttribute("class", "button");
  if (keymapBtn.innerHTML) thisBtn.elem.innerHTML = keymapBtn.innerHTML;
  if (keymapBtn.classList) thisBtn.elem.classList.add(...keymapBtn.classList);
}
GenericButton.prototype.setInactive = function(thisBtn) {
  thisBtn.elem.setAttribute("class", "button disabled");
}

GenericButton.prototype.initializeMouseButton = function(thisBtn) {
  thisBtn.elem.addEventListener('mousedown', function (e) {
    thisBtn.clickDown(thisBtn);
    e.preventDefault();
  }, capture );
  thisBtn.elem.addEventListener('mousemove', function (e) {
    if(e.buttons === 0) thisBtn.clickUp(thisBtn);
    else              thisBtn.clickDown(thisBtn);
    e.preventDefault();
  }, capture );
  thisBtn.elem.addEventListener('mouseup', function (e) {
    thisBtn.clickUp(thisBtn);
    e.preventDefault();
  }, capture );
  thisBtn.elem.addEventListener('mouseleave', function (e) {
    thisBtn.clickUp(thisBtn);
    e.preventDefault();
  }, capture );
}
GenericButton.prototype.initializeTouchButton = function(thisBtn) {
  thisBtn.elem.addEventListener('touchstart', function (e) {
    thisBtn.clickDown(thisBtn);
    e.preventDefault();
  }, capture );
  thisBtn.elem.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, capture );
  thisBtn.elem.addEventListener('touchend', function (e) {
    thisBtn.clickUp(thisBtn);
    e.preventDefault();
  }, capture );
}
GenericButton.prototype.clickDown = function(thisBtn) {
  if (thisBtn.isActive) return;
  thisBtn.isActive = true;
  thisBtn.elem.classList.add("active");
  genericCtrl.signalFinalPress(thisBtn.btnKey);
}
GenericButton.prototype.clickUp = function(thisBtn) {
  if (!thisBtn.isActive) return;
  thisBtn.isActive = false;
  thisBtn.elem.classList.remove("active");
  genericCtrl.signalFinalRelease(thisBtn.btnKey);
}

function GenericCtrl() {
  this.strict = true;
  this.controllerPageLocation = "https://openconsole.github.io";
  this.enabledButtons = new Array();
  this.pressed = [];
  this.btnSlots = [];
  this.pressIds = [];
  this.lastTouched = {};
}

GenericCtrl.prototype.initialize = function() {
  window.addEventListener("message", genericCtrl.receiveMessage, false);
  var buttons = document.getElementsByClassName("button");
  for (i = 0; i < buttons.length; i++) {
    var btn = new GenericButton(buttons[i]);
    btn.initialize(btn);
    genericCtrl.btnSlots.push(btn);
  }
  document.addEventListener('touchstart', function (e) { e.preventDefault(); }, capture);
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, capture);
  document.addEventListener('touchend', function (e) { e.preventDefault(); }, capture);
  document.addEventListener('mousedown', function (e) { e.preventDefault(); }, capture);
  document.addEventListener('mousemove', function (e) { e.preventDefault(); }, capture);
  document.addEventListener('mouseup', function (e) { e.preventDefault(); }, capture);
}

GenericCtrl.prototype.getTrustedUrl = function() {
  return genericCtrl.strict ? genericCtrl.controllerPageLocation : "*";
}
GenericCtrl.prototype.postKeyMessageToContainer = function (key, upDown) {
  if (upDown != "Up") {
    genericCtrl.pressIds[key] = Math.random();
  }
  parent.postMessage({ "type":"Key", "key":{ "keyId":key, "upDown":upDown, "pressId":genericCtrl.pressIds[key] } }, genericCtrl.getTrustedUrl());
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

/**
 * Sets layout of controller
 */
GenericCtrl.prototype.setControllerLayout = function (keymap) {
  if (keymap == null) genericCtrl.enabledButtons = [];
  else genericCtrl.enabledButtons = Object.keys(keymap);

  for(var i = 0; i < genericCtrl.btnSlots.length; i++) {
    var btnKey = genericCtrl.btnSlots[i].btnKey;
    if(!arrayContains(genericCtrl.enabledButtons, btnKey)) {
      genericCtrl.btnSlots[i].setInactive(genericCtrl.btnSlots[i]);
    } else {
      genericCtrl.btnSlots[i].setActive(keymap[btnKey], genericCtrl.btnSlots[i]);
    }
  }
  if (genericCtrl.setControllerLayoutExtended) {
    // Allow extending this function
    genericCtrl.setControllerLayoutExtended(keymap);
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