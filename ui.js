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

UI.drawProgram = function (program, programDiv)
{
	var blocks = program.blocks;
	var innerHTML = "";
	
	for (var b = 0; b < blocks.length; b++) {
		innerHTML += "<div id=\"t_b" + b + "\" class=\"block\">";
		innerHTML += "<div id=\"t_b" + b + "_info\">" + new Date(program.startOffset + blocks[b].start*1000).toString() + "</div>";

		var items = blocks[b].items;
		
		for (var i = 0; i < items.length; i++) {
			var duration = items[i].duration;
			var uri = items[i].uri;
			innerHTML += "<div id=\"t_b" + b + "_i" + i + "\" class=\"item\" style=\"min-height: " + Math.floor(duration/10) + "px;\">" + UI.mmss(duration) + " " + uri + "</div>";
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
	var config = player.config;
	if (config == "")
		config = "(empty)";
	
	videoDiv.innerHTML = "uri: " + player.uri + "<br/>" + "config: " + config + "<br/>" + UI.mmss(Math.floor(player.offset / 1000));
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
	
	if (arrangement != null)
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
