var ProgramStatus = {blockIndex: 0, itemIndex: 0, wait: 0, offset: 0, adsEnabled: true, hasLoopedBlock: false};

ProgramStatus.init = function ()
{
	this.blockIndex = 0;
	this.itemIndex = 0;
	this.wait = 0;
	this.offset = 0;
	this.adsEnabled = true;
	this.hasLoopedBlock = false;
};

ProgramStatus.clone = function (programStatus)
{
	this.blockIndex = programStatus.blockIndex;
	this.itemIndex = programStatus.itemIndex;
	this.wait = programStatus.wait;
	this.offset = programStatus.offset;
	this.adsEnabled = programStatus.adsEnabled;
	this.hasLoopedBlock = programStatus.hasLoopedBlock;
};

var ProgramController = {program: null, apptBlocks: null};

ProgramController.blockStartTime = function (b)
{
	var program = this.program;
	return program.startTime + program.blocks[b].start * 1000;
};

ProgramController.secondsUntilBlockStart = function (now, b)
{
	var program = this.program;
	return Math.floor((program.startTime + program.blocks[b].start * 1000 - now) / 1000);
};

ProgramController.loadProgram = function (program)
{
	this.program = program;
	program.startTime = Date.parse(program.start);
	
	this.apptBlocks = [];
	for (var b = 0; b < program.blocks.length; b++)
		if (program.blocks[b].appt)
			this.apptBlocks[this.apptBlocks.length] = b;
};

ProgramController.sync = function (now, status)
{
	status.init();

	var program = this.program;
	
	if ((program.blocks.length == 0) || (program.blocks[0].items.length == 0))
		return false;
	
	var time = this.blockStartTime(0);

	while (true) {
		this.stepToTime(time, status);
		
		time += status.wait * 1000;

		if (time > now) {
			status.wait = Math.floor((time - now) / 1000);
			return true;
		}
		else {
			status.wait = 0;
			
			var block = program.blocks[status.blockIndex];			

			while (true) {
				var item = block.items[status.itemIndex];
				var duration = item.duration + item.adDuration;
				
				time += duration * 1000;

				if (time > now) {
					if (block.dll || item.dll)
						time -= duration * 1000;
					else {
						status.offset = duration - Math.floor((time - now) / 1000);
						status.adsEnabled = false;
						if (status.offset < item.adDuration) {
							status.wait = item.adDuration - status.offset;
							status.offset = item.adDuration;
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
	var program = this.program;
	var timeOffset = Math.floor((time - program.startTime) / 1000);

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
			var timeUntilBlockStart = nextBlock.start - timeOffset;
		
			var mssl = nextBlock.mssl;
			if (nextBlock.appt)
				mssl = 0;

			var duration = items[i].duration + items[i].adDuration;
			for (var j = i + 1; (j < items.length) && (items[i].playlistUri == items[j].playlistUri) && items[j].auto; j++)
				duration += items[j].duration + items[j].adDuration;
			
			if ((mssl >= 0) && (duration - timeUntilBlockStart > mssl) && (hasLoopedBlock || !block.dfe)) {
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

ProgramController.stepForward = function (now, status, playerCanStepThroughPlaylist)
{
	var i = status.itemIndex + 1;

	var items = this.program.blocks[status.blockIndex].items;

	if (playerCanStepThroughPlaylist)
		while ((i < items.length) && (items[status.itemIndex].playlistUri == items[i].playlistUri) && items[i].auto)
			i += 1;
	
	status.itemIndex = i;

	this.stepToTime(now, status);
};

ProgramController.skipForward = function (now, status)
{
	var program = this.program;

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
	var program = this.program;

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
	var program = this.program;

	block = program.blocks[b];

	if (b != status.blockIndex)
		status.hasLoopedBlock = false;

	status.wait = 0;
	status.offset = 0;
	status.adsEnabled = true;

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

ProgramController.onPlayerVideoStarted = function (uri, status)
{
	var items = this.program.blocks[status.blockIndex].items;
	
	for (var i = status.itemIndex; (i < items.length) && items[i].auto; i++)
		if (items[i].uri == uri) {
			status.itemIndex = i;
			break;
		}
};

ProgramController.playProgram = function (player, status)
{
	var item = this.program.blocks[status.blockIndex].items[status.itemIndex];

	var uri = item.uri;
	var playlistUri = item.playlistUri;
	var duration = item.duration + item.adDuration;
	
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
		player.setAdDuration(item.adDuration);
	
	player.seekToOffset(status.offset);
	player.play();
};
