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

Controls.skipForward = function ()
{
	ProgramController.skipForward(new Date().getTime(),
		function (program, b, i) {
			var item = program.blocks[b].items[i];
			Player.play(item.uri, item.config, item.duration, 0);
		});
};

Controls.skipBackward = function ()
{
	if (Player.offset >= 2000)
		Player.offset = 0;
	else
		ProgramController.skipBackward(new Date().getTime(),
			function (program, b, i) {
				var item = program.blocks[b].items[i];
				Player.play(item.uri, item.config, item.duration, 0);
			});
};


