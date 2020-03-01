function Network() {
  this.lastPeerId = null;
  this.peer = null;
  this.conns = new Array();
  window.setInterval(this.checkTimeout, 2500);
  /**
   * Maybe can show more people on same line after resize
   */
  window.addEventListener('resize', this.showConnections);
  this.a = null;
  this.b = null;
}

/**
 * Reload PeerJS script if it failed
 */
Network.prototype.peerjsLoadError = function() {
  console.log("PeerJS not loaded, retrying");
  var oldScript = document.getElementById("peerjsScript");
  var newScript = document.createElement('script');
  newScript.onload = consoleNet.initialize;
  newScript.onerror = function() {
      setTimeout(consoleNet.peerjsLoadError, 2000);
  }
  newScript.id = "peerjsScript";
  newScript.src = oldScript.src;
  oldScript.parentNode.removeChild( oldScript );
  document.body.appendChild(newScript);
}
/**
 * Create the Peer object for our end of the connection.
 *
 * Sets up callbacks that handle any events related to our
 * peer object.
 */
Network.prototype.loadPreviousAB = function() {
  var name = "prevAB=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      var prevAB = c.substring(name.length, c.length).split(' ');
      consoleNet.a = parseInt(prevAB[0]);
      consoleNet.b = parseInt(prevAB[1]);
      return 1;
    }
  }
  return 0;
}
Network.prototype.generateRandomAB = function() {
    consoleNet.a = Math.floor(Math.random() * 990) + 10;
    var b1 = Math.floor(Math.random() * 9) + 1, b2 = Math.floor(Math.random() * 10), b3 = (23 - b1 - b2) % 10;
    consoleNet.b = b1 * 100 + b2 * 10 + b3;
}
Network.prototype.saveAB = function(a, b) {
  var d = new Date();
  d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = "prevAB=" + a + " " + b + ";" + expires + ";";
}
Network.prototype.initialize = function() {
  if(typeof Peer == "undefined") {
    peerjsLoadError();
    return;
  }
  if(consoleNet.loadPreviousAB() == 0) {
    consoleNet.generateRandomAB();
  }
  consoleNet.createPeer();
}
Network.prototype.createPeer = function() {
  var myId = getId(consoleNet.a, consoleNet.b);
  // Create own peer object with connection to shared PeerJS server
  consoleNet.peer = new Peer(myId, {
      debug: 2
  });
  consoleNet.peer.consoleState = 0;
  consoleNet.peer.on('open', function (id) {
    // Workaround for peer.reconnect deleting previous id
    if (consoleNet.peer.id === null) {
        consoleNet.peer.id = consoleNet.lastPeerId;
    } 
    else {
        consoleNet.lastPeerId = consoleNet.peer.id;
    }
    console.log('ID: ' + consoleNet.peer.id);
    consoleNet.peer.consoleState = 3;
    consoleNet.saveAB(consoleNet.a, consoleNet.b);
    metaConsole.displayServerInfo(consoleNet.a, consoleNet.b);
  });
  consoleNet.peer.on('connection', function (c) {
    consoleNet.setupController(c);
  });
  var lastDC = 0;
  consoleNet.peer.on('disconnected', function () {
    console.log('Disconnected from PeerNet, reconnecting.');
    // Workaround for peer.reconnect deleting previous id
    consoleNet.peer.id = consoleNet.lastPeerId;
    consoleNet.peer._lastServerId = consoleNet.lastPeerId;
    consoleNet.peer.reconnect();
    // If don't dc in next 3.5s hide network error
    metaConsole.displayNoInternet();
    var nowTime = Date.now();
    lastDC = nowTime
    setTimeout(function() { if(lastDC == nowTime) metaConsole.hideNoInternet(); }, 2500);
  });
  consoleNet.peer.on('close', function() {
    switch (consoleNet.peer.consoleState) {
      case 3:
        consoleNet.conns = null;
        metaConsole.connectionDestroyed();
        console.log('Connection destroyed');
        break;
      case 1:
        consoleNet.generateRandomAB();
        consoleNet.createPeer();
        break;
    }
  });
  consoleNet.peer.on('error', function (err) {
    console.log(err);
    console.log(err.type);
    switch (err.type) {
      case 'network':
        //if(consoleNet.peer.open) {
          //metaConsole.displayNoInternet();
        //}
        break;
      case 'unavailable-id':
        consoleNet.peer.consoleState = 1;
        break;
    }
  });
}

/**
 * Triggered once a connection has been achieved.
 * Defines callbacks to handle incoming data and connection events.
 */
 Network.prototype.setupController = function (conn) {
  conn.on('open', function() {
    conn.isActive = 6;
    conn.id = consoleNet.getMinimalId();
    consoleNet.conns.push(conn);
    
    console.log("Connected to: " + conn.peer);
    consoleNet.showConnections();
    consoleNet.setContollerGame(conn);
  });
  conn.on('data', function (data) {
    consoleNet.handleMessage(conn, JSON.parse(data));
  });
  conn.on('close', function () {
    console.log("Disconnected " + conn.peer);
    consoleNet.conns = consoleNet.conns.filter(function(c) { return c !== conn });
    var maxPlayers = gamesCtrl.getMaxPlayers();
    if(conn.id != null && maxPlayers != null) {
      if(consoleNet.conns.length >= maxPlayers && conn.id < maxPlayers) {
        var connToChange = consoleNet.conns.filter(function(c) { return c.id >= maxPlayers; })[0];
        connToChange.id = conn.id;
        consoleNet.setControllerLayout(connToChange);
      }
    }
    consoleNet.showConnections();
    conn = null;
  });
  /*
  setTimeout(function() { 
    if(conn && !conn.open) {
      conn = null;
    }
  }, 3000);*/
}
Network.prototype.getMinimalId = function (initialMinId) {
  var newId = initialMinId || 0;
  while(consoleNet.conns.filter(function (oC) { return (oC.id == newId);}).length > 0) {
    newId += 1;
  }
  return newId;
}
Network.prototype.handleMessage = function (conn, message) {
  switch (message.type) {
    case 'KeyPress':
      var buttonData = gamesCtrl.translateKeyIdToButton(message.press.keyId, conn.id);
      if(buttonData == null) {
        console.log(message.press.keyId + " [IGNORED]");
        return;
      }
      gCtrl.simulateButton(buttonData, message.press.upDown, message.press.pressId);
      break;
    case 'SetGame':
      console.log("Received: " + message.name);
      gamesCtrl.setGame(message.name);
      break;
    case 'Disconnect':
      console.log("Controller disconnected " + conn.id);
      if(conn.open) {
          conn.close();
      }
      break;
    case 'Pong':
      conn.isActive = 3;
      break;
    default:
      console.log("Received unknown! " + message);
      break;
  }
}
/**
 * Check for dead connections
 */
Network.prototype.resetPlayerIds = function () {
  var minId = consoleNet.getMinimalId();
  for (i = 0; i < consoleNet.conns.length; i++) {
    if(consoleNet.conns[i].id > minId) {
      consoleNet.conns[i].id = minId;
      minId = consoleNet.getMinimalId(minId);
    }
  }
  consoleNet.showConnections();
}
/**
 * Check for dead connections
 */
Network.prototype.connectionCheck = function (conn) {
  if (conn.isActive == 0) {
    console.log("Timed out " + conn.peer);
    consoleNet.sendDisconnect(conn);
    setTimeout(function() { 
      if(conn && conn.open)
        conn.close();
    }, 500);
  }
  else {
    consoleNet.sendPing(conn);
    conn.isActive -= 1; 
  }
}
Network.prototype.checkTimeout = function() {
  consoleNet.conns.forEach(consoleNet.connectionCheck);
}

/**
 * Send any message to connection conn
 */
Network.prototype.signal = function (conn, message) {
  if (conn && conn.open) {
    conn.send(message);
    console.log(message);
  }
}

/**
 * All the possible messages we can send.
 */
Network.prototype.setContollerGame = function (conn) {
  var ctrl = gamesCtrl.getControllerForCurrentGame(conn.id);
  if(!ctrl) return;
  
  var message = { "type":"SetGame", "name":ctrl.name, "controllerLoc":ctrl.loc, "keymap":ctrl.keymap };
  consoleNet.signal(conn, JSON.stringify(message));
}
Network.prototype.setControllerLayout = function (conn) {
  var ctrl = gamesCtrl.getControllerForCurrentGame(conn.id);
  if(!ctrl) return;
  
  var message = { "type":"SetControllerLayout", "keymap":ctrl.keymap };
  consoleNet.signal(conn, JSON.stringify(message));
}
Network.prototype.sendPing = function (conn) {
  var message = { "type":"Ping" };
  consoleNet.signal(conn, JSON.stringify(message));
}
Network.prototype.sendDisconnect = function (conn) {
  var message = { "type":"Disconnect" };
  consoleNet.signal(conn, JSON.stringify(message));
}

Network.prototype.setContollerGameAll = function() {
  // Used EXTERNALLY
  consoleNet.conns.forEach(consoleNet.setContollerGame);
}



Network.prototype.showConnections = function() {
  metaConsole.displayPlayers(consoleNet.conns);
}

var consoleNet = new Network();
// Since all our callbacks are setup, start the process of obtaining an ID
consoleNet.initialize();