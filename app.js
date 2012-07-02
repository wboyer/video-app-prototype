var App = {programController: null, programStatus: null, programActive: false, waitStart: 0, waitRemaining: 0, nextUpItem: null, nextUpMsgStart: 0, nextApptBlock: null, nextApptMsgStart: 0};

App.init = function (programController)
{
	this.programController = programController;
	this.programStatus = Object.create(ProgramStatus);

	Player.stepCallback = function () {
		var now = new Date().getTime();
		App.programController.stepForward(now, App.programStatus);
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
	
	this.programActive = true;
	this.nextUpItem = null;
	this.nextApptBlock = null;
};

App.onInterval = function (now)
{
	if (this.programActive) {
		var programStatus = this.programStatus;
		
		// display a "waiting" message
		if (programStatus.wait > 0) {
			this.waitRemaining = Math.floor(programStatus.wait - (now - this.waitStart) / 1000);
			if (this.waitRemaining <= 0) {
				programStatus.wait = 0;
				this.playProgram(now);
			}
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
					var trialProgramStatus = Object.create(ProgramStatus);
					trialProgramStatus.clone(programStatus);
					this.programController.stepForward(now, trialProgramStatus);
					this.nextUpItem = this.programController.program.blocks[trialProgramStatus.blockIndex].items[trialProgramStatus.itemIndex];
					this.nextUpMsgStart = now;
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
		if (this.programController.apptBlocks.length > 0) {
			var blockIndex = this.programController.apptBlocks[0];
			var secondsUntilAppt = Math.floor((this.programController.blockStartTime(blockIndex) - now) / 1000);
			if (
					((secondsUntilAppt <= 2640) && (secondsUntilAppt >= 2639)) ||
					((secondsUntilAppt <= 1800) && (secondsUntilAppt >= 1799)) ||
					((secondsUntilAppt <= 360) && (secondsUntilAppt >= 359)) ||
					((secondsUntilAppt <= 300) && (secondsUntilAppt >= 299)) ||
					((secondsUntilAppt <= 60) && (secondsUntilAppt >= 59)) ||
					((secondsUntilAppt <= 1) && (secondsUntilAppt >= -30))
				) {
				this.nextApptBlock = blockIndex;
				this.nextApptMsgStart = now;
			}
		}
	}
};

