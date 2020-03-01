var selectCanvas = document.getElementById("select_canvas");
var gamesContainer = document.getElementById("games-container");
var gamesArray = [];
var selectGame = [0, 0];
var setGames = function (gamesList) {
  var cols = 7;
  var rows = Math.ceil(gamesList.length / cols);
  
  gamesContainer.innerHTML = '';
  for (var y = 0; y < rows; y++) {
	if (y == rows - 1 && gamesList.length % cols != 0) { cols = gamesList.length % cols }
	gamesArray.push([]);
	var gamesRow = document.createElement("div");
	gamesRow.classList.add("games-row");
	gamesContainer.appendChild(gamesRow);
    for (var x = 0; x < cols; x++) {
      var currGame = gamesList[y * cols + x];
	  var gameContainer = document.createElement("div");
	  gameContainer.classList.add("game-container");
	  gamesRow.appendChild(gameContainer);
	  var gameSelect = document.createElement("div");
	  gameSelect.classList.add("game-select");
	  gameContainer.appendChild(gameSelect);
	  if (selectGame[0] == x && selectGame[1] == y) { gameSelect.classList.add("active"); }
	  gamesArray[y].push([currGame, gameSelect]);
	  
	  var gameImage = document.createElement("div");
	  gameImage.classList.add("game-image");
	  if (currGame.gamePic) {
	    gameImage.setAttribute('style', 'background-image: url(\'' + currGame.gamePic + '\');')
	  }
	  gameSelect.appendChild(gameImage);
	  
	  var gameName = document.createElement("div");
	  gameName.classList.add("game-name");
	  gameName.innerHTML = currGame.name;
	  gameSelect.appendChild(gameName);
	}
  }
};

function checkValid (newSelect) {
	if (newSelect[1] < 0 || newSelect[1] >= gamesArray.length) return false;
	if (newSelect[0] < 0 || newSelect[0] >= gamesArray[newSelect[1]].length) return false;
	return true;
}
document.onkeydown = function(e) {
  var newSelect;
  switch (e.key) {
    case "ArrowUp":
	  newSelect = [selectGame[0], selectGame[1] - 1];
      break;
    case "ArrowDown":
	  newSelect = [selectGame[0], selectGame[1] + 1];
      break;
    case "ArrowLeft":
	  newSelect = [selectGame[0] - 1, selectGame[1]];
      break;
    case "ArrowRight":
	  newSelect = [selectGame[0] + 1, selectGame[1]];
      break;
    case "Enter":
	  PostGameSelectMessageToContainer(gamesArray[selectGame[1]][selectGame[0]][0]);
      break;
    default:
  }
  if (newSelect && checkValid(newSelect)) {
	gamesArray[selectGame[1]][selectGame[0]][1].classList.remove("active");
	selectGame = newSelect;
	gamesArray[selectGame[1]][selectGame[0]][1].classList.add("active");
  }
};

var strict = true;
var controllerPageLocation = "https://openconsole.github.io";
function PostGameSelectMessageToContainer(game) {
    parent.postMessage({ "type":"SetGame", "game":game }, strict ? controllerPageLocation : "*");
}

function receiveMessage(event) {
  // Do we trust the sender of this message?
  if (event.origin !== controllerPageLocation && strict)
    return;
  
  var message = event.data;
  switch(message.type) {
    case "SetGames":
      setGames(message.gamesList);
      break;
  }
}
window.addEventListener("message", receiveMessage, false);
/*
setGames([
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"../LeagueOfPixels/icon-256.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"../LeagueOfPixels/icon-256.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"../LeagueOfPixels/icon-256.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
},
{ "name":"League of Pixels", 
  "relLocation":"None",
  "gamePic":"https://img.itch.zone/aW1nLzI4MTczODUucG5n/original/O7gO0C.png" 
}
]);*/