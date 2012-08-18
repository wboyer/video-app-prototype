function init()
{
	App.init();
  App.loadProgram();

	var programDiv = document.getElementById("program");
	UI.displayProgram(VIACOM.Schedule.Service.getSchedule(), programDiv);

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
			var viewerStatus = App.programController.getViewerStatus();

			var liveStatus =  App.programController.getLiveStatus();
			var item =  App.programController.getLiveItem();

     /* 
      if ((liveStatus.blockIndex() == 0) || (liveStatus.blockIndex() == 2)) {
      trace("********************");
      trace("-------------------");
      trace("LiveStatus");
      trace("blockIndex: " + liveStatus.blockIndex());
      trace("itemIndex: " + liveStatus.itemIndex());
      trace("offset: " + liveStatus.offset());
      trace("time: " + liveStatus.time());
      trace("wait: " + liveStatus.wait());
      trace("adsEnabled: " + liveStatus.adsEnabled());
      trace("hasLoopedBack: " + liveStatus.hasLoopedBlock());
      trace("-------------------");
      trace("-------------------");
      trace("ViewerStatus");
      trace("blockIndex: " + viewerStatus.blockIndex());
      trace("itemIndex: " + viewerStatus.itemIndex());
      trace("offset: " + viewerStatus.offset());
      trace("time: " + viewerStatus.time());
      trace("wait: " + viewerStatus.wait());
      trace("adsEnabled: " + viewerStatus.adsEnabled());
      trace("hasLoopedBack: " + viewerStatus.hasLoopedBlock());
      trace("-------------------");
      trace("********************");
      }*/

			UI.markProgramOffset(programDiv, "t_m_s", "marker_sync", liveStatus.blockIndex(), liveStatus.itemIndex(), (item.duration + item.adDuration) * 1000, liveStatus.offset());

			item =  App.programController.getCurrentItem();
			UI.markProgramOffset(programDiv, "t_m_c", "marker_current", viewerStatus.blockIndex(), viewerStatus.itemIndex(), (item.duration + item.adDuration) * 1000, App.player.offset);

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
  var program =  VIACOM.Schedule.Service.getSchedule();
	program.startTime += offset;
	var programDiv = document.getElementById("program");
	
  UI.displayProgram(program, programDiv);
	App.onAirNowStart = 0;
}
