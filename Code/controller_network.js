var connect;
var disconnect;
var signal;
(function () {
    var lastPeerId = null;
    var peer = null; // own peer object
    var conn = null;
    var message = document.getElementById("message");
    var cueString = "<span class=\"selfMsg\">Self: </span>";//"<span class=\"cueMsg\">Cue: </span>";
    /**
     * Create the Peer object for our end of the connection.
     *
     * Sets up callbacks that handle any events related to our
     * peer object.
     */
    function initialize() {
        // Create own peer object with connection to shared PeerJS server
        peer = new Peer(null, {
            debug: 2
        });
        peer.on('open', function (id) {
            // Workaround for peer.reconnect deleting previous id
            if (peer.id === null) {
                console.log('Received null id from peer open');
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }
            console.log('ID: ' + peer.id);
        });
        peer.on('disconnected', function () {
            addMessage("Connection lost. Please reconnect");
            console.log('Connection lost. Please reconnect');
            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
        });
        peer.on('close', function() {
            conn = null;
            addMessage("Connection destroyed. Please refresh");
            console.log('Connection destroyed');
        });
        peer.on('error', function (err) {
            console.log(err);
            console.log(err.type);
			if (err.type == "peer-unavailable") {
				invalidCode();
			} else if (err.type == "network") {
			  enableConnect();
	          if(conn && !conn.open) {
                conn = null;
              }
			} else {
                alert('' + err);
            }
        });
    };
    /**
     * Create the connection between the two Peers.
     *
     * Sets up callbacks that handle any events related to the
     * connection and data received on it.
     */
	disconnect = function() {
	  if (conn) {
		signal("Disconnecting");
		enableConnect();
		setTimeout(function() {
		  closeConnection();
		}, 500);
	  }
	}
    connect = function(id) {
		if (id.length < 4)
			return 0;
		idA = parseInt(id.substr(0, id.length-3));
		idB = parseInt(id.substr(id.length-3, id.length));
		checksum = (Math.floor(idB/100) + Math.floor(idB/10) + idB) % 10;
		if (checksum != 3)
			return 0;
		connId = getId(idA, idB);
        // Create connection to destination peer specified in the input field
        conn = peer.connect(connId, {
          reliable: true,
          metadata: player
        });
        conn.on('open', function () {
		  setMode(modes.CONTROLLER);
          addMessage("Connected to: " + id);
          console.log("Connected to: " + conn.peer);
          // Check URL params for comamnds that should be sent immediately
          var command = getUrlParam("command");
          if (command)
            conn.send(command);
        });
        // Handle incoming data (messages only since this is the signal sender)
        conn.on('data', function (data) {
          var datas = data.split(/--/);
          switch (datas[0]) {
            case 'Disconnecting':
              addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
              closeConnection();
              break;
            case 'Ping':
              signal("Pong");
              break;
            case 'SetController':
              addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
			  currGame = datas[2];
              SetController(datas[1]);
              break;
            case 'SetLayout':
              addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
              var enabledKeys = datas[2].split(',');
              var listButtons;
              if(datas[3] && datas[3] != "") {
                listButtons = datas[3].split(',');
              }
              SetControllerLayout(JSON.parse(datas[1]), enabledKeys, listButtons);
              break;
            case 'SetGames':
              addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
              var gamesList = datas[1].split(',');
              SetGamesList(gamesList);
              break;
            default:
              addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
              break;
          }
        });
        conn.on('close', function () {
          addMessage("Connection closed");
		  enableConnect();
          conn = null; 
          document.dispatchEvent(new Event('disconnected'));
        });
		return 1;
    };
    
    function closeConnection() {
        if (conn && conn.open) {
            conn.close(); 
        }
    }

    /**
     * Get first "GET style" parameter from href.
     * This enables delivering an initial command upon page load.
     *
     * Would have been easier to use location.hash.
     */
    function getUrlParam(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results == null)
            return null;
        else
            return results[1];
    };
    /**
     * Send a signal via the peer connection and add it to the log.
     * This will only occur if the connection is still alive.
     */
    signal = function (sigName) {
        if (conn && conn.open) {
            conn.send(sigName);
            console.log("Sent: " + sigName);
            if(sigName != "Pong")
                addMessage(cueString + sigName);
        }
    }
    function addMessage(msg) {
        var now = new Date();
        var h = now.getHours();
        var m = addZero(now.getMinutes());
        var s = addZero(now.getSeconds());
        if (h > 12)
            h -= 12;
        else if (h === 0)
            h = 12;
        function addZero(t) {
            if (t < 10)
                t = "0" + t;
            return t;
        };
        message.innerHTML = "<span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + "<br>" + message.innerHTML;
    };/*
    function clearMessages() {
        message.innerHTML = "";
        addMessage("Msgs cleared");
    };*/
    window.addEventListener("message", sendMessage, false);
    
    function sendMessage(event) {
        var message = event.data;
        switch(message.type) {
            case "Key":
                signal(message.key);
                break;
        }
    }
    
    // Since all our callbacks are setup, start the process of obtaining an ID
    initialize();
})();