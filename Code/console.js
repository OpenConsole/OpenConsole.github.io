var settings;
var gameInstance;
var currGame, gamesList;

var setGame;
(function() {
    function loadJSON(path, success, error) {
        console.log("Attemting to read json at: " + path);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function()
        {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    if (success)
                        success(JSON.parse(xhr.responseText));
                } else {
                    if (error)
                        error(xhr);
                }
            }
        };
        xhr.open("GET", path, true);
        xhr.send();
    }
    var newGameEvent = new Event('newGame');
    var newGamesListEvent = new Event('newGameList');
    
    /**
     * If generic: Loads a Generic .html game located at gameLoc, INPUT ONLY WORKS IF SAME ORIGIN!
     * Else: Loads a Unity game with the unity .json at gameLoc
     */
    function setGameFrame(gameLoc, canvasID, unityGame, onLoad) {
        var gameIFrame = document.getElementById("webgl-content");
        gameIFrame.src = "";
        var getGameInstance = function(tries) {
            gameInstance = document.getElementById("webgl-content").contentWindow.document.getElementById(canvasID);
            if(gameInstance == null && tries > 0) {
                setTimeout(function() { getGameInstance(tries-1); }, 1000);
                gameInstance = document.getElementById("webgl-content").contentWindow.document;
            }
        }
        var setGameFun = function() {
            if(unityGame) {
                var onLoadUnity = function (event) {
                    if(event.data == "loaded") {
                        onLoad();
                        window.removeEventListener("message", onLoadUnity, false);
                    }
                }
                window.addEventListener("message", onLoadUnity, false);
                gameIFrame.contentWindow.postMessage(gameLoc, "*");//"https://openconsole.github.io");
            } else {
                onLoad();
            }
            getGameInstance(4);
            gameIFrame.removeEventListener("load", setGameFun);
        }
        gameIFrame.addEventListener("load", setGameFun);
        if(unityGame)
            gameIFrame.src = "Games/genericUnityLoader/genericUnity.html";
        else
            gameIFrame.src = gameLoc;
    }
    setGame = function (gameName) {
		currGame = gameName;
        gameSettingsLocation = gamesList[gameName].path;
        if(gameSettingsLocation == null) {
            console.error("Unknown game!");
            return;
        }
        loadJSON(gameSettingsLocation,
            function(data) { 
                console.log(data); 
                settings = data;
				settings.currGameName = gameName;
                SetGameSize();
                document.getElementById("gameTitle").innerHTML = (gameName[0] == "_" ? "" : gameName);
                var path = "";
				if(data.relLocation) {
					path = gameSettingsLocation.substring(0, gameSettingsLocation.lastIndexOf("/")) + data.relLocation;
				} else {
					path = data.absLocation;
				}
                var canvasID = "#canvas";
                if(!data.loadUnityGame) canvasID = data.canvasID;
                var onLoad = function() {
                    document.dispatchEvent(newGameEvent);
                    console.log("Running onLoad for game");
                    if(data.OnGameLoad) {
                        var delay = Math.ceil(parseFloat(data.OnGameLoad.delay)*1000);
                        function startKeySeq(index) {
                            if(index < data.OnGameLoad.keys.length) {
                                if(data.OnGameLoad.keys[index].isDelay) {
                                    setTimeout(function() { startKeySeq(index+1); }, data.OnGameLoad.keys[index].data);
                                } else {
                                    simulateButton(data.OnGameLoad.keys[index], "Press");
                                    setTimeout(function() { startKeySeq(index+1); }, 300);
                                }
                            }
                        }
                        setTimeout(function () { startKeySeq(0); }, delay);
                    }
                }
                setGameFrame(path, canvasID, data.loadUnityGame, onLoad);
            },
            function(xhr) { console.error(xhr); }
        );
    }

    function loadGamesList(jsonLocation) {
        loadJSON(jsonLocation,
            function(data) {
                var relPath = jsonLocation.substring(0, jsonLocation.lastIndexOf("/") + 1);
                for (var i = 0; i < data.length; i++) {
                    if(gamesList == null) {
                        gamesList = {};
                    }
                    gamesList[data[i].name] = { "name":data[i].name, "path":(relPath + data[i].relLocation), "gamePic":data[i].gamePic };
                }
                document.dispatchEvent(newGamesListEvent);
            },
            function(xhr) { console.error(xhr); }
        );
    }

    function loadDefaultGamesList() {
        if(gamesList)
            return;
        //loadGamesList('./Games/gamesList.json');
        loadGamesList('https://openconsole.github.io/Games/gamesList.json');
        setTimeout(loadDefaultGamesList, 5000);
    }
    loadDefaultGamesList();

    
    var defaultGame = "_ChooseGame"; // MazeGame ~ #HardCrash
    function setDefaultGame() { 
        if(defaultGame && defaultGame != "") 
            setGame(defaultGame);
    }
    document.addEventListener('newGameList', setDefaultGame);
    function setChooseGameList() { 
        if(currGame && currGame == defaultGame) {
			gamesArray = Object.values(gamesList).filter(game => { return game.name[0] != "_" });
			var messageToSend = {"type":"SetGames", "gamesList":gamesArray };
            document.getElementById("webgl-content").contentWindow.postMessage(messageToSend, "*");
		}
    }
    document.addEventListener('newGame', setChooseGameList);
	
	window.addEventListener("message", recvMessageFromGame, false);
    function recvMessageFromGame(event) {
        var message = event.data;
        switch(message.type) {
            case "SetGame":
                setGame(message.game.name);
                break;
        }
    }
})();





var SetGameSize;
(function() {
    var myHeight, myWidth;
    var gCont = document.getElementById('webgl-content');

    SetGameSize = function () {
        reportSize();
        myHeight -= 60;
        if(settings && settings.aspect && settings.aspect != 0) {
            var deltaAspect = (myWidth/myHeight) / parseFloat(settings.aspect);
            if(deltaAspect > 1) {
                myWidth = Math.ceil(myWidth / deltaAspect);
            } else {
                myHeight = Math.ceil(myHeight * deltaAspect);
            }
        }
        gCont.style.width = myWidth + 'px';
        gCont.style.height = myHeight + 'px';
    }

    function reportSize() {
      myWidth = 0; myHeight = 0;
      if( typeof( window.innerWidth ) == 'number' ) {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
      } else {
        if( document.documentElement &&
            ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
          //IE 6+ in 'standards compliant mode'
          myWidth = document.documentElement.clientWidth;
          myHeight = document.documentElement.clientHeight;
        } else {
          if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            //IE 4 compatible
            myWidth = document.body.clientWidth;
            myHeight = document.body.clientHeight;
          }
        }
      }
    }

    window.addEventListener('resize', SetGameSize);

    document.getElementById("fullscreenButton").addEventListener("click", function () {
        toggleFullscreen();
    });
})();