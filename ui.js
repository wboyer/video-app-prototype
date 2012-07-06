var UI = {};

UI.mmss = function (duration)
{
	var minutes = Math.floor(duration / 60);
	var seconds = duration % 60;
	
	if (minutes < 10)
		minutes = "0" + minutes;
	
	if (seconds < 10)
		seconds = "0" + seconds;
	
	return  minutes + ":" + seconds;
};

UI.displayProgram = function (program, programDiv)
{
	var blocks = program.blocks;
	var innerHTML = "";
	
	for (var b = 0; b < blocks.length; b++) {
		var block = blocks[b];
		
		innerHTML += "<div id=\"t_b" + b + "\" class=\"block\">";

		innerHTML += "<div id=\"t_b" + b + "_info\">";
		innerHTML += new Date(program.startTime + block.start * 1000).toString() + "<br/>";
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
			innerHTML += "uri: <a onclick=\"App.skipToItem(" + b + "," + i + ");\">" + item.uri + "</a>, ";
			innerHTML += "dll: " + item.dll + ", ";
			innerHTML += "plUri: " + item.playlistUri + ", ";
			innerHTML += "auto: " + item.auto + ", ";
			innerHTML += "hidden: " + item.hidden + ", ";
			innerHTML += "ad: " + UI.mmss(item.adDuration) + ", ";
			innerHTML += "dur: " + UI.mmss(duration);
			innerHTML += "</div>";
		}
		
		innerHTML += "</div>";
	}

	programDiv.innerHTML = innerHTML;
};

UI.markProgramOffset = function (programDiv, markerId, markerClass, b, i, duration, offset)
{
	var markerDiv = document.getElementById(markerId);
	if (!markerDiv) {
		programDiv.innerHTML += "<div id=\"" + markerId + "\" class=\"" + markerClass + "\"></div>";
		markerDiv = document.getElementById(markerId);
	}

	itemDiv = document.getElementById("t_b" + b + "_i" + i);
	markerDiv.style["top"] = itemDiv.offsetTop + Math.floor(itemDiv.offsetHeight * offset / duration);
};

UI.updatePlayer = function (player, videoDiv)
{
	if (player.uri) {
		var playlistUri = player.playlistUri;
		if (!playlistUri)
			playlistUri = "(none)";

		var offset = Math.floor(player.offset / 1000);
		videoDiv.innerHTML = "playlistUri: " + playlistUri + "<br/>" + "uri: " + player.uri + "<br/>" + UI.mmss(offset);
		if (offset < player.adDuration)
			videoDiv.innerHTML += "<br/>ad playing";
	}
	else
		videoDiv.innerHTML = "not playing";
};

UI.displayOnAirNow = function(app, onAirNowDiv) {
	onAirNowDiv.innerHTML = "On Air Now: " + app.onAirNowItem.uri;
};

UI.displayWait = function(app, waitDiv) {
	if (app.programIsPlaying && (app.programStatus.wait > 0)) {
		waitDiv.style["visibility"] = "visible";
		waitDiv.innerHTML = "Waiting for " + UI.mmss(app.waitRemaining);
	}
	else
		waitDiv.style["visibility"] = "hidden";
};

UI.displayNextUp = function(app, nextUpDiv) {
	if (app.programIsPlaying && app.nextUpItem) {
		nextUpDiv.style["visibility"] = "visible";
		nextUpDiv.innerHTML = "Next Up: " + app.nextUpItem.uri;
	}
	else
		nextUpDiv.style["visibility"] = "hidden";
};

UI.displayNextAppt = function(app, nextApptDiv, now) {
	if (app.nextApptBlock) {
		nextApptDiv.style["visibility"] = "visible";
		var secondsUntilApptStart = app.programController.secondsUntilBlockStart(now, app.nextApptBlock);
		
		if (secondsUntilApptStart < 0)
			nextApptDiv.innerHTML = "Live Now: " + app.programController.program.blocks[app.nextApptBlock].items[0].uri;
		else
			nextApptDiv.innerHTML = "Live Soon: " + app.programController.program.blocks[app.nextApptBlock].items[0].uri + " in " + UI.mmss(secondsUntilApptStart);
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

	overlayDiv.style["backgroundColor"] = placement.overlay.color;
};

UI.displayOverlays = function (playerDiv, overlays, arrangement, overlayClass)
{
	var removeOverlays = overlays.slice();
	
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
