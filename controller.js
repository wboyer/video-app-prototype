// Testing collaborator access.
// It works!  -benoitm
var ProgramStatus = {program: null, blockIndex: 0, itemIndex: 0, wait: 0, offset: 0, adsEnabled: true, hasLoopedBlock: false};

ProgramStatus.reset = function ()
{
	this.blockIndex = 0;
	this.itemIndex = 0;
	this.wait = 0;
	this.offset = 0;
	this.adsEnabled = true;
	this.hasLoopedBlock = false;
};

ProgramStatus.clone = function (status)
{
	this.program = status.program;
	this.blockIndex = status.blockIndex;
	this.itemIndex = status.itemIndex;
	this.wait = status.wait;
	this.offset = status.offset;
	this.adsEnabled = status.adsEnabled;
	this.hasLoopedBlock = status.hasLoopedBlock;
};

ProgramStatus.currentItem = function ()
{
	return this.program.blocks[this.blockIndex].items[this.itemIndex];
};

var ProgramController = {};

ProgramController.loadProgram = function (program)
{
	program.apptBlocks = [];
	for (var b = 0; b < program.blocks.length; b++)
		if (program.blocks[b].appt)
			program.apptBlocks[program.apptBlocks.length] = b;

	var programStatus = Object.create(ProgramStatus);
	programStatus.program = program;
	return programStatus;
};

ProgramController.sync = function (now, status)
{
	status.reset();

	var program = status.program;
	
	if ((program.blocks.length == 0) || (program.blocks[0].items.length == 0))
		return false;
	
	var time = program.startTime + program.blocks[0].start * 1000;

	while (true) {
		this.stepToTime(time, status);
		
		time += status.wait;

		if (time > now) {
			status.wait = time - now;
			return true;
		}
		else {
			status.wait = 0;
			
			var block = program.blocks[status.blockIndex];			

			while (true) {
				var item = block.items[status.itemIndex];
				var duration = (item.duration + item.adDuration) * 1000;
				var adDuration = item.adDuration * 1000;
				
				time += duration;

				if (time > now) {
					if (block.dll || item.dll)
						time -= duration;
					else {
						status.offset = now + duration - time;
						status.adsEnabled = false;
						if (status.offset < adDuration) {
							status.wait = adDuration - status.offset;
							status.offset = adDuration;
						}
					}					
					return true;
				}
				
				var i = status.itemIndex + 1;
				if ((i < block.items.length) && (item.playlistUri == block.items[i].playlistUri) && block.items[i].auto)
					status.itemIndex = i;
				else
					break;
			}
		}
		
		status.itemIndex += 1;
	}
};

// private
ProgramController.stepToTime = function (time, status)
{
	var program = status.program;
	var timeOffset = time - program.startTime;

	var b = status.blockIndex;
	var i = status.itemIndex;

	var blocks = program.blocks;
	var block = blocks[b];
	var items = block.items;
	
	var hasLoopedBlock = status.hasLoopedBlock;

	var done = false;
	
	while (!done)
	{
		done = true;

		if (i >= items.length) {
			i = 0;
			hasLoopedBlock = true;
		}

		if (b + 1 < blocks.length) {
			var nextBlock = blocks[b + 1];
			var timeUntilBlockStart = nextBlock.start * 1000 - timeOffset;
		
			var mssl = nextBlock.mssl;
			if (nextBlock.appt)
				mssl = 0;

			var duration = items[i].duration + items[i].adDuration;
			for (var j = i + 1; (j < items.length) && (items[i].playlistUri == items[j].playlistUri) && items[j].auto; j++)
				duration += items[j].duration + items[j].adDuration;
			
			if ((mssl >= 0) && ((duration - mssl) * 1000 > timeUntilBlockStart) && (hasLoopedBlock || !block.dfe)) {
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
	status.adsEnabled = true;
	
	if (b != status.blockIndex) {
		var timeUntilBlockStart = block.start * 1000 - timeOffset;
		
		var msse = block.msse * 1000;
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

ProgramController.stepForward = function (now, status, playerCanStepThroughPlaylist)
{
	var i = status.itemIndex + 1;

	var items = status.program.blocks[status.blockIndex].items;

	if (playerCanStepThroughPlaylist)
		while ((i < items.length) && (items[status.itemIndex].playlistUri == items[i].playlistUri) && items[i].auto)
			i += 1;
	
	status.itemIndex = i;

	this.stepToTime(now, status);
};

ProgramController.skipForward = function (now, status)
{
	var program = status.program;

	var b = status.blockIndex;
	var i = status.itemIndex;

	var blocks = program.blocks;
	var block = blocks[b];
	var items = block.items;

	if (status.wait > 0)
		if (block.appt)
			i = block.items.length;
		else {
			status.wait = 0;
			return;
		}
	else {
		i += 1;
		
		while ((i < items.length) && items[i].hidden)
			i += 1;
	}
	
	if (i >= items.length) {
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
	var program = status.program;

	var b = status.blockIndex;
	var i = status.itemIndex;

	var blocks = program.blocks;
	var block = blocks[b];
	var items = block.items;

	if (status.wait > 0)
		i = -1;
	else {
		i -= 1;

		while ((i >= 0) && items[i].hidden)
			i -= 1;
	}

	if (i < 0) {
		if (b > 0)
			b -= 1;
		else
			b = blocks.length - 1;

		block = blocks[b];
		items = block.items;
		i = items.length - 1;

		while ((i >= 0) && items[i].hidden)
			i -= 1;
	}

	this.skipToItem(now, status, b, i);
};

ProgramController.skipToItem = function (now, status, b, i)
{
	var program = status.program;

	block = program.blocks[b];

	if (b != status.blockIndex)
		status.hasLoopedBlock = false;

	status.wait = 0;
	status.offset = 0;
	status.adsEnabled = true;

	if (block.appt) {
		var nowOffset = now - program.startTime;
	
		if (block.start * 1000 > nowOffset) {
			status.wait = block.start * 1000 - nowOffset;
			i = 0;
		}
	}

	status.blockIndex = b;
	status.itemIndex = i;
};

ProgramController.onPlayerVideoStarted = function (uri, status)
{
	var items = status.program.blocks[status.blockIndex].items;
	
	for (var i = status.itemIndex; (i < items.length) && items[i].auto; i++)
		if (items[i].uri == uri) {
			status.itemIndex = i;
			break;
		}
};

ProgramController.playProgram = function (player, status)
{
	var item = status.program.blocks[status.blockIndex].items[status.itemIndex];

	var uri = item.uri;
	var playlistUri = item.playlistUri;
	var duration = (item.duration + item.adDuration) * 1000;
	var adDuration = item.adDuration * 1000;
	
	if (playlistUri) {
		player.config(playlistUri);
		if (item.auto) {
			player.loadPlaylist(playlistUri);
			player.seekToPlaylistVideo(uri, duration);
		}
		else
			player.loadVideo(uri, duration);
	}
	else {
		player.config(uri);
		player.loadVideo(uri, duration);
	}

	if (status.adsEnabled)
		player.setAdDuration(adDuration);

	if (status.offset > 0)
		player.seekToOffset(status.offset);
	player.play();
};

ProgramController.timeUntilBlockStart = function (program, now, b)
{
	return program.startTime + program.blocks[b].start * 1000 - now;
};

