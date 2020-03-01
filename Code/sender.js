(function () {
    var lastPeerId = null;
    var peer = null; // own peer object
    var conn = null;
    var gamesSelect = document.getElementById("gamesSelect");
    var playerNameInput = document.getElementById("player-name"), recvIdInputA = document.getElementById("receiver-id-a"), recvIdInputB = document.getElementById("receiver-id-b");
    var message = document.getElementById("message");
    var sendMessageBox = document.getElementById("sendMessageBox");
    var playButton = document.getElementById("playButton");
    var connectButton = document.getElementById("connect-button");
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
            if(err.type != "network") {
                alert('' + err);
            }
            if(conn && !conn.open) {
                conn = null;
            }
            if(conn == null) {
                enableConnect();
            }
           
        });
    };
    /**
     * Create the connection between the two Peers.
     *
     * Sets up callbacks that handle any events related to the
     * connection and data received on it.
     */
    function join() {
        console.log("Clicked btn")
        // Close old connection
        if (conn) {
            if (conn.open) {
                connectButton.innerHTML = "Disconnecting";
                signal("Disconnecting");
            }
            setTimeout(function() { 
                closeConnection();
            }, 300);
        } else {
            connId = getId(parseInt(recvIdInputA.value), parseInt(recvIdInputB.value));
            // Create connection to destination peer specified in the input field
            conn = peer.connect(connId, {
                reliable: true,
                metadata: player
            });
            conn.on('open', function () {
                addMessage("Connected to: " + recvIdInputA.value + "." + recvIdInputB.value);
                connectButton.innerHTML = "Disconnect";
                connectButton.disabled = false;
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
                        SetController(datas[1]);
                        break;
                    case 'SetLayout':
                        addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
                        var enabledKeys = datas[2].split(',');
                        var listButtons;
                        if(datas[3] && datas[3] != "") {
                            listButtons = datas[3].split(',');
                        }
                        SetControllerLayout(datas[1], enabledKeys, listButtons);
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
                conn = null; 
                enableConnect();
            });
            connectButton.innerHTML = "Connecting";
            connectButton.disabled = true;
            playerNameInput.disabled = true;
            recvIdInputA.disabled = true;
            recvIdInputB.disabled = true;
        }
    };
    
    function closeConnection() {
        if (conn && conn.open) {
            conn.close(); 
        }
    }
    function enableConnect() {
        connectButton.innerHTML = "Connect";
        connectButton.disabled = false;
        playerNameInput.disabled = false;
        recvIdInputA.disabled = false;
        recvIdInputB.disabled = false;
        gamesSelect.disabled = true;
        playButton.disabled = true;
        SetController("");
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
     function signal(sigName) {
        if (conn && conn.open) {
            conn.send(sigName);
            console.log("Sent: " + sigName);
            if(sigName != "Pong")
                addMessage(cueString + sigName);
        }
    }
    window.signal = signal;
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
    // Try and connect maybe
    function tryConnectPress() {
        if(recvIdInputA.value == "") {
            recvIdInputA.focus();
            return;
        }
        if(recvIdInputB.value == "") {
            recvIdInputB.focus();
            return;
        }
        connectButton.focus();
        join();
    }
    // Listen for enter in connect box
    recvIdInputA.onkeypress = recvIdInputB.onkeypress = playerNameInput.onkeypress = function (e) {
        var event = e || window.event;
        var char = event.which || event.keyCode;
        if (char == '13') {
            tryConnectPress();
        }
    };
    // Send message
    playButton.onclick = function () {
        if (conn.open) {
            var newGameName = gamesSelect.options[gamesSelect.selectedIndex].value;
            if(newGameName == null || newGameName == "")
                return;
            signal("SetGame--" + newGameName);
        }
    };
    // Start peer connection on click
    connectButton.addEventListener('click', tryConnectPress);
    
    function isANumber(key) {
        return (key.length == 1) && (key.charCodeAt(0) >= 48 && key.charCodeAt(0) <= 57);
    }
    function checkInputValid(inputField, e) {
        if ((inputField.value.length == 2 && isANumber(e.key)) || (!isANumber(e.key) && e.key.length == 1))
            e.preventDefault();
    }
    recvIdInputA.onkeydown = function(e) {
        if (this.value.length == 2 && e.key.length == 1) {
            recvIdInputB.focus();
            checkInputValid(recvIdInputB, e);
        } else if(!isANumber(e.key) && e.key.length == 1) {
            e.preventDefault();
        }
    }
    recvIdInputB.onkeydown = function(e) {
        checkInputValid(recvIdInputB, e);
        if(this.value.length == 0 && e.key == 'Backspace') {
            recvIdInputA.focus();
      }
    }
    
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