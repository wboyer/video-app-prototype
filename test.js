function init()
{
	App.init();

	App.loadProgram(VIACOM.Schedule.ScheduleService.getSchedule());

	var programDiv = document.getElementById("program");
	UI.displayProgram(App.programStatus.program, programDiv);

	var playerDiv = document.getElementById("player");
	var videoDiv = document.getElementById("video");

	initOverlayAllowedRegion("overlay0", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);
	initOverlayAllowedRegion("overlay1", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);
	initOverlayAllowedRegion("overlay21", videoDiv.offsetLeft, videoDiv.offsetTop, videoDiv.offsetLeft + videoDiv.clientWidth + 2, videoDiv.offsetTop + videoDiv.clientHeight + 2);
	initOverlayAllowedRegion("overlay22", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);
	initOverlayAllowedRegion("overlay3", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2 + 40);
	
	window.setInterval(
		function () {
			var now = new Date().getTime();
			var programStatus = App.programStatus;

			var tmpProgramStatus = Object.create(programStatus);
			tmpProgramStatus.clone(programStatus);
			App.programController.goLive(tmpProgramStatus);
			var item = tmpProgramStatus.currentItem();
			UI.markProgramOffset(programDiv, "t_m_s", "marker_sync", tmpProgramStatus.blockIndex, tmpProgramStatus.itemIndex, (item.duration + item.adDuration) * 1000, tmpProgramStatus.offset);

			programStatus = App.programStatus;
			item = programStatus.currentItem();
			UI.markProgramOffset(programDiv, "t_m_c", "marker_current", programStatus.blockIndex, programStatus.itemIndex, (item.duration + item.adDuration) * 1000, App.player.offset);

			App.player.onInterval(now);
			UI.updatePlayer(App.player, videoDiv);

			App.onInterval(now);
			UI.displayOnAirNow(App, document.getElementById("onAirNow"));
			UI.displayWait(App, document.getElementById("wait"));
			UI.displayNextUp(App, document.getElementById("nextUp"));
			UI.displayNextAppt(App, document.getElementById("nextAppt"), now);
			
			var overlays = [];
			overlays[overlays.length] = createOverlay("overlay0");
			overlays[overlays.length] = createOverlay("overlay1");
			overlays[overlays.length] = createOverlay("overlay2");
			overlays[overlays.length] = createOverlay("overlay3");

			var overlayGroups = [];
			overlayGroups[0] = overlays;

			var region = Object.create(Region);
			region.construct(0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);			
			var arrangement = Arrangement.findBest(overlayGroups, region);
			UI.displayOverlays(playerDiv, overlayGroups, arrangement, "overlay");
			
			//console.debug(new Date().getTime() - now);
		},
		300);
}

function initOverlayAllowedRegion(id, left, top, right, bottom)
{
	document.getElementById(id + "left").value = left;
	document.getElementById(id + "top").value = top;
	document.getElementById(id + "right").value = right;
	document.getElementById(id + "bottom").value = bottom;
};

function createOverlay(id)
{
	overlay = Object.create(Overlay);
	overlay.id = id;
	overlay.enabled = document.getElementById(id + "enabled").checked;
	overlay.width = +document.getElementById(id + "width").value;
	overlay.height = +document.getElementById(id + "height").value;
	overlay.color = document.getElementById(id + "color").value;
	overlay.canBeCovered = document.getElementById(id + "covered").checked;
	document.getElementById(id + "color").style["border"] = "1px solid " + overlay.color;

	if (id == "overlay2")
		id = "overlay21";

	addOverlayAllowedRegion(overlay, id);			

	if (id == "overlay21") {
		id = "overlay22";
		addOverlayAllowedRegion(overlay, id);			
	}

	return overlay;
}

function addOverlayAllowedRegion(overlay, id)
{
	var region = Object.create(Region);
	region.construct(+document.getElementById(id + "left").value, +document.getElementById(id + "top").value, +document.getElementById(id + "right").value, +document.getElementById(id + "bottom").value, document.getElementById(id + "axis").value, +document.getElementById(id + "bias").value);			
	overlay.addAllowedRegion(region);
}

function slideProgram(offset)
{
	App.programStatus.program.startTime += offset;
	var programDiv = document.getElementById("program");
	UI.displayProgram(App.programStatus.program, programDiv);
	App.onAirNowStart = 0;
}
