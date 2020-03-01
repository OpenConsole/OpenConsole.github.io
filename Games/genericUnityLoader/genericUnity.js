var strict = true;
var consolePageLocation = "https://openconsole.github.io";

(function () {
    function receiveMessage(event) {
        // Do we trust the sender of this message?
        if (event.origin !== consolePageLocation && strict)
            return;
        
        UnityLoader.instantiate("gameContainer", event.data, {onProgress: UnityProgress});
    }
    window.addEventListener("message", receiveMessage, false);
})();

//UnityLoader.instantiate("gameContainer", "../MazeGame/.json", {onProgress: UnityProgress});


(function() {
    var myHeight, myWidth;
    var gCont = document.getElementById('gameContainer');

    SetGameSize = function () {
        reportSize();
        gCont.style.width = myWidth + 'px';
        gCont.style.height = myHeight + 'px';

        var gCanv = document.getElementById('#canvas');
        if(gCanv) {
            gCanv.width = myWidth;
            gCanv.height = myHeight;
        }
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

    window.setInterval(function(){
        var gCanv = document.getElementById('#canvas');
        if(gCanv) {
            gCanv.width = myWidth;
            gCanv.height = myHeight;
        }
    }, 100);
    
    SetGameSize();
})();