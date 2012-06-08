var ProgramController = {program: null, currentBlockIndex: 0, currentItemIndex: 0, synchronized: true};

ProgramController.loadProgram = function (program)
{
	this.program = program;
	program.startOffset = Date.parse(program.start);
};

ProgramController.findLaunchOffset = function (now, func)
{
	var program = this.program;
	
	var nowOffset = Math.floor((now - program.startOffset) / 1000);
	var launchOffset = 0;
	var blocks = program.blocks;
	
	for (var b = 0; ; b++)
		if ((b + 1 == blocks.length) || (blocks[b + 1].start > nowOffset))
		{
			var block = blocks[b];
			launchOffset = block.start;

			for (var i = 0; ; ) {
				var item = block.items[i];
				var duration = item.duration;

				if (block.dsl || (launchOffset + duration > nowOffset)) {
					if (block.dsl || item.dsl)
						launchOffset = 0;
					else
						launchOffset = nowOffset - launchOffset;

					func(program, b, i, launchOffset);

					return;
				}

				launchOffset += duration;

				i += 1;
				if (i == block.items.length)
					i = 0;
			}
		}
};

ProgramController.getCurrentItem = function (func)
{
	func(this.program, this.currentBlockIndex, this.currentItemIndex);
};

ProgramController.launch = function (b, i)
{
	this.currentBlockIndex = b;
	this.currentItemIndex = i;
};

ProgramController.stepForward = function (now, func)
{
	var program = this.program;
	var nowOffset = Math.floor((now - program.startOffset) / 1000);

	var b = this.currentBlockIndex;
	var i = this.currentItemIndex;

	var blocks = program.blocks;
	var block = blocks[b];

	i += 1;
	if (i >= block.items.length)
		i = 0;

	if (b + 1 < blocks.length) {
		var timeUntilNextBlockStart = blocks[b + 1].start - nowOffset;
		
		if ((timeUntilNextBlockStart < 0) || (timeUntilNextBlockStart < block.items[i].duration)) {
			b += 1;
			i = 0;
		}
	} 
	
	this.currentBlockIndex = b;
	this.currentItemIndex = i;

	func(program, b, i);
};

ProgramController.skipForward = function (now, func)
{
	var program = this.program;

	var b = this.currentBlockIndex;
	var i = this.currentItemIndex;

	var blocks = program.blocks;
	var block = blocks[b];

	i += 1;
	if (i >= block.items.length) {
		i = 0;
		if (b + 1 < blocks.length)
			b += 1;
		else
			b = 0;
	}

	this.currentBlockIndex = b;
	this.currentItemIndex = i;

	func(program, b, i);
};

ProgramController.skipBackward = function (now, func)
{
	var program = this.program;

	var b = this.currentBlockIndex;
	var i = this.currentItemIndex;

	var blocks = program.blocks;

	i -= 1;
	if (i < 0) {
		if (b > 0)
			b -= 1;
		else
			b = blocks.length - 1;
		i = blocks[b].items.length - 1;
	}

	this.currentBlockIndex = b;
	this.currentItemIndex = i;

	func(program, b, i);
};
