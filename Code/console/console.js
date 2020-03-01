function MetaConsole() {
  this.recvId = document.getElementById("receiver-id");
  this.status = document.getElementById("status");
  this.playersText = document.getElementById("playerList");
  this.internetImage = document.getElementById("internet-lost");
  this.gameTitle = document.getElementById("gameTitle");
  window.addEventListener('resize', this.updateGameSize);
  document.getElementById("fullscreenButton").addEventListener("click", toggleFullscreen);
}

MetaConsole.prototype.displayServerInfo = function (a, b) {
  metaConsole.recvId.innerHTML = a + " " + b;
  metaConsole.status.innerHTML = "Awaiting connection...";
  metaConsole.playersText.innerHTML = "";
  metaConsole.internetImage.classList.add('hiddenImage');
}

MetaConsole.prototype.displayNoInternet = function () {
  metaConsole.internetImage.classList.remove('hiddenImage');
}
MetaConsole.prototype.hideNoInternet = function () {
  metaConsole.internetImage.classList.add('hiddenImage');
}

MetaConsole.prototype.connectionDestroyed = function () {
  metaConsole.status.innerHTML = "Connection destroyed. Please refresh";
  metaConsole.playersText.innerHTML = "";
}

MetaConsole.prototype.displayPlayers = function (conns) {
  if(!conns || conns.length == 0) {
    metaConsole.status.innerHTML = "Awaiting connection...";
    metaConsole.playersText.innerHTML = "";
    return;
  }
  metaConsole.status.innerHTML = "Players:";
  metaConsole.playersText.innerHTML = "";
  metaConsole.playersText.style = "font-size: " + 50 + "px";
  var lines = 0, newLines = 0;
  conns.forEach(function(conn, i) {
    var previousText = metaConsole.playersText.innerHTML;
    var newText = conn.metadata.name + " (" + (conn.id + 1) + "), ";
    metaConsole.playersText.innerHTML = previousText + newText;
    var distToRight = window.innerWidth - metaConsole.playersText.getBoundingClientRect().right;
    if(distToRight < 60) {
      // If already decreased font size, goto new line
      if(lines > newLines) {
        newLines++;
        metaConsole.playersText.innerHTML = previousText + "<br>" + newText;
      }
      else {
        // Decrease font size before going to new line
        lines++;
        metaConsole.playersText.style = "font-size: " + Math.ceil(50/(lines*1.1+1)) + "px";
      }
    }
    // If getting to end make sure that we fill up these new lines
    if(lines - newLines > conns.length - i - 1 && conns.length > 1) {
      newLines++;
      metaConsole.playersText.innerHTML = previousText + "<br>" + newText;
    }
  });
  metaConsole.playersText.innerHTML = metaConsole.playersText.innerHTML.slice(0, -2);
}

MetaConsole.prototype.updateGameSize = function() {
  if (gamesCtrl.currGame == null) return;
  var gameContainer = gamesCtrl.getGameIFrame();
  if (gameContainer == null) return;

  var myWidth = window.innerWidth, myHeight = window.innerHeight - 60;
  var aspectRatio = gamesCtrl.currGame.settings.aspect;
  if(aspectRatio && aspectRatio != 0) {
    var deltaAspect = (myWidth/myHeight) / parseFloat(aspectRatio);
    if(deltaAspect > 1) {
      myWidth = Math.ceil(myWidth / deltaAspect);
    } else {
      myHeight = Math.ceil(myHeight * deltaAspect);
    }
  }
  gameContainer.style.width = myWidth + 'px';
  gameContainer.style.height = myHeight + 'px';
}

MetaConsole.prototype.displayNewGame = function(gameName) {
  metaConsole.gameTitle.innerHTML = gameName;
  metaConsole.updateGameSize();
}

var metaConsole = new MetaConsole();