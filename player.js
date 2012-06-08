var Player = {uri: "", config: "", duration: 0, offset: 0, playing: false, lastTick: 0};

Player.updateOffset = function (now)
{
	if ((this.lastTick != 0) && this.playing)
		this.offset += (now - this.lastTick);
	this.lastTick = now;
	if ((this.offset >= this.duration * 1000) && this.stepCallback)
		this.stepCallback();
};

Player.play = function (uri, config, duration, offset)
{
	this.playing = true;
	this.uri = uri;
	this.config = config;
	this.duration = duration;
	this.offset = offset * 1000;
};

Player.pause = function ()
{
	this.playing = false;
};

Player.unpause = function ()
{
	this.playing = true;
};


