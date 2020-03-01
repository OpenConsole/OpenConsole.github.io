var funhash = function(s) {
    for(var i = 0, h = 0xdeadbeef; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    return btoa((h ^ h >>> 16) >>> 0).slice(0, -2); 
};
var getId = function(a, b) {
    return funhash("a" + a) + funhash("b" + b);
};




var maximizedEvent = new Event('maximized');

function doneScreenChange() {
    document.dispatchEvent(maximizedEvent);
}
    
/* View in fullscreen */
function openFullscreen() {
  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen().then(e => { doneScreenChange(); });
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen().then(e => { doneScreenChange(); });
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen().then(e => { doneScreenChange(); });
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem.msRequestFullscreen().then(e => { doneScreenChange(); });
  }
}

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen().then(e => { doneScreenChange(); });
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen().then(e => { doneScreenChange(); });
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen().then(e => { doneScreenChange(); });
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen().then(e => { doneScreenChange(); });
  }
}

/* Close fullscreen */
function toggleFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen().then(e => { doneScreenChange(); }).catch(e => { openFullscreen(); });
  } else if (document.mozCancelFullScreen) { /* Firefox */
    document.mozCancelFullScreen().then(e => { doneScreenChange(); }).catch(e => { openFullscreen(); });
  } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
    document.webkitExitFullscreen().then(e => { doneScreenChange(); }).catch(e => { openFullscreen(); });
  } else if (document.msExitFullscreen) { /* IE/Edge */
    document.msExitFullscreen().then(e => { doneScreenChange(); }).catch(e => { openFullscreen(); });
  }
}