var Player = {uri: null, playlistUri: null, duration: 0, adDuration: 0, adsEnabled: true, adUri: null, offset: 0, playing: false,
				stepCallback: null, videoStartedCallback: true,
				lastTick: 0};

Player.stop = function ()
{
	this.uri = null;
	this.playlistUri = null;
	this.duration = 0;
    this.adDuration = 0;
    this.adsEnabled = true;
    this.adUri = null;
	this.offset = 0;
	this.playing = false;
	this.lastTick = 0;
};

Player.config = function (uri)
{
};

Player.loadPlaylist = function (uri)
{
	this.stop();
	this.playlistUri = uri;
};

Player.seekToPlaylistVideo = function (uri, duration)
{
	this.playing = false;
	this.uri = uri;
	this.duration = duration;
	this.offset = 0;
};

Player.loadVideo = function (uri, duration)
{
	this.stop();
	this.uri = uri;
	this.duration = duration;
};

Player.setAdDuration = function (duration)
{
    this.adDuration = duration;
};

Player.setAdsEnabled = function (enabled)
{
    this.adsEnabled = enabled;
};

Player.setAdUri = function (uri)
{
    this.adUri = uri;
};

Player.seekToOffset = function (offset)
{
	this.offset = offset;
};

Player.play = function ()
{
	if (this.uri || this.playlistUri) {
		this.playing = true;
		if (this.uri && this.videoStartedCallback)
			this.videoStartedCallback(this.uri);
	}
};

Player.pause = function ()
{
	this.playing = false;
};

Player.unpause = function ()
{
	if (this.uri)
		this.playing = true;
};

Player.onInterval = function (now)
{
	if ((this.lastTick != 0) && this.playing)
		this.offset += (now - this.lastTick);

	this.lastTick = now;

	if (this.playing && (this.duration > 0) && (this.offset >= this.duration) && this.stepCallback)
		this.stepCallback();
};

Player.canStepThroughPlaylist = function ()
{
	// a real Player will return true
	return false;
};
