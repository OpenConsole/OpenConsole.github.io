var player = null;

function bake_cookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    var cookie = [name, '=', JSON.stringify(value), expires, '; domain=.', window.location.host.toString(), '; path=/;'].join('');
    document.cookie = cookie;
}
function read_cookie(name) {
    var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
    result && (result = JSON.parse(result[1]));
    return result;
}

(function () {
    function chooseRandomPlayerName() {
        var names = ["Xerxes","Kane","Shoshana","Wing","Mohammad","Sydney","Keefe","Nicole","Malik","Carson","Seth","Hashim","Fritz","Rafael","Melodie","Phelan","Axel","Mufutau","Cameron","Gannon","Hamish","Sydnee","Glenna","Chaim","Beverly","Devin","Florence","Addison","Upton","Barbara","Patrick","Reese","Naomi","Berk","Caryn","Avram","Ruby","Guinevere","Kennedy","Zeus","Lewis","Xenos","Armando","Gannon","Ashton","Coby","Samuel","Lewis","Armand","Illiana","Ali","Nigel","Macey","Sophia","Bernard","Stephanie","Rachel","Gail","Merritt","Eugenia","Isabelle","Irma","Quynn","Orson","Madeson","Jermaine","Mary","Hall","Otto","Mona","Camille","Andrew","Maris","Ray","Nina","Tanek","Vanna","Tate","Cleo","Briar","Rafael","Hunter","Ian","Caldwell","Felicia","Brock","Odysseus","Tate","Amber","Yvette","Kristen","Giselle","Neil","Noble","Octavia","Uriah","Chiquita","Taylo","Chiquita","Taylor","Rahim","Lana"];
        player.name = names[Math.floor(Math.random() * names.length)];
        player.nameSet = false;
    }
    player = read_cookie("Player");
    if(player == null) {
        player = {};
    }
    if(player.name == null || !player.nameSet) {
        chooseRandomPlayerName();
    }
	
    var recvIdInputA = document.getElementById("receiver-id-a"), recvIdInputB = document.getElementById("receiver-id-b");
    if(player.lastServer != null) {
        setIdText(player.lastServer);
    }
	document.addEventListener('id_updated', function (e) {
	  player.lastServer = e.detail;
	  bake_cookie("Player", player, 1);
	}, false);

    var playerNameInput = document.getElementById("name-code");
    if(player.nameSet) {
        setText(playerNameInput, player.name);
    } else {
		setPlaceholder(playerNameInput, "e.g. " + player.name);
    }
    updatePlayerName = function() {
        if(playerNameInput.value != "") {
        player.name = playerNameInput.value;
        player.nameSet = true;
        bake_cookie("Player", player, 1);
        }
    }
})();

/**
 * Sets games list
 */
function SetGamesList(gamesList) {
    gamesSelect.options.length = 0;
    if(gamesList == null || gamesList.length == 0) {
        gamesSelect.disabled = true;
        playButton.disabled = true;
        var opt = document.createElement('option');
        opt.innerHTML = "No games found!";
        opt.value = "";
        opt.selected = true;
        gamesSelect.appendChild(opt);
        return;
    } else {
        gamesSelect.disabled = false;
        playButton.disabled = false;
        var opt = document.createElement('option');
        opt.innerHTML = "Choose a game...";
        opt.value = "";
        opt.selected = true;
        gamesSelect.appendChild(opt);
    }

    for(var i = 0; i < gamesList.length; i++) {
        var opt = document.createElement('option');
        opt.value = gamesList[i];
        opt.innerHTML = gamesList[i];
        gamesSelect.appendChild(opt);
    }
}

var controllerIFrame = document.getElementById("controller");
var controllerLoaded = false;
controllerIFrame.addEventListener("load", function() {
    controllerLoaded = true;
});

function SetControllerLayout(version, newEnabledButtons, tableButtonCounts) {
    var messageToSend = {"type":"SetLayout", "version":version, "newEnabledButtons":newEnabledButtons, "tableButtonCounts":tableButtonCounts};
    if(controllerLoaded) {
        controllerIFrame.contentWindow.postMessage(messageToSend, "*");
    } else {
        var setLayoutFunct = function (event) {
            controllerIFrame.contentWindow.postMessage(messageToSend, "*");
            controllerIFrame.removeEventListener("load", setLayoutFunct);
        }
        controllerIFrame.addEventListener("load", setLayoutFunct);
    }
}
function SetController(location) {
    controllerLoaded = false;
    controllerIFrame.src = location;
}


function setViewHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
var lastSetVh = 0;
setViewHeight();
// We listen to the resize event
window.addEventListener('resize', () => {
    var nowTime = Date.now();
    lastSetVh = nowTime;
    setTimeout(function() { 
                if(lastSetVh == nowTime)
                    setViewHeight();
            }, 50);
    setViewHeight();
});

(function() {
    var lastTouchEnd = 0;
    window.addEventListener('touchmove', function (e) { e.preventDefault(); e.stopPropagation(); } , false);
    window.addEventListener('touchend', function (e) { 
            if (Date.now() - lastTouchEnd <= 300) {
                console.log("Prevented touchend");
                e.preventDefault();
            }
            lastTouchEnd = Date.now();
        }, false);
    window.addEventListener('gesturestart', function(e){ e.preventDefault(); });
})();