var Arrangement = {placements: null};

Arrangement.copyArrangements = function (from, to) {
	var nArrangements = from.length;
	for (var a = 0; a < nArrangements; a++) {
		var arrangement = Object.create(Arrangement);
		arrangement.construct(from[a]);
		to[to.length] = arrangement;
	};
};

Arrangement.construct = function (copyFrom)
{
	this.placements = [];

	if (copyFrom != null)
		for (var p = 0; p < copyFrom.placements.length; p++)
			this.placements[p] = copyFrom.placements[p];
};

Arrangement.findBest = function (overlays, targetRegion)
{
	var arrangements = [];
	
	for (var o = 0; o < overlays.length; o++)
		if (overlays[o].enabled)
			Arrangement.copyArrangements(overlays[o].arrange(overlays, null), arrangements);

	if (arrangements.length == 0)
		return null;
	
	var bestScore = 0;
	var bestArrangement = 0;

	for (var a = 0; a < arrangements.length; a++) {
		var score = arrangements[a].computeScore(targetRegion);
		if (score > bestScore) {
			bestScore = score;
			bestArrangement = a;
		}
	}

	return arrangements[bestArrangement];
};

Arrangement.computeScore = function (region)
{
	var score = 0;
	
	for (var p = 0; p < this.placements.length; p++)
		score += this.placements[p].computeScore(region);
	
	return score;
};


var Region = {left: 0, top: 0, right: 0, bottom: 0, axis: "LCUC", bias: 0};

Region.construct = function (left, top, right, bottom, axis, bias)
{
	this.left = left;
	this.top = top;
	this.right = right;
	this.bottom = bottom;
	this.axis = axis;
	this.bias = bias;
};

var Placement = {overlay: null, region: null, left: 0, top: 0, right: 0, bottom: 0, layer: 0};

Placement.computeScore = function (region)
{
	var regionMiddle = ((region.bottom - 1 - region.top) / 2) + this.region.bias;
	var regionCenter = ((region.right - 1 - region.left) / 2) - this.region.bias;
	
	var middle = (this.bottom - 1 + this.top) / 2;
	var center = (this.right - 1 + this.left) / 2;
	
	return this.overlay.width * this.overlay.height *
		(((middle - regionMiddle) * (middle - regionMiddle)) + ((center - regionCenter) * (center - regionCenter)));
};

Placement.overlaps = function (left, top, right, bottom)
{
	return ((bottom > this.top) && (top < this.bottom) && 
			(left < this.right) && (right > this.left));
};


var Overlay = {id: "none", width: 90, height: 90, style: "overlay", color: "#FFFF00", allowedRegions: null, enabled: true};

Overlay.addAllowedRegion = function (region)
{
	if (this.allowedRegions == null)
		this.allowedRegions = [];

	this.allowedRegions[this.allowedRegions.length] = region;
};

Overlay.arrange = function (overlays, existingArrangements)
{
	var myArrangements = [];
	var a = 0;			

	for (var r = 0; r < this.allowedRegions.length; r++)
		if (existingArrangements != null) {
			Arrangement.copyArrangements(existingArrangements, myArrangements);

			for (; a < myArrangements.length; a++)
				this.addLowPlacement(myArrangements[a].placements, this.allowedRegions[r]);
	
			Arrangement.copyArrangements(existingArrangements, myArrangements);

			for (; a < myArrangements.length; a++)
				this.addHighPlacement(myArrangements[a].placements, this.allowedRegions[r]);
		}
		else {
			var myArrangement = Object.create(Arrangement);
			myArrangement.construct(null);
			this.addLowPlacement(myArrangement.placements, this.allowedRegions[r]);
			myArrangements[a++] = myArrangement;
	
			myArrangement = Object.create(Arrangement);
			myArrangement.construct(null);
			this.addHighPlacement(myArrangement.placements, this.allowedRegions[r]);
			myArrangements[a++] = myArrangement;
		}
		
	var remainingOverlays = [];
	for (var i = 0, j = 0; i < overlays.length; i++)
		if ((this != overlays[i]) && overlays[i].enabled)
			remainingOverlays[j++] = overlays[i];
	
	var finalArrangements = [];

	if (remainingOverlays.length > 0)
		for (var j = 0; j < remainingOverlays.length; j++)
			Arrangement.copyArrangements(remainingOverlays[j].arrange(remainingOverlays, myArrangements), finalArrangements);
	else
		Arrangement.copyArrangements(myArrangements, finalArrangements);
		
	return finalArrangements;
};

Overlay.addLowPlacement = function (placements, region)
{
	var left = 0;
	var top = 0;
	var right = 0;
	var bottom = 0;
	
	switch (region.axis) {
		case "LCUC":
			left = region.left + (region.right - region.left - this.width) / 2;
			top = region.bottom - this.height;
			right = left + this.width;
			bottom = region.bottom;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						bottom = placement.top;
						top = bottom - this.height;
						if (top < region.left)
							return;
						else
							break;
					};
				};
				if (p == placements.length)
					break;
			};
			break;
	
		case "ULUR":
			left = region.left;
			top = region.top;
			right = left + this.width;
			bottom = top + this.height;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						left = placement.right;
						right = left + this.width;
						if (right > region.right)
							return;
						else
							break;
					};
				};
				if (p == placements.length)
					break;
			};
			break;
	};

	var placement = Object.create(Placement);
	placement.overlay = this;
	placement.left = left;
	placement.top = top;
	placement.right = right;
	placement.bottom = bottom;
	placement.region = region;
	
	placements[placements.length] = placement;
};

Overlay.addHighPlacement = function (placements, region)
{
	var left = 0;
	var top = 0;
	var right = 0;
	var bottom = 0;
	
	switch (region.axis) {
		case "LCUC":
			left = region.right - (region.right - region.left - this.width) / 2 - this.width;
			top = region.top;
			right = left + this.width;
			bottom = top + this.height;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						top = placement.bottom;
						bottom = top + this.height;
						if (bottom > region.bottom)
							return;
						else
							break;
					};
				};
				if (p == placements.length)
					break;
			};
			break;

		case "ULUR":
			left = region.right - this.width;
			top = region.top;
			right = region.right;
			bottom = top + this.height;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						right = placement.left;
						left = right - this.width;
						if (left < region.left)
							return;
						else
							break;
					};
				};
				if (p == placements.length)
					break;
			};
			break;
	};

	var placement = Object.create(Placement);
	placement.overlay = this;
	placement.left = left;
	placement.top = top;
	placement.right = right;
	placement.bottom = bottom;
	placement.region = region;

	placements[placements.length] = placement;
};

