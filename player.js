var Player = {uri: null, playlistUri: null, duration: 0, adDuration: 0, adsEnabled: true, adUri: null, offset: 0, playing: false,
				stepCallback: null, videoStartedCallback: true, actualPlayer: null,
				lastTick: 0, ready: false};

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

Player.config = function (uri, session, callback)
{
	var self = this;
	this.actualPlayer.one("configurationApplied", function(event){
		callback(self, session);
	});
	this.actualPlayer.configure(uri);
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

Player.loadVideo = function (uri, duration, session, callback)
{
	//this.stop();
	var self = this;
	this.uri = uri;
	this.duration = duration;
	this.actualPlayer.one("videoLoaded", function(event){
		callback(self, session);
	});
	this.actualPlayer.loadVideo(uri);
};

// this doesn't do anything
Player.setAdDuration = function (duration)
{
    this.adDuration = duration;
};

Player.setAdsEnabled = function (enabled)
{
	trace("SETTING AD ENABLED: " + enabled);
	this.actualPlayer.disableAds(!enabled);
	var uri = "not:a:real:uri:12345";
	trace("SETTING AD URI!");
	trace("new uri: "+uri);
    this.actualPlayer.spoofAdURI(uri);
};

Player.setAdUri = function (uri)
{
	trace("SETTING AD URI!");
	trace("new uri: "+uri);
    this.actualPlayer.spoofAdURI(uri);
};

Player.seekToOffset = function (offset)
{
	this.actualPlayer.seek(offset);
};

Player.play = function ()
{
	this.actualPlayer.play();
	if (this.uri || this.playlistUri) {
		this.playing = true;
		if (this.uri && this.videoStartedCallback)
			this.videoStartedCallback(this.uri);
	}
};

Player.pause = function ()
{
	this.actualPlayer.pause();
	this.playing = false;
};

Player.unpause = function ()
{
	if (this.uri)
		this.playing = true;
	this.actualPlayer.play();
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
