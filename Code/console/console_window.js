function CurrGame(gameName, gameSettings, gameLoc) {
  this.name = gameName;
  this.settings = gameSettings;
  this.loc = gameLoc;
  this.gameInstance = null;
}

function Games() {
  this.defaultGame = "_ChooseGame"; // MazeGame ~ #HardCrash
  // this.corsProxy = "https://cors-anywhere.herokuapp.com/";
  this.corsProxy = "https://cors-proxy-oc.glitch.me/";
  this.currGame = null;
  this.gamesList = null;
  this.gamesIFrame = null;
  window.addEventListener("message", this.handleMessageFromGame, false);
}
Games.prototype.initialize = function() {
  gamesCtrl.loadDefaultGamesList();
}

Games.prototype.loadJSON = function (path, success, error) {
  console.log("Attemting to read json at: " + path);
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== XMLHttpRequest.DONE) return;
    if (xhr.status === 200) {
      if (success) success(JSON.parse(xhr.responseText));
    }
    else {
      if (error) error(xhr);
    }
  };
  xhr.open("GET", path, true);
  xhr.send();
}

/**
 * If generic: Loads a Generic .html game located at game.loc, INPUT ONLY WORKS IF SAME ORIGIN!
 * Else: Loads a Unity game with the unity .json at game.loc
 */
Games.prototype.setGameContentFrame = function (gameName) {
  if (!gamesCtrl.currGame || gamesCtrl.currGame.name != gameName) return;

  var messageToSend = {"type":"SetGameInstace", "gameInstance":gamesCtrl.currGame.settings.canvasID };
  if(gamesCtrl.gamesIFrame) {
    gamesCtrl.gamesIFrame.contentWindow.postMessage(messageToSend, "*");
  }
}
Games.prototype.waitForGameLoad = function (gameName) {
  if (!gamesCtrl.currGame || gamesCtrl.currGame.name != gameName) return;
  gamesCtrl.setGameContentFrame(gameName);
  gamesCtrl.gamesIFrame.removeEventListener("load", gamesCtrl.waitForGameLoad);
  
  if(gamesCtrl.currGame.settings.loadUnityGame) {
    var onLoadUnity = function (event) {
      if(event.data == "loaded") {
          if (gamesCtrl.currGame && gamesCtrl.currGame.name == gameName)
            gamesCtrl.onGameLoad();
          window.removeEventListener("message", onLoadUnity, false);
      }
    };
    window.addEventListener("message", onLoadUnity, false);
    gamesCtrl.gamesIFrame.contentWindow.postMessage(gamesCtrl.corsProxy + gamesCtrl.currGame.loc, "*");//"https://openconsole.github.io");
  }
  else {
    gamesCtrl.onGameLoad();
  }
}
Games.prototype.onGameLoad = function () {
  if (!gamesCtrl.currGame) return;
  if(gamesCtrl.currGame.name == gamesCtrl.defaultGame) {
    var gamesArray = Object.values(gamesCtrl.gamesList).filter(game => { return game.name[0] != "_" });
    var messageToSend = {"type":"SetGames", "gamesList":gamesArray, "prevGame":gamesCtrl.prevGame };
    gamesCtrl.gamesIFrame.contentWindow.postMessage(messageToSend, "*");
  } else {
    gamesCtrl.prevGame = gamesCtrl.currGame.name;
  }
    
  var ogl = gamesCtrl.currGame.settings.OnGameLoad;
  if(!ogl) return;
  
  var delay = Math.ceil(parseFloat(ogl.delay)*1000);
  function startKeySeq(index) {
    if(index < ogl.keys.length) {
      if(ogl.keys[index].isDelay) {
        setTimeout(function() { startKeySeq(index+1); }, ogl.keys[index].data);
      } 
      else {
        gCtrl.simulateButton(ogl.keys[index], "Press");
        setTimeout(function() { startKeySeq(index+1); }, 300);
      }
    }
  }
  setTimeout(function () { startKeySeq(0); }, delay);                
}

Games.prototype.setGameFrame = function (game) {
  document.getElementById("game").innerHTML = "<iframe id=\"webgl-content\" src=\"\" scrolling=\"no\" frameBorder=\"0\"></iframe>";
  gamesCtrl.gamesIFrame = document.getElementById("webgl-content");

  gamesCtrl.currGame = game;
  gamesCtrl.gamesIFrame.addEventListener("load", function() { gamesCtrl.waitForGameLoad(game.name); } );
  if(game.settings.loadUnityGame)
    gamesCtrl.gamesIFrame.src = "Games/genericUnityLoader/genericUnity.html";
  else
    gamesCtrl.gamesIFrame.src = gamesCtrl.currGame.loc;
}

Games.prototype.getGamePath = function (gameSettings, currLocation) {
  if (gameSettings.relLocation) {
    return currLocation.substring(0, currLocation.lastIndexOf("/") + 1) + gameSettings.relLocation;
  } 
  else if (gameSettings.absLocation) {
    return gameSettings.absLocation;
  }
  return null;
}
Games.prototype.setGame = function (gameName) {
  // Used EXTERNALLY
  if(gamesCtrl.gamesList == null || gamesCtrl.gamesList[gameName] == null) {
    console.error(gamesCtrl.gamesList);
    console.error("Unknown game! " + gameName);
    return;
  }
  var gameSettingsLocation = gamesCtrl.gamesList[gameName].path;
  gamesCtrl.loadJSON(gamesCtrl.corsProxy + gameSettingsLocation,
    function(data) { 
      console.log(data);
      // Use CORS proxy
      var path = gamesCtrl.getGamePath(data, gameSettingsLocation);
      if(path == null) {
        console.error("Path to game not specified!");
        return;
      }
      if(data.loadUnityGame) data.canvasID = "#canvas";
      var game = new CurrGame(gameName, data, path);
      
      gamesCtrl.setGameFrame(game);
      consoleNet.resetPlayerIds();
      consoleNet.setContollerGameAll();
      metaConsole.displayNewGame(gameName[0] == "_" ? "" : gameName);
    },
    function(xhr) { console.error(xhr); }
  );
}

Games.prototype.onLoadDefaultGameList = function() {
  if(gamesCtrl.defaultGame && gamesCtrl.defaultGame != "") {
    if(gamesCtrl.currGame == null || gamesCtrl.currGame.name != gamesCtrl.defaultGame) {
      if(gamesCtrl.gamesList[gamesCtrl.defaultGame] != null)
        gamesCtrl.setGame(gamesCtrl.defaultGame);
    }
  }
}
Games.prototype.loadGamesList = function (jsonLocation) {
  gamesCtrl.loadJSON(gamesCtrl.corsProxy + jsonLocation,
    function(data) {
      var relPath = jsonLocation.substring(0, jsonLocation.lastIndexOf("/") + 1);
      for (var i = 0; i < data.length; i++) {
        if(gamesCtrl.gamesList == null) gamesCtrl.gamesList = {};
        gamesCtrl.gamesList[data[i].name] = data[i];
        gamesCtrl.gamesList[data[i].name].path = relPath + data[i].relLocation;
      }
      gamesCtrl.onLoadDefaultGameList();
    },
    function(xhr) { console.error(xhr); }
  );
}
Games.prototype.loadDefaultGamesList = function() {
  if(gamesCtrl.gamesList) return;
  
  //gamesCtrl.loadGamesList('http://localhost:8000/Games/gamesList.json');
  gamesCtrl.loadGamesList('https://openconsole-games.github.io/Games/gamesList.json');
  setTimeout(gamesCtrl.loadDefaultGamesList, 5000);
}

  
Games.prototype.handleMessageFromGame = function (event) {
  var message = event.data;
  switch(message.type) {
    case "SetGame":
      gamesCtrl.setGame(message.game.name);
      break;
  }
}

Games.prototype.getGameInstance = function() {
  // Used EXTERNALLY
  if (!gamesCtrl.currGame) return null;
  return gamesCtrl.currGame.gameInstance;
}
Games.prototype.getGameIFrame = function() {
  // Used EXTERNALLY
  return gamesCtrl.gamesIFrame;
}
Games.prototype.getMaxPlayers = function() {
  // Used EXTERNALLY
  if (!gamesCtrl.currGame) return null;
  return gamesCtrl.currGame.settings.maxPlayers;
}
Games.prototype.getControllerForCurrentGame = function(playerId) {
  // Used EXTERNALLY
  if (!gamesCtrl.currGame) return null;
  var ctrl = { "name":gamesCtrl.currGame.name, "loc":gamesCtrl.currGame.settings.controllerLocation };
  var ctrls = gamesCtrl.currGame.settings.controls;
  if (playerId >= ctrls.length) return ctrl;
  ctrl.keymap = ctrls[playerId];
  
                  /*
            var enabledKeys = "";
            var multiKeys = "";
            if(settings.controls[conn.id]) {
                enabledKeys = Object.keys(settings.controls[conn.id]).toString();
                multiKeys = Object.values(settings.controls[conn.id]).filter(function (key) { return key.isMulti; }).map(
                function(key) {
                    return (key.data.width * key.data.height);
                }).toString();
            }
            signal(conn, "SetLayout--" + settings.controllerLayout + "--" + enabledKeys + "--" + multiKeys);
            */
  return ctrl;
}


Games.prototype.translateKeyIdToButton = function(keyId, playerId) {
  if (!gamesCtrl.currGame) return null;
  var ctrls = gamesCtrl.currGame.settings.controls;
  if (playerId >= ctrls.length) return null;
  var multiKeys = keyId.split(/--/);
  var translatedButton = ctrls[playerId][multiKeys[0]];
  if (multiKeys.length > 1) {
    translatedButton.x = multiKeys[1];
    translatedButton.y = multiKeys[2];
  }
  return translatedButton;
}

Games.prototype.simulateButton = function (keyId, playerId, upDown, pressId) {
  // Used EXTERNALLY
  var translatedButton = gamesCtrl.translateKeyIdToButton(keyId, playerId);
  if(translatedButton == null) {
    console.log(message.press.keyId + " [IGNORED]");
    return;
  }
  var messageToSend = {"type":"SimulateBtn", "buttonData":translatedButton, "upDown":upDown, "pressId":pressId };
  if(gamesCtrl.gamesIFrame) {
    gamesCtrl.gamesIFrame.contentWindow.postMessage(messageToSend, "*");
  }
}

var gamesCtrl = new Games();
gamesCtrl.initialize();