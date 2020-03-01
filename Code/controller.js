var currGame = "";
var gameSelect = "_ChooseGame";
const modes = {
  ROTATE: 0,
  CONNECT: 1,
  CONTROLLER: 2,
  MENU: 3
};

var setMode; var currMode = modes.CONNECT;
(function () {
  var rotate = document.getElementById("rotate-landscape");
  var connect = document.getElementById("connect");
  var controller = document.getElementById("controller_containter");
  var menu = document.getElementById("menu");
  function disableAllScreens() {
	rotate.style.display = 'none';
	connect.style.display = 'none';
	controller.style.display = 'none';
	menu.style.display = 'none';
  }
  setMode = function (mode) {
	currMode = mode;
	disableAllScreens();
    switch (mode) {
	  case modes.ROTATE:
	    rotate.style.display = 'block';
	    break;
	  case modes.CONNECT:
	    connect.style.display = 'block';
	    break;
	  case modes.CONTROLLER:
	    controller.style.display = 'block';
	    break;
	  case modes.MENU:
	    menu.style.display = 'block';
	    break;
	  default:
		
	}
  }
  setMode(modes.CONNECT);
})();


(function () {
  var lastMode = modes.CONNECT;
  var connectLogo = document.getElementById("connect-logo");
  function checkOrentation() {
    var width = window.innerWidth, height = window.innerHeight;
	if (width && height) {
	  if (height < 280) {
		  connectLogo.style.display = 'none';
	  } else {
		  connectLogo.style.display = 'flex';  
	  }
	  if (height > width) {
		if (currMode != modes.ROTATE) {
			lastMode = currMode;
			setMode(modes.ROTATE);
		}
	  } else {
		if (currMode == modes.ROTATE) {
			setMode(lastMode);
			lastMode = modes.ROTATE;
		}
	  }
	} else window.setTimeout(function() {
        checkOrentation()
    }, 0)
  }
  window.addEventListener('resize', checkOrentation);
  window.addEventListener('orientationchange', checkOrentation);
  checkOrentation();
})();

var buttonPress;
var invalidCode;
var setPlaceholder, setText;
var setIdText, enableConnect;
(function () {
  var idField = document.getElementById("code-code");
  var conecting = false;
  var lastDeleted = false;
  setPlaceholder = function(elem, newText) {
    elem.classList.remove("bright");
    elem.classList.add("shade-text");
    elem.classList.add("code-code-instructions");
    elem.innerHTML = newText;
  }
  setText = function(elem, newVal) {
    elem.classList.remove("code-code-instructions");
    elem.classList.remove("shade-text");
    elem.classList.add("bright");
    elem.innerHTML = newVal;
  }
  invalidCode = function() {
	setPlaceholder(idField, "Invalid code");
	enableConnect();
  }
  enableConnect = function() {
	setMode(modes.CONNECT);
	conecting = false;
  }
  setIdText = function(idText) {
	var currIdFormat = "";
	for (var i = 0; i < idText.length; i++) {
	  if (i != 0 && (idText.length - i) % 3 == 0) (currIdFormat += ".");
	  currIdFormat += idText[i];
	}
	if (idText.length != 0) {
	  setText(idField, currIdFormat);
	} else {
	  setPlaceholder(idField, "Enter the code");
	}
  }
  buttonPress = function(input) {
	console.log(input);
	if (conecting) return;
    var currId = "";
    if(!idField.classList.contains("code-code-instructions")) {
      currId = idField.innerHTML.replace(/[^0-9]/g, "");
	}
	if (input == "enter") {
	  conecting = true;
	  var success = connect(currId);
	  if (success == 0) {
		invalidCode();
	  } else {
	    document.dispatchEvent(new CustomEvent('id_updated', { detail: currId }));
		openFullscreen();
	  }
	  return;
	}
	if (input == "del") {
	  if (currId.length > 1 && !lastDeleted) {
		currId = currId.substr(0, currId.length - 1)
	  } else {
		currId = "";
	    document.dispatchEvent(new CustomEvent('id_updated', { detail: currId }));
	  }
	  lastDeleted = true;
	} else {
	  lastDeleted = false;
	  if(currId.length < 6) currId += input;
	}
	setIdText(currId);
  }
})();


var pressButton, changeGame;
(function () {
  pressButton = function(btn) {
    if (btn) {
	  btn.classList.remove("shade-bg");
	  btn.classList.add("punch-bg");
	  window.setTimeout(function() {
	    btn.classList.remove("punch-bg");
	    btn.classList.add("shade-bg");
      }, 100);
	}
  }
  changeGame = function() {
	if(currGame != "" && currGame != gameSelect) {
	  SetController("");
      setMode(modes.CONTROLLER);
	  signal("SetGame--" + gameSelect);
	}
  }
})();