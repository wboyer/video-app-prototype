var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};
VIACOM.Schedule.Preview = VIACOM.Schedule.Preview || {}; 

VIACOM.enableTrace = true;


// create a player
// get controller singleton
// set up controller
// get viewSession
//
// create mediator
// -- mediator
// -- session
//
// create a test start time? no


VIACOM.Schedule.Preview = ( function() {

  var trace = VIACOM.Schedule.Util.trace;

  var activeSession, thePlayer, session;

  var theController = VIACOM.Schedule.PlayoutController;

  var load = function(channelId, scheduleId, start) {

    trace('loading preview (' + channelId + ', ' + scheduleId+ ', ' + start);
    

    theController.addListener('Ready', function() {
      theController.loadSchedule('remote', 'http://schedule.mtvnservices-q.mtvi.com/api/v1/' + channelId + '/schedule.json?view=controller&version=' + scheduleId, function (session) {
        trace("Controller Ready, Schedule loaded.");
        activeSession = session;

        activeSession.stepToNewBlock(start.getTime());
        var firstItem = activeSession.getCurrentItem();

        trace('Initializing player with: ' + firstItem.videoUri);
        thePlayer = new MTVNPlayer.Player('player', {
          uri: firstItem.videoUri,
          width : 640,
          height : 320,
          flashVars : { autoPlay : true }
        },
        {
          onReady:function(event) {
            trace("player onReady");
          },
          onPlaylistComplete:function(event) {
            trace('player onPlaylistComplete');
            activeSession.step(false);
            trace('now play: ' + activeSession.getCurrentItem().videoUri);
            event.target.playURI(activeSession.getCurrentItem().videoUri);
          }
        });
      });
    });

    theController.setup({
        maxDriftMsec: 100000000000,
        initialTimeUTC: start.getTime()
    });
    
    return theController;
  };
  
  var skipForward = function() {
	  activeSession.skipForward();
	  thePlayer.playURI(activeSession.getCurrentItem().videoUri);
  };
  
  var skipBackward = function() {
	  activeSession.skipBackward();
	  thePlayer.playURI(activeSession.getCurrentItem().videoUri);
  };


  return {
    'load' : load,
    'skipForward' : skipForward,
    'skipBackward' : skipBackward
  };
}());

