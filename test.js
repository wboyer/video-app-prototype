function createOverlay(id)
{
	overlay = Object.create(Overlay);
	overlay.id = id;
	overlay.enabled = document.getElementById(id + "enabled").checked;
	overlay.width = +document.getElementById(id + "width").value;
	overlay.height = +document.getElementById(id + "height").value;
	overlay.color = document.getElementById(id + "color").value;
	document.getElementById(id + "color").style["border"] = "1px solid " + overlay.color;

	return overlay;
}

function addAllowedRegion(overlay, left, top, right, bottom)
{
	region = Object.create(Region);
	region.construct(left, top, right, bottom, document.getElementById(overlay.id + "axis").value, +document.getElementById(overlay.id + "bias").value);			
	overlay.addAllowedRegion(region);
}

function init()
{
	// Just for testing, compute our own current time,
	// and pull the program forward to be closer to now.
	var now = new Date().getTime();
	while (ProgramController.program.startOffset + 3600000 < now)
		ProgramController.program.startOffset += 3600000;
	
	var programDiv = document.getElementById("program");
	UI.drawProgram(ProgramController.program, programDiv);

	Player.stepCallback = function () {	
		ProgramController.stepForward(new Date().getTime(),
				function (program, b, i) {
					var item = program.blocks[b].items[i];
					Player.play(item.uri, item.config, item.duration, 0);
				});
	};
	
	ProgramController.findLaunchOffset(new Date().getTime(),
		function (program, b, i, offset) {
			ProgramController.launch(b, i);
			var item = program.blocks[b].items[i];
			Player.play(item.uri, item.config, item.duration, offset);
		});
	
	window.setInterval(
		function () {
			now = new Date().getTime();
			
			ProgramController.findLaunchOffset(now,
				function (program, b, i, offset) {
					var item = program.blocks[b].items[i];
					UI.markProgramOffset(programDiv, "t_m_l", "marker_launch", b, i, item.duration, offset);
				});

			var playerDiv = document.getElementById("player");
			var videoDiv = document.getElementById("video");

			Player.updateOffset(now);
			UI.updatePlayer(Player, videoDiv);

			ProgramController.getCurrentItem(
				function (program, b, i) {
					var item = program.blocks[b].items[i];
					UI.markProgramOffset(programDiv, "t_m_c", "marker_current", b, i, item.duration, Math.floor(Player.offset / 1000));
				});

			var overlays = [];
			var overlay;
			var region;

			overlay = createOverlay("overlay0");
			addAllowedRegion(overlay, 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);			
			overlays[overlays.length] = overlay;
			
			overlay = createOverlay("overlay1");
			addAllowedRegion(overlay, 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);			
			overlays[overlays.length] = overlay;
			
			overlay = createOverlay("overlay2");
			addAllowedRegion(overlay, videoDiv.offsetLeft, videoDiv.offsetTop, videoDiv.offsetLeft + videoDiv.clientWidth + 2, videoDiv.offsetTop + videoDiv.clientHeight + 2);
			//addAllowedRegion(overlay, 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);			
			overlays[overlays.length] = overlay;
			
			overlay = createOverlay("overlay3");
			addAllowedRegion(overlay, 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2 + 40);			
			overlays[overlays.length] = overlay;
			
			if (overlays.length > 0) {
				region = Object.create(Region);
				region.construct(0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);			
				var arrangement = Arrangement.findBest(overlays, region);
				UI.displayOverlays(playerDiv, overlays, arrangement, "overlay");
			}
			
			//console.debug(new Date().getTime() - now);
		},
		250);

}

