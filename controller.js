var ProgramStatus = {blockIndex: 0, itemIndex: 0, wait: 0, offset: 0, hasLoopedBlock: false};

ProgramStatus.init = function ()
{
	this.blockIndex = 0;
	this.itemIndex = 0;
	this.wait = 0;
	this.offset = 0;
	this.hasLoopedBlock = false;
};

ProgramStatus.clone = function (programStatus)
{
	this.blockIndex = programStatus.blockIndex;
	this.itemIndex = programStatus.itemIndex;
	this.wait = programStatus.wait;
	this.offset = programStatus.offset;
	this.hasLoopedBlock = programStatus.hasLoopedBlock;
};

var ProgramController = {program: null, apptBlocks: null};

ProgramController.loadProgram = function (program)
{
	this.program = program;
	program.startTime = Date.parse(program.start);
	
	this.apptBlocks = [];
	for (var b = 0; b < program.blocks.length; b++)
		if (program.blocks[b].appt)
			this.apptBlocks[this.apptBlocks.length] = b;
};

ProgramController.blockStartTime = function (b)
{
	var program = this.program;
	return program.startTime + program.blocks[b].start * 1000;
};

ProgramController.sync = function (now, status)
{
	status.init();

	var program = this.program;
	
	if ((program.blocks.length == 0) || (program.blocks[0].items.length == 0))
		return false;
	
	var time = this.blockStartTime(0);

	var done = false;
	
	while (!done) {
		this.syncToTime(time, status);
		
		time += status.wait * 1000;

		if (time > now) {
			status.wait = Math.floor((time - now) / 1000);
			time = now;
			done = true;
		}
		else {
			status.wait = 0;
			
			var block = program.blocks[status.blockIndex];
			var item = block.items[status.itemIndex];
			
			time += item.duration * 1000;

			if (time > now) {
				done = true;				
				if (block.dll || item.dll)
					time -= item.duration * 1000;
				else
					status.offset = item.duration - Math.floor((time - now) / 1000);
			}
		}
		
		if (!done)
			status.itemIndex += 1;
	}

	return true;
};

// private
ProgramController.syncToTime = function (time, status)
{
	var program = this.program;
	var timeOffset = Math.floor((time - program.startTime) / 1000);

	var b = status.blockIndex;
	var i = status.itemIndex;

	var blocks = program.blocks;
	var block = blocks[b];

	var hasLoopedBlock = status.hasLoopedBlock;

	var done = false;
	
	while (!done)
	{
		done = true;

		if (i >= block.items.length) {
			i = 0;
			hasLoopedBlock = true;
		}

		if (b + 1 < blocks.length) {
			var nextBlock = blocks[b + 1];
			var timeUntilBlockStart = nextBlock.start - timeOffset;
		
			var mssl = block.mssl;
			if (block.appt)
				mssl = 0;

			if ((mssl >= 0) && (block.items[i].duration - timeUntilBlockStart > mssl) && (hasLoopedBlock || !block.dfe)) {
				b += 1;
				i = 0;
				block = blocks[b];
				hasLoopedBlock = false;
				done = false;
			}
		}
	}

	status.wait = 0;
	status.offset = 0;
	
	if (b != status.blockIndex) {
		var timeUntilBlockStart = block.start - timeOffset;
		
		var msse = block.msse;
		if (block.appt)
			msse = 0;
		
		if ((msse >= 0) && (timeUntilBlockStart > msse))
			status.wait = timeUntilBlockStart - msse;

		status.blockIndex = b;
		status.hasLoopedBlock = false;
	}
	else
		if (hasLoopedBlock)
			status.hasLoopedBlock = true;
	
	status.itemIndex = i;
};

ProgramController.stepForward = function (now, status)
{
	status.itemIndex += 1;
	this.syncToTime(now, status);
};

ProgramController.skipForward = function (now, status)
{
	var program = this.program;

	var b = status.blockIndex;
	var i = status.itemIndex;

	var blocks = program.blocks;
	var block = blocks[b];

	if (status.wait > 0)
		if (block.appt)
			i = block.items.length;
		else {
			status.wait = 0;
			return;
		}
	else
		i += 1;

	if (i >= block.items.length) {
		i = 0;
		if (b + 1 < blocks.length)
			b += 1;
		else
			b = 0;
	}

	this.skipToItem(now, status, b, i);
};

ProgramController.skipBackward = function (now, status)
{
	var program = this.program;

	var b = status.blockIndex;
	var i = status.itemIndex;

	var blocks = program.blocks;

	if (status.wait > 0)
		i = -1;
	else
		i -= 1;

	if (i < 0) {
		if (b > 0)
			b -= 1;
		else
			b = blocks.length - 1;
		i = blocks[b].items.length - 1;
	}

	this.skipToItem(now, status, b, i);
};

ProgramController.skipToItem = function (now, status, b, i)
{
	var program = this.program;

	block = program.blocks[b];

	if (b != status.blockIndex)
		status.hasLoopedBlock = false;

	status.wait = 0;
	status.offset = 0;

	if (block.appt) {
		var nowOffset = Math.floor((now - program.startTime) / 1000);
	
		if (block.start > nowOffset) {
			status.wait = block.start - nowOffset;
			i = 0;
		}
	}

	status.blockIndex = b;
	status.itemIndex = i;
};

ProgramController.playProgram = function (player, status, b, i)
{
	var item = this.program.blocks[status.blockIndex].items[status.itemIndex];
	player.play(item.uri, item.playlistUri, item.duration, status.offset);
};

