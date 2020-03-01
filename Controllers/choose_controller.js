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

genericCtrl.sendPress = function(elem, pos) {
  if(elem) {
	  if(elem.id == "controls-graphic") {
			elem = genericCtrl.getButtonInContainer(elem, pos);
	  }
    var buttonInfo = elem.id.split('-');
    if(buttonInfo[0] != "Btn") {
      return;
    }
		elem.classList.add("active");
    genericCtrl.signalFinalPress(buttonInfo[1]);
  }
}
genericCtrl.sendRelease = function (elem, pos) {
  if(elem) {
    if(elem.id == "controls-graphic") {
      elem = genericCtrl.getButtonInContainer(elem, pos);
    }
    var buttonInfo = elem.id.split('-');
    if(buttonInfo[0] != "Btn") {
      return;
    }
    elem.classList.remove("active");
    genericCtrl.signalFinalRelease(buttonInfo[1]);
  }
}


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