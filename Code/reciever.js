(function () {
    var lastPeerId = null;
    var peer = null; // Own peer object
    var peerId = null;
    var conns = null;
    var recvId = document.getElementById("receiver-id");
    var status = document.getElementById("status"), playersText = document.getElementById("playerList");
    var debug = document.getElementById("message");
    var internetImage = document.getElementById("internet-lost");
    
    /**
     * Reload PeerJS script if it failed
     */
    function peerjsLoadError() {
        console.log("PeerJS not loaded, retrying");
        var oldScript = document.getElementById("peerjsScript");
        var newScript = document.createElement('script');
        newScript.onload = initialize;
        newScript.onerror = function() {
            setTimeout(peerjsLoadError, 2000);
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
     function initialize() {
        if(typeof Peer == "undefined") {
            peerjsLoadError();
            return;
        }
        var a = Math.floor(Math.random() * 1000);
		var b1 = Math.floor(Math.random() * 10), b2 = Math.floor(Math.random() * 10), b3 = (23 - b1 - b2) % 10;
		var b = b1 * 100 + b2 * 10 + b3;
        myId = getId(a, b);
        // Create own peer object with connection to shared PeerJS server
        peer = new Peer(myId, {
            debug: 2
        });
        peer.on('open', function (id) {
            internetImage.classList.add('hiddenImage');
            // Workaround for peer.reconnect deleting previous id
            if (peer.id === null) {
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }
            console.log('ID: ' + peer.id);
            recvId.innerHTML = a + "." + b;
            status.innerHTML = "Awaiting connection...";
            playersText.innerHTML = "";
        });
        peer.on('connection', function (c) {
            ready(c);
        });
        var lastDC = 0;
        peer.on('disconnected', function () {
            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
            // If don't dc in next 3.5s hide network error
            var nowTime = Date.now();
            lastDC = nowTime
            setTimeout(function() { if(lastDC == nowTime) internetImage.classList.remove('hiddenImage'); }, 3500);
        });
        peer.on('close', function() {
            conns = null;
            status.innerHTML = "Connection destroyed. Please refresh";
            playersText.innerHTML = "";
            console.log('Connection destroyed');
        });
        peer.on('error', function (err) {
            console.log(err);
            console.log(err.type);
            if(err.type == "network") {
                internetImage.classList.add('hiddenImage');
            }
        });
    };
    /**
     * Triggered once a connection has been achieved.
     * Defines callbacks to handle incoming data and connection events.
     */
    function ready(conn) {
        conn.on('open', function() {
            conn.isActive = 4;
            if(conns) {
                // Allow only a single connection
                if (conns.includes(conn)) {
                    conn.on('open', function() {
                        conn.send("Already connected?");
                        setTimeout(function() { conn.close(); }, 500);
                    });
                    return;
                }
                conn.id = 0;
                while(conns.filter(function (oC) { return (oC.id == conn.id);}).length > 0) {
                    conn.id += 1;
                }
                conns.push(conn);
            } else {
                conn.id = 0;
                conns = [conn];
            }
            console.log("Connected to: " + conn.peer);
            showConnections();
            // Tell new client the layout
            setController(conn);
            // Tell new client the games
            setGamesList(conn);
        });
        conn.on('data', function (data) {
            var peerString = "<span class=\"peerMsg\">" + conn.metadata.name + ": </span>";
            var datas = data.split(/--/);
            
            switch (datas[0]) {
                case 'Key':
                    if(conn.id >= settings.maxPlayers) {
                    addMessage(peerString + data + " [IGNORED]");
                        return;
                    }
                    var myControls = settings.controls[conn.id];
                    var buttonData = myControls[datas[1]];
                    if(buttonData == null) {
                        addMessage(peerString + data + " [IGNORED]");
                        return;
                    }
                    var actualButtonData = buttonData;
                    if(buttonData.isMulti) {
                        var x = parseInt(datas[3]) % buttonData.data.width, y = Math.floor(parseInt(datas[3]) / buttonData.data.width);
                        var xPos = parseFloat(buttonData.data.topLeft[0]) + x * parseFloat(buttonData.data.delta[0]);
                        var yPos = parseFloat(buttonData.data.topLeft[1]) + y * parseFloat(buttonData.data.delta[1]);
                        var actualButtonData = { "isKeyboard":buttonData.isKeyboard, 
                                                 "data":[xPos, yPos, "0"] };
                    }
                    simulateButton(actualButtonData, datas[2]);
                    addMessage(peerString + data);
                    break;
                case 'SetGame':
                    setGame(datas[1]);
                    console.log("Received: " + data);
                    addMessage(peerString + data);
                    break;
                case 'Disconnecting':
                    if(conn.open) {
                        conn.close();
                    }
                    break;
                case 'Pong':
                    conn.isActive = 2;
                    break;
                default:
                    console.log("Received: " + data);
                    addMessage(peerString + data);
                    break;
            };
        });
        conn.on('close', function () {
            console.log("Disconnected " + conn.peer);
            conns = conns.filter(function(c) { return c !== conn });
            if(conn.id != null && settings) {
                if(conns.length >= settings.maxPlayers && conn.id < settings.maxPlayers) {
                    var connToChange = conns.filter(function(c) { return c.id >= settings.maxPlayers; })[0];
                    connToChange.id = conn.id;
                    setController(connToChange);
                }
            }
            showConnections();
            conn = null;
        });
        setTimeout(function() { 
            if(conn && !conn.open) {
                conn = null;
            }
        }, 3000);
    }
    
    /**
     * Send any message to connection c
     */
    function signal(c, sigName) {
        if (c && c.open) {
            c.send(sigName);
            if(sigName != "Ping") {
                addMessage("<span class=\"selfMsg\">Self: </span>" + sigName);
            }
        }
    }
    /**
     * Check for dead connections
     */
    window.setInterval(function(){
        if(conns == null)
            return;
        conns.filter(function(c) { return (c.isActive == 0); }).forEach(function(c) {
            signal(c, "Disconnecting");
            setTimeout(function() { 
                if(c && c.open)
                    c.close();
            }, 500);
        });
        conns.forEach(function(c) { signal(c, "Ping"); c.isActive -= 1; });
    }, 2500);
    /**
     * Update controllers on game change
     */
    function setController(conn) {
        if(settings) {
            signal(conn, "SetController--" + settings.controllerLocation + "--" + settings.currGameName);
            
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
        }
    }
    document.addEventListener('newGame', function () {
        if(conns) {
            conns.forEach(function(c) { setController(c); });
        }
    }, false);
    
    /**
     * Update games list when loaded
     */
    function setGamesList(conn) {
        if(gamesList) {
            var enabledGames = Object.keys(gamesList).toString();
            signal(conn, "SetGames--" + enabledGames);
        }
    }
    document.addEventListener('newGameList', function () {
        if(conns) {
            conns.forEach(function(c) { setGamesList(c); });
        }
    }, false);
    
    /**
     * Show connected players
     */
    function showConnections() {
        if(conns == null)
            return;
        if(conns.length == 0) {
            status.innerHTML = "Awaiting connection...";
            playersText.innerHTML = "";
            return;
        }

        status.innerHTML = "Players:";
        playersText.innerHTML = "";
        playersText.style = "font-size: " + 50 + "px";
        var lines = 0, newLines = 0;
        conns.forEach(function(conn, i) {
            var previousText = playersText.innerHTML;
            var newText = conn.metadata.name + " (" + (conn.id + 1) + "), ";
            playersText.innerHTML = previousText + newText;
            var distToRight = window.innerWidth - playersText.getBoundingClientRect().right;
            if(distToRight < 60) {
                // If already decreased font size, goto new line
                if(lines > newLines) {
                    newLines++;
                    playersText.innerHTML = previousText + "<br>" + newText;
                } else {
                    // Decrease font size before going to new line
                    lines++;
                    playersText.style = "font-size: " + Math.ceil(50/(lines*1.1+1)) + "px";
                }
            }
            // If getting to end make sure that we fill up these new lines
            if(lines - newLines > conns.length - i - 1 && conns.length > 1) {
                newLines++;
                playersText.innerHTML = previousText + "<br>" + newText;
            }
        });
        playersText.innerHTML = playersText.innerHTML.slice(0, -2);
    }
    
    /**
     * Debug
     */
    function addMessage(msg) {
        if(debug.hidden)
            return;
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
        debug.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + debug.innerHTML;
    }
    window.addEventListener("keydown", function(e) {
        // Ctrl + D to show debug
        if(e.key == "d" && e.ctrlKey) {
            debug.hidden = !debug.hidden;
        }
    });
    
    /**
     * Maybe can show more people on same line after resize
     */
    window.addEventListener('resize', showConnections);
    initialize();
})();