var trace = VIACOM.Schedule.Util.trace;

var App = {scheduleController: null, player: null,
  scheduleIsPlaying: false, 
  waitStart: 0, waitRemaining: 0,
  nextUpItem: null, nextUpMsgStart: 0,
  onAirNowItem: null, onAirNowStart: 0,
  nextApptBlock: null, nextApptMsgStart: 0};

  App.init = function ()
  {
    this.scheduleController = VIACOM.Schedule.Controller; 

    // player setup and event registration. Need better way for player here
    this.player = Object.create(Player);

    this.player.videoStartedCallback = function (uri) {
      App.scheduleController.onPlayerVideoStarted(uri);
    };

    this.player.stepCallback = function () {
      App.scheduleController.step(App.player.canStepThroughPlaylist());
      App.playSchedule();
    };
    // end player stuff

    // Register for "ready" event
    this.scheduleController.addListener('Ready', function() {
      App.sync();
      UI.displayProgram(App.scheduleController.getSchedule(),  document.getElementById("program"));
      App.isReady = true;
    });
    
    this.scheduleController.setup({
      channel: 'test'
    });

    this.handleSkipForward = function (vs) {
      trace("HANDLE: SkipForward");
    };
    this.scheduleController.addListener('SkipForward', this.handleSkipForward);

    this.handleSkipBackward = function (vs) {
      trace("HANDLE: SkipBackward");
    };
    this.scheduleController.addListener('SkipBackward', this.handleSkipBackward);

    this.handleStep = function (vs) {
      trace("HANDLE: Step");
    };
    this.scheduleController.addListener('Step', this.handleStep);

    this.handleLive = function (vs) {
      trace("HANDLE: Live");
    };
    this.scheduleController.addListener('Live', this.handleLive);

    this.handleSyncAnnounce = function(timeUntil) {
      trace("Appt block in: " + timeUntil + " seconds");
    };
    this.scheduleController.addListener('SyncAnounce', this.handleSyncAnnounce);
  };

  App.sync = function () {
    this.scheduleController.goLive();
    this.playSchedule();
  };

  App.playSchedule = function () {
    trace("App.playSchedule");
    var viewerStatus =  this.scheduleController.getViewerStatus();

    if (viewerStatus.wait() > 0) {
      this.player.stop();
      this.waitStart = this.scheduleController.now();
    }
    else {
     trace("telling the controller to play");
     this.scheduleController.play(this.player);
    }
    this.scheduleIsPlaying = true;
    this.nextUpItem = null;
    this.nextApptBlock = null;
  };

  App.skipForward = function () {
    this.scheduleController.skipForward();
    this.playSchedule();
  };

  App.skipBackward = function () {
    this.scheduleController.skipBackward();
    this.playSchedule();
  };

  App.skipToItem = function (blockIndex, itemIndex){
    this.scheduleController.jump(blockIndex, itemIndex);
    this.playSchedule();
  };

  App.onInterval = function () {
    var controller = this.scheduleController;
    
    var viewerStatus = controller.getViewerStatus();
    var now = controller.now();

    if (this.scheduleIsPlaying) {
      // display a "waiting" message
      if (viewerStatus.wait() > 0) {
        this.waitRemaining = this.waitStart + viewerStatus.wait() - now;
        if (this.waitRemaining <= 0) {
          controller.setWait(0);
          this.playSchedule();
        }
      }

      // display an "on air now" message
      if ((now - this.onAirNowStart) > 10000) {
        this.onAirNowItem =  controller.getLiveItem();
        this.onAirNowStart = now;
      }

      // display a "next up" message
      if (this.nextUpItem) {
        // If the next up overlay has been visible for more than 6 seconds, remove it.
        if ((now - this.nextUpMsgStart) > 6000) {
          this.nextUpMsgStart = 0;
          this.nextUpItem = null;
        }
      }
      else {
        if (this.player.playing) {
          var secondsToPlay = Math.floor((this.player.duration - this.player.offset) / 1000);
          if (secondsToPlay == 9) {
            // If the next up item starts in 9 seconds and is not hidden, show next up overlay
            var item = controller.getNextUpItem();
            if (!item.hidden) {
              this.nextUpItem = item;
              this.nextUpMsgStart = now;
            }
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
        for (var a = 0; a < controller.getSchedule().apptBlocks.length; a++)
        {
          var blockIndex = controller.getSchedule().apptBlocks[a];
          var secondsUntilAppt = Math.floor(controller.timeUntilBlockStart(blockIndex) / 1000);
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
