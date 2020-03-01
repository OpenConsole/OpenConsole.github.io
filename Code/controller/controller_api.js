function SubController() {
  this.scIFrame = document.getElementById("controller");
  this.controllerLoaded = false;
  window.addEventListener("message", this.sendMessage, false);
}

SubController.prototype.initialize = function() {
  ctrlApi.scIFrame.addEventListener("load", function() {
    ctrlApi.controllerLoaded = true;
  });
}

SubController.prototype.setControllerLayout = function (keymap) {
  var messageToSend = {"type":"SetLayout", "keymap":keymap };
  if(ctrlApi.controllerLoaded) {
    ctrlApi.scIFrame.contentWindow.postMessage(messageToSend, "*");
  } else {
    var setLayoutFunct = function (event) {
      ctrlApi.scIFrame.contentWindow.postMessage(messageToSend, "*");
      ctrlApi.scIFrame.removeEventListener("load", setLayoutFunct);
    }
    ctrlApi.scIFrame.addEventListener("load", setLayoutFunct);
  }
}
SubController.prototype.setGame = function (scLocation) {
    ctrlApi.controllerLoaded = false;
    ctrlApi.scIFrame.src = scLocation;
}

SubController.prototype.sendMessage = function (event) {
  var message = event.data;
  switch(message.type) {
    case "Key":
	    playerNet.sendKey(message.key);
      break;
  }
}

var ctrlApi = new SubController();
ctrlApi.initialize();