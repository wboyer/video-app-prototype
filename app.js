var App = {programController: null, programStatus: null, player: null,
			programIsPlaying: false, 
			waitStart: 0, waitRemaining: 0,
			nextUpItem: null, nextUpMsgStart: 0,
			onAirNowItem: null, onAirNowStart: 0,
			nextApptBlock: null, nextApptMsgStart: 0};

App.init = function ()
{
	//this.programController = Object.create(ProgramController);
  this.programController = VIACOM.Schedule.Controller; 
	this.player = Object.create(Player);
	
	this.player.videoStartedCallback = function (uri) {
		App.programController.onPlayerVideoStarted(uri, App.programStatus);
	};

	this.player.stepCallback = function () {
		var now = new Date().getTime();
		App.programController.stepForward(App.programStatus, App.player.canStepThroughPlaylist());
		App.playProgram(now);
	};
};

App.loadProgram = function (program)
{
	this.programIsPlaying = false;
	this.player.stop();
	this.programStatus = this.programController.loadProgram(program);
	this.sync();
};

App.sync = function ()
{
	var now = new Date().getTime();
	this.programController.goLive(this.programStatus);
	this.playProgram(now);
};

App.playProgram = function (now)
{
	var programStatus = this.programStatus;
	
	if (programStatus.wait > 0) {
		this.player.stop();
		this.waitStart = now;
	}
  else {
    this.programController.play(this.player, programStatus);
  }
	this.programIsPlaying = true;
	this.nextUpItem = null;
	this.nextApptBlock = null;
};

App.skipForward = function ()
{
	var now = new Date().getTime();
	this.programController.skipForward(this.programStatus);
	this.playProgram(now);
};

App.skipBackward = function ()
{
	var now = new Date().getTime();
	this.programController.skipBackward(this.programStatus);
	this.playProgram(now);
};

App.skipToItem = function (blockIndex, itemIndex)
{
	var now = new Date().getTime();
	this.programController.jump(this.programStatus, blockIndex, itemIndex);
	this.playProgram(now);
};

App.onInterval = function (now)
{
	var programStatus = this.programStatus;

	if (this.programIsPlaying) {
		// display a "waiting" message
		if (programStatus.wait > 0) {
			this.waitRemaining = this.waitStart + programStatus.wait - now;
			if (this.waitRemaining <= 0) {
				programStatus.wait = 0;
				this.playProgram(now);
			}
		}
		
		// display an "on air now" message
		if ((now - this.onAirNowStart) > 10000) {
			var tmpProgramStatus = Object.create(programStatus);
			tmpProgramStatus.clone(programStatus);
			this.programController.goLive(tmpProgramStatus);
			this.onAirNowItem = tmpProgramStatus.currentItem();
			this.onAirNowStart = now;
		}
		
		// display a "next up" message
		if (this.nextUpItem) {
			if ((now - this.nextUpMsgStart) > 6000) {
				this.nextUpMsgStart = 0;
				this.nextUpItem = null;
			}
		}
		else
			if (this.player.playing) {
				var secondsToPlay = Math.floor((this.player.duration - this.player.offset) / 1000);
				if (secondsToPlay == 9) {
					var tmpProgramStatus = Object.create(programStatus);
					tmpProgramStatus.clone(programStatus);
					this.programController.stepForward(tmpProgramStatus);
					var item = tmpProgramStatus.currentItem();
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
	else
		for (var a = 0; a < programStatus.program.apptBlocks.length; a++)
		{
			var blockIndex = programStatus.program.apptBlocks[a];
			var secondsUntilAppt = Math.floor(this.programController.timeUntilBlockStart(programStatus.program, blockIndex) / 1000);
			if (
					((secondsUntilAppt < 3600) && (secondsUntilAppt >= 3599)) ||
					((secondsUntilAppt < 1800) && (secondsUntilAppt >= 1799)) ||
					((secondsUntilAppt < 300) && (secondsUntilAppt >= 299)) ||
					((secondsUntilAppt < 60) && (secondsUntilAppt >= 59)) ||
					((secondsUntilAppt < 0) && (secondsUntilAppt >= -1))
				)
				if (!this.nextApptBlock || (secondsUntilAppt < 0)) {
					this.nextApptBlock = blockIndex;
					this.nextApptMsgStart = now;
					break;
				}
		}
};
