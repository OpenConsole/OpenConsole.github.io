const modes = {
  ROTATE: 0,
  CONNECT: 1,
  CONTROLLER: 2,
  MENU: 3
};
const capture = {
  capture : true
};

function MetaController() {
  this.currMode = modes.CONNECT;
  this.lastMode = modes.CONNECT;
  this.rotate = document.getElementById("rotate-landscape");
  this.connect = document.getElementById("connect");
  this.controller = document.getElementById("controller_containter");
  this.menu = document.getElementById("menu");
  this.connectScreenTop = document.getElementById("connect-logo");

  window.addEventListener('resize', this.checkOrentation);
  window.addEventListener('orientationchange', this.checkOrentation);
  window.addEventListener("focus", this.checkOrentation);
  
  // Prevent most mobile annoyances
  window.addEventListener('touchmove', function (e) { e.preventDefault(); }, capture);
  window.addEventListener('touchend', function (e) { e.preventDefault(); }, capture);
  window.addEventListener('gesturestart', function(e){ e.preventDefault(); }, capture);

  this.idField = document.getElementById("code-code");
  this.disableInput = false;
  this.lastDeleted = false;
}
MetaController.prototype.initialize = function() {
  metaCtrl.setMode(modes.CONNECT);
  metaCtrl.checkOrentation();
}

MetaController.prototype.preloadImages = function() {
  // Unused as it doesn't work?
  const requiredImages = ["code-x.png", "code-tick.png", "home-button.png", "controller/menu_change_game.png", "controller/menu_profile.png", "controller/menu_close.png", "controller/menu_leave.png", "controller/menu_help.png", "rotate-to-landscape.png"];
  for (i = 0; i < requiredImages.length; i++) {
    var preloadLink = document.createElement("link");
    preloadLink.href = "Resources/" + requiredImages[i];
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    document.head.appendChild(preloadLink);
  }
}

MetaController.prototype.disableAllScreens = function() {
  metaCtrl.rotate.style.display = 'none';
	metaCtrl.connect.style.display = 'none';
	metaCtrl.controller.style.display = 'none';
	metaCtrl.menu.style.display = 'none';
}
MetaController.prototype.setMode = function(mode) {
  metaCtrl.lastMode = metaCtrl.currMode;
  metaCtrl.currMode = mode;
	metaCtrl.disableAllScreens();
  switch (mode) {
	  case modes.ROTATE:
	    metaCtrl.rotate.style.display = 'block';
	    break;
	  case modes.CONNECT:
	    metaCtrl.connect.style.display = 'block';
	    break;
	  case modes.CONTROLLER:
	    metaCtrl.controller.style.display = 'block';
	    break;
	  case modes.MENU:
	    metaCtrl.menu.style.display = 'block';
	    break;
	  default:
	}
}

MetaController.prototype.checkOrentation = function(mode) {
  var width = window.innerWidth, height = window.innerHeight;
	if (width == null || height == null) {
    window.setTimeout(function() {
        metaCtrl.checkOrentation();
    }, 0);
    return;
  }
	if (height < 280) {
	  metaCtrl.connectScreenTop.style.display = 'none';
	} else {
		metaCtrl.connectScreenTop.style.display = 'flex';  
	}
	if (height > width) {
	  if (metaCtrl.currMode != modes.ROTATE) {
		  metaCtrl.setMode(modes.ROTATE);
		}
	} else {
	  if (metaCtrl.currMode == modes.ROTATE) {
		  metaCtrl.setMode(metaCtrl.lastMode);
    }
  }
}

MetaController.prototype.setPlaceholder = function(elem, newText) {
  // Used EXTERNALLY
  elem.classList.remove("bright");
  elem.classList.add("shade-text");
  elem.classList.add("code-code-instructions");
  elem.innerHTML = newText;
}
MetaController.prototype.setText = function(elem, newText) {
  // Used EXTERNALLY
  elem.classList.remove("code-code-instructions");
  elem.classList.remove("shade-text");
  elem.classList.add("bright");
  elem.innerHTML = newText;
}

MetaController.prototype.invalidId = function() {
  // Used EXTERNALLY
  metaCtrl.setPlaceholder(metaCtrl.idField, "Invalid code");
	metaCtrl.enableConnect();
}
MetaController.prototype.enableConnect = function() {
  // Used EXTERNALLY
	metaCtrl.setMode(modes.CONNECT);
	metaCtrl.disableInput = false;
}
MetaController.prototype.connected = function() {
  // Used EXTERNALLY
	metaCtrl.setMode(modes.CONTROLLER);
	metaCtrl.disableInput = false;
}

MetaController.prototype.setIdText = function (idText) {
  // Used EXTERNALLY
	var currIdFormat = "";
	for (var i = 0; i < idText.length; i++) {
	  if (i != 0 && (idText.length - i) % 3 == 0) (currIdFormat += " ");
	  currIdFormat += idText[i];
	}
	if (idText.length != 0) {
	  metaCtrl.setText(metaCtrl.idField, currIdFormat);
	} else {
	  metaCtrl.setPlaceholder(metaCtrl.idField, "Enter the code");
	}
}

MetaController.prototype.handleButton = function (btn, input, evnt) {
  // Used EXTERNALLY
	console.log(input);
  if (evnt) evnt.preventDefault();
	if (metaCtrl.disableInput) return;
  if (btn && btn.classList.contains("shade-bg")) {
	  btn.classList.remove("shade-bg");
	  btn.classList.add("punch-bg");
	  window.setTimeout(function() {
	    btn.classList.remove("punch-bg");
	    btn.classList.add("shade-bg");
      }, 100);
	}
  if (metaCtrl.handleInGameButton(input)) return;
  
  var currId = "";
  if(!metaCtrl.idField.classList.contains("code-code-instructions")) {
      currId = metaCtrl.idField.innerHTML.replace(/[^0-9]/g, "");
	}
	if (input == "enter") {
	  metaCtrl.disableInput = true;
	  var success = playerNet.connect(currId);
	  if (success == 0) {
		  metaCtrl.invalidId();
	  } else {
      player.updateLastId(currId);
	    // TODO
		  openFullscreen();
	  }
	  return;
	}
	if (input == "del") {
	  if (currId.length > 1 && !metaCtrl.lastDeleted) {
		  currId = currId.substr(0, currId.length - 1)
	  } else {
		  currId = "";
      player.updateLastId(currId);
	  }
	  metaCtrl.lastDeleted = true;
	} else {
	  metaCtrl.lastDeleted = false;
	  if(currId.length < 6) currId += input;
	}
	metaCtrl.setIdText(currId);
}
MetaController.prototype.handleInGameButton = function (input) {
  switch (input) {
    case 'chgGame':
      metaCtrl.setMode(modes.CONTROLLER);
      playerNet.quitGame();
      return 1;
    case 'disconnect':
      metaCtrl.disableInput = true;
      playerNet.disconnect();
      return 1;
    case 'menu':
      metaCtrl.setMode(modes.MENU);
      return 1;
    case 'esc':
      metaCtrl.setMode(modes.CONTROLLER);
      return 1;
    case 'null':
      return 1;
    default:
      return 0;
  }
}

var metaCtrl = new MetaController();
metaCtrl.initialize();