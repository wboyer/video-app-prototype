var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};
VIACOM.Schedule.Util = VIACOM.Schedule.Util || {}; 

VIACOM.enableTrace = true;

// Common utility methods
VIACOM.Schedule.Util = ( function() {
  // Writes trace output messages into a div named "trace-output" if the div exists and
  // MTVN.enableTrace is true.
  var trace = function(msg) {
    if(VIACOM.enableTrace) {
      if(window['console']) {
        console.log('[TRACE] ' + new Date().toString() + ' - VIACOM.Schedule.Controller - ' + msg);
      }
      var t = document.getElementById('trace-output');
      if(t) {
        t.innerHTML += '=&gt; ' + msg + '<br>';
      }
    }
  };
  return {
    'trace' : trace
  };
}());

