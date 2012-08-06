var App = {programController: null, programStatus: null, player: null,
  programIsPlaying: false, 
  waitStart: 0, waitRemaining: 0,
  nextUpItem: null, nextUpMsgStart: 0,
  onAirNowItem: null, onAirNowStart: 0,
  nextApptBlock: null, nextApptMsgStart: 0};

  App.init = function () {
    //this.programController = Object.create(ProgramController);
    this.programController = VIACOM.Schedule.Controller; 
    this.player = Object.create(Player);

    this.player.videoStartedCallback = function (uri) {
      App.programController.onPlayerVideoStarted(uri);
    };

    this.player.stepCallback = function () {
      App.programController.stepForward(App.player.canStepThroughPlaylist());
      App.playProgram();
    };
  };


  //TODO get rid of this call
  App.loadProgram = function (program) {
    this.programIsPlaying = false;
    this.player.stop();
    this.programStatus = this.programController.getViewerStatus();
    this.sync();
  };


  App.sync = function () {
    this.programController.goLive();
    this.playProgram();
  };

  App.playProgram = function (now) {
    var programStatus = this.programStatus;

    if (programStatus.wait() > 0) {
      this.player.stop();
      this.waitStart = now;
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
    this.programController.jump(this.programStatus, blockIndex, itemIndex);
    this.playProgram();
  };

  App.onInterval = function () {
    var programStatus = this.programStatus;
    var now = this.programController.now()

    if (this.programIsPlaying) {
      // display a "waiting" message
      if (programStatus.wait() > 0) {
        this.waitRemaining = this.waitStart + programStatus.wait - now;
        if (this.waitRemaining <= 0) {
          //TODO this should be remvoced or done differently
          //programStatus.wait = 0;
          this.playProgram();
        }
      }

      // display an "on air now" message
      if ((now - this.onAirNowStart) > 10000) {
        //TODO none of this will work now
        //var tmpProgramStatus = Object.create(programStatus);
        //tmpProgramStatus.clone(programStatus);
        //this.programController.goLive(tmpProgramStatus);
       	//var liveStatus =  this.programController.getLiveStatus();
 
        this.onAirNowItem =  this.programController.getLiveItem();
        this.onAirNowStart = now;
      }

      // display a "next up" message
      if (this.nextUpItem) {
        if ((now - this.nextUpMsgStart) > 6000) {
          this.nextUpMsgStart = 0;
          this.nextUpItem = null;
        }
      }
      else {
        //TODO This is going to break.
        if (this.player.playing) {
          var secondsToPlay = Math.floor((this.player.duration - this.player.offset) / 1000);
          if (secondsToPlay == 9) {
            //TODO create nextUp method in controller
            //	var tmpProgramStatus = Object.create(programStatus);
            //	tmpProgramStatus.clone(programStatus);
            //	this.programController.stepForward(tmpProgramStatus);
            //	var item = tmpProgramStatus.currentItem();
            //		if (!item.hidden) {
            //			this.nextUpItem = item;
            //			this.nextUpMsgStart = now;
            //		}
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
