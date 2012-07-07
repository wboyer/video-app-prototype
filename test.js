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

function slideProgram(offset)
{
	App.programStatus.program.startTime += offset;
	var programDiv = document.getElementById("program");
	UI.displayProgram(App.programStatus.program, programDiv);
	App.onAirNowStart = 0;
}

function init()
{
	App.init();

	// Just for testing, compute our own current time,
	// and slide the test program forward to be closer to now.
	var now = new Date().getTime();
	while (testProgram.startTime + 3600000 < now)
		testProgram.startTime += 3600000;

	App.loadProgram(testProgram);

	var programDiv = document.getElementById("program");
	UI.displayProgram(App.programStatus.program, programDiv);

	window.setInterval(
		function () {
			var now = new Date().getTime();
			var programStatus = App.programStatus;

			var tmpProgramStatus = Object.create(ProgramStatus);
			tmpProgramStatus.clone(programStatus);
			App.programController.sync(now, tmpProgramStatus);
			var item = tmpProgramStatus.program.blocks[tmpProgramStatus.blockIndex].items[tmpProgramStatus.itemIndex];
			UI.markProgramOffset(programDiv, "t_m_s", "marker_sync", tmpProgramStatus.blockIndex, tmpProgramStatus.itemIndex, (item.duration + item.adDuration) * 1000, tmpProgramStatus.offset);

			programStatus = App.programStatus;
			item = programStatus.program.blocks[programStatus.blockIndex].items[programStatus.itemIndex];
			UI.markProgramOffset(programDiv, "t_m_c", "marker_current", programStatus.blockIndex, programStatus.itemIndex, (item.duration + item.adDuration) * 1000, App.player.offset);

			var playerDiv = document.getElementById("player");
			var videoDiv = document.getElementById("video");

			App.player.onInterval(now);
			UI.updatePlayer(App.player, videoDiv);

			App.onInterval(now);
			UI.displayOnAirNow(App, document.getElementById("onAirNow"));
			UI.displayWait(App, document.getElementById("wait"));
			UI.displayNextUp(App, document.getElementById("nextUp"));
			UI.displayNextAppt(App, document.getElementById("nextAppt"), now);
			
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

