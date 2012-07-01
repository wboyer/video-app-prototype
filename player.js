var Player = {uri: null, playlistUri: null, duration: 0, offset: 0, playing: false, lastTick: 0};

Player.init = function ()
{
	this.uri = null;
	this.playlistUri = null;
	this.duration = 0;
	this.offset = 0;
	this.playing = false;
	this.lastTick = 0;
};

Player.onInterval = function (now)
{
	if ((this.lastTick != 0) && this.playing)
		this.offset += (now - this.lastTick);
	this.lastTick = now;
	if ((this.offset >= this.duration * 1000) && this.stepCallback && this.playing) {
		this.stepCallback();
	}
};

Player.play = function (uri, playlistUri, duration, offset)
{
	this.playing = true;
	this.uri = uri;
	this.playlistUri = playlistUri;
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


