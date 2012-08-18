var trace = VIACOM.Schedule.Util.trace;

var App = {programController: null, player: null,
  programIsPlaying: false, 
  waitStart: 0, waitRemaining: 0,
  nextUpItem: null, nextUpMsgStart: 0,
  onAirNowItem: null, onAirNowStart: 0,
  nextApptBlock: null, nextApptMsgStart: 0};

  App.init = function () {
    //this.programController = Object.create(ProgramController);
    this.programController = VIACOM.Schedule.Controller; 
    this.player = Object.create(Player);



    this.programController.setup({
      channel: 'test',
      player: this.player,
    });

    this.player.videoStartedCallback = function (uri) {
      App.programController.onPlayerVideoStarted(uri);
    };

    this.player.stepCallback = function () {
      App.programController.step(App.player.canStepThroughPlaylist());
      App.playProgram();
    };


    this.handleSkipForward = function (vs) {
      trace("HANDLE: SkipForward");
    }
    VIACOM.Schedule.Controller.addListener('SkipForward', this.handleSkipForward);


    this.handleSkipBackward = function (vs) {
      trace("HANDLE: SkipBackward");
    }
    VIACOM.Schedule.Controller.addListener('SkipBackward', this.handleSkipBackward);


    this.handleStep = function (vs) {
      trace("HANDLE: Step");
    }
    VIACOM.Schedule.Controller.addListener('Step', this.handleStep);


    this.handleLive = function (vs) {
      trace("HANDLE: Live");
    }
    VIACOM.Schedule.Controller.addListener('Live', this.handleLive);


    this.handleReady = function (vs) {
      trace("HANDLE: Ready");
    }
    VIACOM.Schedule.Controller.addListener('Ready', this.handleReady);



  };


  App.loadProgram = function (program) {
    this.programIsPlaying = false;
    this.player.stop();
    //this.programStatus = this.programController.getViewerStatus();
    this.sync();
  };


  App.sync = function () {
    this.programController.goLive();
    this.playProgram();
  };

  App.playProgram = function () {
    var viewerStatus =  this.programController.getViewerStatus();

    if (viewerStatus.wait() > 0) {
      this.player.stop();
      this.waitStart = this.programController.now();
    }
    else {
      this.programController.play(this.player);
    }
    this.programIsPlaying = true;
    this.nextUpItem = null;
    this.nextApptBlock = null;
  };

  App.skipForward = function () {
    this.programController.skipForward();
    this.playProgram();
  };

  App.skipBackward = function () {
    this.programController.skipBackward();
    this.playProgram();
  };

  App.skipToItem = function (blockIndex, itemIndex){
    this.programController.jump(blockIndex, itemIndex);
    this.playProgram();
  };

  App.onInterval = function () {
    var viewerStatus =  this.programController.getViewerStatus();
    var now = this.programController.now()

    if (this.programIsPlaying) {
      // display a "waiting" message
      if (viewerStatus.wait() > 0) {
        this.waitRemaining = this.waitStart + viewerStatus.wait() - now;
        if (this.waitRemaining <= 0) {
          this.programController.setWait(0);
          this.playProgram();
        }
      }

      // display an "on air now" message
      if ((now - this.onAirNowStart) > 10000) {
        this.onAirNowItem =  this.programController.getLiveItem();
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
            var item = this.programController.getNextUpItem();
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
        for (var a = 0; a < VIACOM.Schedule.Service.getSchedule().apptBlocks.length; a++)
        {
        
          var blockIndex = VIACOM.Schedule.Service.getSchedule().apptBlocks[a];
          var secondsUntilAppt = Math.floor(this.programController.timeUntilBlockStart(blockIndex) / 1000);
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
