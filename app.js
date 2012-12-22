var trace = VIACOM.Schedule.Util.trace;

var App = {
  player: null,
  scheduleController: null, activeScheduleContext: null,
  waitStart: 0, waitRemaining: 0,
  nextUpContext: null, nextUpMsgStart: 0,
  onAirNowContext: null, onAirNextContext: null, onAirNowStart: 0,
  nextApptBlock: null, nextApptMsgStart: 0
};

  App.init = function ()
  {
    this.scheduleController = VIACOM.Schedule.PlayoutController; 

    this.player = Object.create(Player);

    //???
    this.player.videoStartedCallback = function (uri) {
      App.activeSession.onPlayerVideoStarted(App.activeScheduleContext, uri);
    };

    //???
    this.player.stepCallback = function () {
      App.activeSession.step(App.activeScheduleContext, App.player.canStepThroughPlaylist());
      App.playSchedule(App.activeSession);
    };

    // Register for "ready" event
    this.scheduleController.addListener('Ready', function() {
      App.scheduleController.loadSchedule('remote', 'http://plateng.mtvi.com/apsv/scheduler/feeds/cc-exampple.php', function (session) {
        App.playSchedule(session);
        UI.displaySchedule(App, document.getElementById("schedule"));
      });
    });
    
    this.scheduleController.setup();

    this.handleSkipForward = function (context) {
      trace("HANDLE: SkipForward");
    };
    this.scheduleController.addListener('remote', 'SkipForward', this.handleSkipForward);

    this.handleSkipBackward = function (context) {
      trace("HANDLE: SkipBackward");
    };
    this.scheduleController.addListener('remote', 'SkipBackward', this.handleSkipBackward);

    this.handleStep = function (context) {
      trace("HANDLE: Step");
    };
    this.scheduleController.addListener('remote', 'Step', this.handleStep);

    this.handleLive = function (context) {
      trace("HANDLE: Live");
    };
    this.scheduleController.addListener('Live', this.handleLive);
  };

  App.playSchedule = function (session) {
    trace("App.playSchedule");
    var controller = this.scheduleController;

    this.activeScheduleContext = session.context;
    this.activeSession = session;

    this.liveSession = VIACOM.Schedule.PlayoutSession();
    this.liveSession.init(this.activeSession.context.schedule, controller);
    this.nextUpContext = null;
    this.nextApptBlock = null;

    if (session.context.wait > 0) {
      this.player.stop();
      this.waitStart = this.scheduleController.now();
    }
    else {
     trace("telling the controller to play");
     this.activeSession.play(this.player);
    }
  };

  App.skipForward = function () {
    this.activeSession.skipForward();
    this.playSchedule(this.activeSession);
  };

  App.skipBackward = function () {
    this.activeSession.skipBackward();
    this.playSchedule(this.activeSession);
  };

  App.jumpToItem = function (blockIndex, itemIndex) {
    //var context = this.scheduleController.newContext(this.activeScheduleContext.schedule);
    this.activeSession.jump(blockIndex, itemIndex);
    this.playSchedule(this.activeSession);
  };

  App.sync = function () {
    this.activeSession.sync();
    this.playSchedule(this.activeSession);
  };

  App.onInterval = function () {
    var controller = this.scheduleController;
    var context = this.activeSession.context;
    var schedule = context.schedule;
    var liveSession =  VIACOM.Schedule.PlayoutSession();
    liveSession.init(schedule, controller);
    var liveNextSession =  VIACOM.Schedule.PlayoutSession();
    liveNextSession.init(schedule, controller);

    
    var now = controller.now();

    if (this.activeSession) {
      // display a "waiting" message
      if (context.wait > 0) {
        this.waitRemaining = this.waitStart + context.wait - now;
        if (this.waitRemaining <= 0) {
          context.wait = 0;
          this.playSchedule(this.activeSession);
        }
      }

      // display an "on air now" and "on air next" messages
      if ((now - this.onAirNowStart) > 10000) {
        liveSession.sync();
        liveNextSession.sync();
        liveNextSession.skipForward();
        this.onAirNowContext = liveSession.context;
        this.onAirNextContext = liveNextSession.context;
        this.onAirNowStart = now;
      }

      // display a "next up" message
      if (this.nextUpContext) {
        // If the next up overlay has been visible for more than 6 seconds, remove it.
        if ((now - this.nextUpMsgStart) > 6000) {
          this.nextUpMsgStart = 0;
          this.nextUpContext = null;
        }
      }
      else {
        if (this.player.playing) {
          // If the next up item starts in 9 seconds, and will be described differently than
          // the one currently playing, then put up a "next up" message.
          var secondsToPlay = Math.floor((this.player.duration - this.player.offset) / 1000);
          if (secondsToPlay == 9) {
            this.activeSession.describe(
                function(startTime, videoMeta, playlistMeta, duration)
                {
                  var currentVideoMeta = videoMeta;
                  var nextUpSession = VIACOM.Schedule.PlayoutSession();
                  nextUpSession.init(App.activeSession.context.schedule, controller);

                  nextUpSession.describe(
                      function(startTime, videoMeta, playlistMeta, duration)
                      {
                        if (videoMeta != currentVideoMeta) {
                          App.nextUpContext = nextUpContext;
                          App.nextUpMsgStart = now;
                        }
                      }
                  );
                }
            );
          }
        }
      }

      // display a "live soon" message
      if (this.nextApptBlock) {
        if ((now - this.nextApptMsgStart) > 20000) {
          this.nextApptMsgStart = 0;
          this.nextApptBlock = null;
        }
      }
      else {
        for (var a = 0; a < schedule.apptBlocks.length; a++)
        {
          var blockIndex = schedule.apptBlocks[a];
          var secondsUntilAppt = Math.floor(this.activeSession.timeUntilBlockStart(schedule, blockIndex) / 1000);
          if (
            ((secondsUntilAppt < 3600) && (secondsUntilAppt >= 3599)) ||
              ((secondsUntilAppt < 1800) && (secondsUntilAppt >= 1799)) ||
                ((secondsUntilAppt < 300) && (secondsUntilAppt >= 299)) ||
                  ((secondsUntilAppt < 60) && (secondsUntilAppt >= 59)) ||
                    ((secondsUntilAppt < 0) && (secondsUntilAppt >= -1)) ) {
            if (!this.nextApptBlock || (secondsUntilAppt < 0)) {
              this.nextApptBlock = blockIndex;
              this.nextApptMsgStart = now;
              break;
            }
          }
        }
      }
    }
  };
