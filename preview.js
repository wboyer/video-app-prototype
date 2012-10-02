var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};
VIACOM.Schedule.Preview = VIACOM.Schedule.Preview || {}; 

VIACOM.enableTrace = true;


VIACOM.Schedule.Preview = ( function() {

  var trace = VIACOM.Schedule.Util.trace;

  var activeContext, thePlayer;

  var theController = theController = VIACOM.Schedule.Controller;

  var load = function(channelId, scheduleId, start) {

    trace('loading preview');
    trace('channel: ' + channelId);
    trace('schedule: ' + scheduleId);
    trace('start time ' + start)

    

    theController.addListener('Ready', function() {
      theController.loadSchedule('remote', 'http://plateng.mtvi.com/apsv/scheduler/feeds/cc-exampple.php', function (context) {
        trace("Controller Ready, Schedule loaded.");
        activeContext = context;
        
        theController.stepToTime(context, start.getTime())

        var firstItem = theController.getCurrentItem(context);


        thePlayer = new MTVNPlayer.Player('player', {
          uri: firstItem.videoUri,
          width : 640,
          height : 320,
          flashVars : { autoPlay : true }
        },
        {
          onReady:function(event) {
            trace("player onReady");
            //event.target.play();
            //tell the controller we're ready
          },
          onPlaylistComplete:function(event) {
            trace('player onPlaylistComplete');
            theController.step(activeContext, true);
            trace('now play: ' + theController.getCurrentItem(activeContext).videoUri);
            event.target.playURI(theController.getCurrentItem(activeContext).videoUri);
          }
        });
      });
    });

    theController.setup();
    
  };


  return {
    'load' : load,
  };
}());


