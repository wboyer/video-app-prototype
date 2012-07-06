var App = {programController: null, programStatus: null, programIsPlaying: false, 
			waitStart: 0, waitRemaining: 0, 
			nextUpItem: null, nextUpMsgStart: 0, 
			onAirNowItem: null, onAirNowStart: 0, 
			nextApptBlock: null, nextApptMsgStart: 0};

App.init = function (programController)
{
	this.programController = programController;
	this.programStatus = Object.create(ProgramStatus);

	Player.videoStartedCallback = function (uri) {
		App.programController.onPlayerVideoStarted(uri, App.programStatus);
		App.onAirNowStart = 0;
	};

	Player.stepCallback = function () {
		var now = new Date().getTime();
		App.programController.stepForward(now, App.programStatus, Player.canStepThroughPlaylist());
		App.playProgram(now);
	};

	this.sync();
};

App.sync = function ()
{
	var now = new Date().getTime();
	this.programController.sync(now, this.programStatus);
	this.playProgram(now);
};

App.skipForward = function ()
{
	var now = new Date().getTime();
	this.programController.skipForward(now, this.programStatus);
	this.playProgram(now);
};

App.skipBackward = function ()
{
	var now = new Date().getTime();
	this.programController.skipBackward(now, this.programStatus);
	this.playProgram(now);
};

App.skipToItem = function (blockIndex, itemIndex)
{
	var now = new Date().getTime();
	this.programController.skipToItem(now, this.programStatus, blockIndex, itemIndex);
	this.playProgram(now);
};

App.playProgram = function (now)
{
	var programStatus = this.programStatus;
	
	if (programStatus.wait > 0) {
		Player.init();
		this.waitStart = now;
	}
	else
		this.programController.playProgram(Player, programStatus);
	
	this.programIsPlaying = true;
	this.nextUpItem = null;
	this.nextApptBlock = null;
};

App.onInterval = function (now)
{
	if (this.programIsPlaying) {
		var programStatus = this.programStatus;
		
		// display a "waiting" message
		if (programStatus.wait > 0) {
			this.waitRemaining = Math.floor(programStatus.wait - (now - this.waitStart) / 1000);
			if (this.waitRemaining <= 0) {
				programStatus.wait = 0;
				this.playProgram(now);
			}
		}
		
		// display an "on air now" message
		if ((now - this.onAirNowStart) > 10000) {
			var tmpProgramStatus = Object.create(ProgramStatus);
			tmpProgramStatus.clone(programStatus);
			this.programController.sync(now, tmpProgramStatus);
			this.onAirNowItem = this.programController.program.blocks[tmpProgramStatus.blockIndex].items[tmpProgramStatus.itemIndex];
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
			if (Player.playing) {
				var secondsToPlay = Player.duration - Math.floor(Player.offset / 1000);
				if ((secondsToPlay <= 10) && (secondsToPlay >= 9)) {
					var tmpProgramStatus = Object.create(ProgramStatus);
					tmpProgramStatus.clone(programStatus);
					this.programController.stepForward(now, tmpProgramStatus);
					var item = this.programController.program.blocks[tmpProgramStatus.blockIndex].items[tmpProgramStatus.itemIndex];
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
		for (var a = 0; a < this.programController.apptBlocks.length; a++)
		{
			var blockIndex = this.programController.apptBlocks[a];
			var secondsUntilAppt = this.programController.secondsUntilBlockStart(now, blockIndex);
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
