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
    this.scheduleController = VIACOM.Schedule.Controller; 

    this.player = Object.create(Player);

    this.player.videoStartedCallback = function (uri) {
      VIACOM.Schedule.Controller.onPlayerVideoStarted(App.activeScheduleContext, uri);
    };

    this.player.stepCallback = function () {
      App.playSchedule(VIACOM.Schedule.Controller.step(App.activeScheduleContext, App.player.canStepThroughPlaylist()));
    };

    // Register for "ready" event
    this.scheduleController.addListener('Ready', function() {
      App.scheduleController.loadSchedule('remote', 'http://plateng.mtvi.com/apsv/scheduler/feeds/cc-exampple.php', function (context) {
        App.playSchedule(context);
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

  App.playSchedule = function (context) {
    trace("App.playSchedule");
    var controller = this.scheduleController;

    this.activeScheduleContext = context;
    this.nextUpContext = null;
    this.nextApptBlock = null;

    if (context.wait > 0) {
      this.player.stop();
      this.waitStart = this.scheduleController.now();
    }
    else {
     trace("telling the controller to play");
     controller.play(context, this.player);
    }
  };

  App.skipForward = function () {
    this.playSchedule(this.scheduleController.skipForward(this.activeScheduleContext));
  };

  App.skipBackward = function () {
    this.playSchedule(this.scheduleController.skipBackward(this.activeScheduleContext));
  };

  App.jumpToItem = function (blockIndex, itemIndex) {
    var context = this.scheduleController.newContext(this.activeScheduleContext.schedule);
    this.playSchedule(this.scheduleController.jump(context, blockIndex, itemIndex));
  };

  App.sync = function () {
    this.playSchedule(this.scheduleController.sync(this.activeScheduleContext));
  };

  App.onInterval = function () {
    var controller = this.scheduleController;
    var context = this.activeScheduleContext;
    var schedule = context.schedule;
    
    var now = controller.now();

    if (this.activeScheduleContext) {
      // display a "waiting" message
      if (context.wait > 0) {
        this.waitRemaining = this.waitStart + context.wait - now;
        if (this.waitRemaining <= 0) {
          context.wait = 0;
          this.playSchedule(context);
        }
      }

      // display an "on air now" and "on air next" messages
      if ((now - this.onAirNowStart) > 10000) {
        this.onAirNowContext = controller.getLiveContext(context);
        this.onAirNextContext = controller.cloneContext(this.onAirNowContext);
        controller.skipForward(this.onAirNextContext);
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
            controller.describe(context,
                function(startTime, videoMeta, playlistMeta, duration)
                {
                  var currentVideoMeta = videoMeta;
                  var nextUpContext = controller.getNextUpContext(context);

                  controller.describe(nextUpContext,
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
          var secondsUntilAppt = Math.floor(controller.timeUntilBlockStart(schedule, blockIndex) / 1000);
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
