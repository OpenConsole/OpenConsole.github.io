genericCtrl.getButtonInContainer = function (elem, pos) {
  var container_w = elem.getBoundingClientRect().width;
  var container_h = elem.getBoundingClientRect().height;
  var x = pos.clientX - elem.getBoundingClientRect().left;
  var y = pos.clientY - elem.getBoundingClientRect().top;

  var c_x = x - container_w / 2;
  var c_y = y - container_h / 2;
  if (Math.sqrt(Math.pow(c_x, 2) + Math.pow(c_y, 2)) < container_h / 5)
    return document.getElementById("Btn-Enter");

  // TOP OR RIGHT
  if (x > y) {
    // Right
    if (x > container_w - y) {
      return elem.children[3];
    // TOP
    }
    else {
      return elem.children[0];
    }
  // LEFT OR BOTTOM
  } else {
    // DOWN
    if (x > container_w - y) {
      return elem.children[1];
    // LEFT
    }
    else {
      return elem.children[2];
    }
  }
}


genericCtrl.getBtnByElem = function (elem) {
  for (i = 0; i < genericCtrl.btnSlots.length; i++) {
    if (genericCtrl.btnSlots[i].elem.id == elem.id)
      return genericCtrl.btnSlots[i];
  }
}
genericCtrl.releaseAllBtns = function () {
  for (i = 0; i < genericCtrl.btnSlots.length; i++) {
    genericCtrl.btnSlots[i].clickUp(genericCtrl.btnSlots[i]);
  }
}
genericCtrl.initializeTouch = function () {
  var ctrlGraphic = document.getElementById("controls-graphic");
  ctrlGraphic.addEventListener('touchstart', function (e) {
    var pressedButton = genericCtrl.getBtnByElem(genericCtrl.getButtonInContainer(ctrlGraphic, e.touches[0]));
    pressedButton.clickDown(pressedButton);
    e.preventDefault();
  }, capture );
  ctrlGraphic.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, capture );
  ctrlGraphic.addEventListener('touchend', function (e) {
    genericCtrl.releaseAllBtns();
    e.preventDefault();
  }, capture );
}
genericCtrl.initializeClick = function() {
  var ctrlGraphic = document.getElementById("controls-graphic");
  ctrlGraphic.addEventListener('mousedown', function (e) {
    var pressedButton = genericCtrl.getBtnByElem(genericCtrl.getButtonInContainer(ctrlGraphic, e));
    pressedButton.clickDown(pressedButton);
    e.preventDefault();
  }, capture );
  ctrlGraphic.addEventListener('mouseenter', function (e) {
    if(e.buttons !== 0) {
      var pressedButton = genericCtrl.getBtnByElem(genericCtrl.getButtonInContainer(ctrlGraphic, e));
      pressedButton.clickDown(pressedButton);
    }
    e.preventDefault();
  }, capture );
  ctrlGraphic.addEventListener('mouseup', function (e) {
    var pressedButton = genericCtrl.getBtnByElem(genericCtrl.getButtonInContainer(ctrlGraphic, e));
    pressedButton.clickUp(pressedButton);
    e.preventDefault();
  }, capture );
  ctrlGraphic.addEventListener('mouseleave', function (e) {
    genericCtrl.releaseAllBtns();
    e.preventDefault();
  }, capture );
}
function initialize() {
  if (isTouch()) {
    genericCtrl.initializeTouch();
  }
  else {
    genericCtrl.initializeClick();
  }
}
initialize();


function preloadImages() {
  // Unused as it doesn't work?
  const requiredImages = ["controls_enter_active.png", "controls_active_up.png", "controls_active_down.png", "controls_active_left.png", "controls_active_right.png"];
  for (i = 0; i < requiredImages.length; i++) {
    var preloadLink = document.createElement("link");
    preloadLink.href = "choose_game/" + requiredImages[i];
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    document.head.appendChild(preloadLink);
  }
}