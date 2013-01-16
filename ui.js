var UI = {};

UI.mmss = function (duration)
{
	var minutes = Math.floor(duration / 60000);
	var seconds = Math.floor((duration % 60000) / 1000);
	
	if (minutes < 10)
		minutes = "0" + minutes;
	
	if (seconds < 10)
		seconds = "0" + seconds;
	
	return  minutes + ":" + seconds;
};

UI.displayGuide = function (app, guideDiv)
{
  var midnight = new Date();
  midnight.setHours(0);
  midnight.setMinutes(0);
  midnight.setSeconds(0);

  var tomorrowMidnight = new Date();
  tomorrowMidnight.setTime(midnight.getTime() + 1000*60*60*24);

  var innerHTML = "";
  
  app.scheduleController.guide(app.activeScheduleContext.schedule, midnight.getTime(), tomorrowMidnight.getTime(),
    function(startTime, videoMeta, playlistMeta, duration) {
      if (videoMeta)
        innerHTML += videoMeta.title1 + " (" + videoMeta.uri + ")<br/>";
      else
        if (playlistMeta)
          innerHTML += playlistMeta.title1 + " (" + playlistMeta.uri + ")<br/>";
    }
  );

  guideDiv.innerHTML = innerHTML;
};

UI.displaySchedule = function (app, scheduleDiv)
{
    var schedule = app.activeScheduleContext.schedule;
	var blocks = schedule.blocks;
	var innerHTML = "";
	
	for (var b = 0; b < blocks.length; b++) {
		var block = blocks[b];
		
		innerHTML += "<div id=\"t_b" + b + "\" class=\"block\">";

		innerHTML += "<div id=\"t_b" + b + "_info\">";
		innerHTML += new Date(schedule.startTime + block.start * 1000).toString() + "<br/>";
		innerHTML += "dll: " + block.dll + ", ";
		innerHTML += "dfe: " + block.dfe + ", ";
		innerHTML += "msse: " + block.msse + ", ";
		innerHTML += "mssl: " + block.mssl + ", ";
		innerHTML += "appt: " + block.appt;
		innerHTML += "</div>";
		
		var items = block.items;
		
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var duration = item.duration + item.adDuration;
			innerHTML += "<div id=\"t_b" + b + "_i" + i + "\" class=\"item\" style=\"min-height: " + Math.floor(duration/6) + "px;\">";
			innerHTML += "videoUri: <a onclick=\"App.jumpToItem(" + b + "," + i + ");\">" + item.videoUri + "</a>, ";
			innerHTML += "dll: " + item.dll + ", ";
			innerHTML += "plUri: " + item.playlistUri + ", ";
			innerHTML += "auto: " + item.auto + ", ";
			innerHTML += "hidden: " + item.hidden + ", ";
			innerHTML += "ad: " + UI.mmss(item.adDuration * 1000) + ", ";
			innerHTML += "dur: " + UI.mmss(duration * 1000);
			innerHTML += "</div>";
		}
		
		innerHTML += "</div>";
	}

	scheduleDiv.innerHTML = innerHTML;
};

UI.markScheduleOffset = function (scheduleDiv, markerId, markerClass, b, i, duration, offset)
{
	var markerDiv = document.getElementById(markerId);
	if (!markerDiv) {
		scheduleDiv.innerHTML += "<div id=\"" + markerId + "\" class=\"" + markerClass + "\"></div>";
		markerDiv = document.getElementById(markerId);
	}

	itemDiv = document.getElementById("t_b" + b + "_i" + i);
    if (duration > 0)
      markerDiv.style["top"] = itemDiv.offsetTop + Math.floor(itemDiv.offsetHeight * offset / duration);
    else
      markerDiv.style["top"] = itemDiv.offsetTop;
};

UI.updatePlayer = function (player, videoDiv)
{
  var videoUri = player.uri;
  var playlistUri = player.playlistUri;

  if (videoUri || playlistUri) {
    if (!videoUri)
      videoUri = "(none)";

    if (!playlistUri)
      playlistUri = "(none)";
    
	var offset = player.offset;
	videoDiv.innerHTML = "playlistUri: " + playlistUri + "<br/>" + "videoUri: " + videoUri + "<br/>" + UI.mmss(offset);
	if (offset < player.adDuration)
		videoDiv.innerHTML += "<br/>ad playing";
  }
  else
	videoDiv.innerHTML = "not playing";
};

UI.displayOnAirNow = function(app, onAirNowDiv) {
  var innerHTML = "";
   
   app.activeSession.describe(
       function(startTime, videoMeta, playlistMeta, duration) {
         if (videoMeta)
           innerHTML += "Live Now: " + videoMeta.title1 + " (" + videoMeta.uri + ")";
         else
           innerHTML += "Live Now: (metadata unavailable)";
     }
   );
   onAirNowDiv.innerHTML = innerHTML;
};

UI.displayOnAirNext = function(app, onAirNextDiv) {
  var innerHTML = "";
   
   app.liveNextSession.describe(
       function(startTime, videoMeta, playlistMeta, duration) {
         if (videoMeta)
             innerHTML += "Live Later: " + videoMeta.title1 + " (" + videoMeta.uri + ")";
         else
           innerHTML += "Live Later: (metadata unavailable)";
     }
   );
   onAirNextDiv.innerHTML = innerHTML;
};

UI.displayWait = function(app, waitDiv) {
	if (app.activeScheduleContext && (app.activeScheduleContext.wait > 0)) {
		waitDiv.style["visibility"] = "visible";
		waitDiv.innerHTML = "Waiting for " + UI.mmss(app.waitRemaining);
	}
	else
		waitDiv.style["visibility"] = "hidden";
};

UI.displayNextUp = function(app, nextUpDiv) {
	if (app.nextUpContext)
	{
		nextUpDiv.style["visibility"] = "visible";
		var innerHTML = "";
		
		app.liveNextSession.describe(
		    function(startTime, videoMeta, playlistMeta, duration) {
		    if (videoMeta)
		      innerHTML += "Next Up: " + videoMeta.title1 + " (" + videoMeta.uri + ")";
		    else
              innerHTML += "Next Up: (metadata unavailable)";
		  }
		);
		
		nextUpDiv.innerHTML = innerHTML;
	}
	else
		nextUpDiv.style["visibility"] = "hidden";
};

UI.displayNextAppt = function(app, nextApptDiv, now) {
	if (app.nextApptBlock) {
		nextApptDiv.style["visibility"] = "visible";
		var schedule = app.activeScheduleContext.schedule;
		var timeUntilApptStart = app.activeSession.timeUntilBlockStart(schedule, app.nextApptBlock);
		
		if (timeUntilApptStart < 0)
			nextApptDiv.innerHTML = "Live Now: " + schedule.blocks[app.nextApptBlock].items[0].videoUri;
		else
			nextApptDiv.innerHTML = "Live Soon: " + schedule.blocks[app.nextApptBlock].items[0].videoUri + " in " + UI.mmss(timeUntilApptStart);
	}
	else
		nextApptDiv.style["visibility"] = "hidden";
};

UI.displayOverlay = function (playerDiv, placement, overlayClass)
{
	var overlayDiv = document.getElementById(placement.overlay.id);
	if (!overlayDiv) {
		playerDiv.innerHTML += "<div id=\"" + placement.overlay.id + "\" class=\"" + overlayClass + "\"></div>";
		overlayDiv = document.getElementById(placement.overlay.id);
	}

	overlayDiv.style["left"] = placement.left - 1;
	overlayDiv.style["top"] = placement.top - 1;
	overlayDiv.style["width"] = placement.right - placement.left;
	overlayDiv.style["height"] = placement.bottom - placement.top;
	overlayDiv.style["zIndex"] = 1 + (placement.coveredPlacements ? placement.coveredPlacements.length : 0);

	overlayDiv.style["backgroundColor"] = placement.overlay.color;
};

UI.displayOverlays = function (playerDiv, overlayGroups, arrangement, overlayClass)
{
	var removeOverlays = [];
	
	for (var g = 0; g < overlayGroups.length; g++) {
		var overlays = overlayGroups[g];		
		for (var i = 0; i < overlays.length; i++)
			removeOverlays[removeOverlays.length] = overlays[i];
	}
		
	if (arrangement)
		for (var i = 0; i < arrangement.placements.length; i++) {
			UI.displayOverlay(playerDiv, arrangement.placements[i], overlayClass);
			var removeIndex = removeOverlays.indexOf(arrangement.placements[i].overlay);
			if (removeIndex != -1)
				removeOverlays.splice(removeIndex, 1);
		}

	for (var i = 0; i < removeOverlays.length; i++) {
		UI.removeOverlay(playerDiv, removeOverlays[i]);
	}
};

UI.removeOverlay = function (playerDiv, overlay)
{
	var overlayDiv = document.getElementById(overlay.id);
	if (overlayDiv)
		playerDiv.removeChild(overlayDiv);
};
