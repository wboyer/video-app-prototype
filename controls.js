var Controls = {};

Controls.playPause = function (button)
{
	if (Player.playing) {
		Player.pause();
		button.innerHTML = "Play";
	}
	else {
		Player.unpause();
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
	if (Player.offset >= 2000)
		Player.offset = 0;
	else
		App.skipBackward();
};


