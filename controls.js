var Controls = {};

Controls.playPause = function (button)
{
	if (App.player.playing) {
		App.player.pause();
		button.innerHTML = "Play";
	}
	else {
		App.player.unpause();
		button.innerHTML = "Pause";
	}
};

Controls.sync = function ()
{
	App.sync();
};

Controls.skipForward = function ()
{
	App.skipForward();
};

Controls.skipBackward = function ()
{
	if (App.player.offset >= 2000)
		App.player.offset = 0;
	else
		App.skipBackward();
};


