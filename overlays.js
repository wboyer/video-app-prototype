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

	if (copyFrom)
		for (var p = 0; p < copyFrom.placements.length; p++)
			this.placements[p] = copyFrom.placements[p];
};

Arrangement.copyAndAddPlacement = function (placement)
{
	var arrangement = Object.create(Arrangement);
	arrangement.construct(this);
	arrangement.placements[arrangement.placements.length] = placement;
	return arrangement;
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

Arrangement.computeScore = function (targetRegion)
{
	var score = 0;
	
	for (var p = 0; p < this.placements.length; p++)
		score += this.placements[p].computeScore(targetRegion);
	
	return score;
};


var Placement = {overlay: null, allowedRegion: null, left: 0, top: 0, right: 0, bottom: 0};

Placement.construct = function (overlay, left, top, right, bottom, allowedRegion)
{
	var placement = Object.create(Placement);
	placement.overlay = overlay;
	placement.left = left;
	placement.top = top;
	placement.right = right;
	placement.bottom = bottom;
	placement.allowedRegion = allowedRegion;	
	return placement;
};

Placement.computeScore = function (targetRegion)
{
	var regionMiddle = ((targetRegion.bottom - 1 - targetRegion.top) / 2) + this.allowedRegion.bias;
	var regionCenter = ((targetRegion.right - 1 - targetRegion.left) / 2) - this.allowedRegion.bias;
	
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

var Overlay = {id: "none", width: 90, height: 90, style: "overlay", color: "#FFFF00", allowedRegions: null, canBeCovered: false, enabled: true};

Overlay.addAllowedRegion = function (region)
{
	if (this.allowedRegions == null)
		this.allowedRegions = [];

	this.allowedRegions[this.allowedRegions.length] = region;
};

Overlay.arrange = function (overlays, existingArrangements)
{
	var newArrangements = [];

	if (existingArrangements == null)
	{
		var newArrangement = Object.create(Arrangement);
		newArrangement.construct(null);
		existingArrangements = [];
		existingArrangements[0] = newArrangement;
	}
	
	for (var r = 0; r < this.allowedRegions.length; r++)
		for (var a  = 0; a < existingArrangements.length; a++)
		{
			var arrangement = existingArrangements[a];

			var newPlacements = this.createLowPlacements(arrangement.placements, this.allowedRegions[r]);
			if (newPlacements.length > 0)
				for (var p = 0; p < newPlacements.length; p++)
					newArrangements[newArrangements.length] = arrangement.copyAndAddPlacement(newPlacements[p]);
			else
				newArrangements[newArrangements.length] = arrangement;
			
			newPlacements = this.createHighPlacements(arrangement.placements, this.allowedRegions[r]);
			if (newPlacements.length > 0)
				for (var p = 0; p < newPlacements.length; p++)
					newArrangements[newArrangements.length] = arrangement.copyAndAddPlacement(newPlacements[p]);
			else
				newArrangements[newArrangements.length] = arrangement;
		}

	var remainingOverlays = [];
	for (var i = 0, j = 0; i < overlays.length; i++)
		if ((this != overlays[i]) && overlays[i].enabled)
			remainingOverlays[j++] = overlays[i];
	
	var finalArrangements = [];

	if (remainingOverlays.length > 0)
		for (var j = 0; j < remainingOverlays.length; j++)
			Arrangement.copyArrangements(remainingOverlays[j].arrange(remainingOverlays, newArrangements), finalArrangements);
	else
		Arrangement.copyArrangements(newArrangements, finalArrangements);
		
	return finalArrangements;
};

Overlay.createLowPlacements = function (existingPlacements, allowedRegion)
{
	var newPlacements = [];

	switch (allowedRegion.axis) {
		case "LCUC":
			var left = allowedRegion.left + (allowedRegion.right - allowedRegion.left - this.width) / 2;
			var top = allowedRegion.bottom - this.height;
			var right = left + this.width;
			var bottom = allowedRegion.bottom;

			while (true) {
				var coveredPlacements = null;
				var cantCoverPlacement = null;
				var nextBottom = allowedRegion.top;
				
				for (var p = 0; p < existingPlacements.length; p++) {
					var placement = existingPlacements[p];
					if (placement.overlaps(left, top, right, bottom))
						if (placement.overlay.canBeCovered) {
							if (!coveredPlacements)
								coveredPlacements = [];
							coveredPlacements[coveredPlacements.length] = placement;
							if (nextBottom > placement.top)
								nextBottom = placement.top;
						}
						else {
							cantCoverPlacement = placement;
							nextBottom = placement.top;
							break;
						}
				}

				if (!cantCoverPlacement) {
					newPlacements[newPlacements.length] = Placement.construct(this, left, top, right, bottom, allowedRegion, coveredPlacements);
					if (!coveredPlacements)
						break;
				}
				
				bottom = nextBottom;
				top = bottom - this.height;
				if (top < allowedRegion.top)
					break;
			};

			break;

		case "ULUR":
			var left = allowedRegion.left;
			var top = allowedRegion.top;
			var right = left + this.width;
			var bottom = top + this.height;

			while (true) {
				var coveredPlacements = null;
				var cantCoverPlacement = null;
				var nextLeft = allowedRegion.right;
				
				for (var p = 0; p < existingPlacements.length; p++) {
					var placement = existingPlacements[p];
					if (placement.overlaps(left, top, right, bottom))
						if (placement.overlay.canBeCovered) {
							if (!coveredPlacements)
								coveredPlacements = [];
							coveredPlacements[coveredPlacements.length] = placement;
							if (nextLeft > placement.right)
								nextLeft = placement.right;
						}
						else {
							cantCoverPlacement = placement;
							nextLeft = placement.right;
							break;
						}
				}

				if (!cantCoverPlacement) {
					newPlacements[newPlacements.length] = Placement.construct(this, left, top, right, bottom, allowedRegion, coveredPlacements);
					if (!coveredPlacements)
						break;
				}
				
				left = nextLeft;
				right = left + this.width;
				if (right > allowedRegion.right)
					break;
			};
			
			break;
	};
	
	return newPlacements;
};

Overlay.createHighPlacements = function (existingPlacements, allowedRegion)
{
	var newPlacements = [];

	switch (allowedRegion.axis) {
		case "LCUC":
			var left = allowedRegion.right - (allowedRegion.right - allowedRegion.left - this.width) / 2 - this.width;
			var top = allowedRegion.top;
			var right = left + this.width;
			var bottom = top + this.height;
			
			while (true) {
				var coveredPlacements = null;
				var cantCoverPlacement = null;
				var nextTop = allowedRegion.bottom;
				
				for (var p = 0; p < existingPlacements.length; p++) {
					var placement = existingPlacements[p];
					if (placement.overlaps(left, top, right, bottom))
						if (placement.overlay.canBeCovered) {
							if (!coveredPlacements)
								coveredPlacements = [];
							coveredPlacements[coveredPlacements.length] = placement;
							if (nextTop > placement.bottom)
								nextTop = placement.bottom;
						}
						else {
							cantCoverPlacement = placement;
							nextTop = placement.bottom;
							break;
						}
				}

				if (!cantCoverPlacement) {
					newPlacements[newPlacements.length] = Placement.construct(this, left, top, right, bottom, allowedRegion, coveredPlacements);
					if (!coveredPlacements)
						break;
				}
				
				top = nextTop;
				bottom = top + this.height;
				if (bottom > allowedRegion.bottom)
					break;
			};

			break;

		case "ULUR":
			var left = allowedRegion.right - this.width;
			var top = allowedRegion.top;
			var right = allowedRegion.right;
			var bottom = top + this.height;
			
			while (true) {
				var coveredPlacements = null;
				var cantCoverPlacement = null;
				var nextRight = allowedRegion.left;
				
				for (var p = 0; p < existingPlacements.length; p++) {
					var placement = existingPlacements[p];
					if (placement.overlaps(left, top, right, bottom))
						if (placement.overlay.canBeCovered) {
							if (!coveredPlacements)
								coveredPlacements = [];
							coveredPlacements[coveredPlacements.length] = placement;
							if (nextRight > placement.left)
								nextRight = placement.left;
						}
						else {
							cantCoverPlacement = placement;
							nextRight = placement.left;
							break;
						}
				}

				if (!cantCoverPlacement) {
					newPlacements[newPlacements.length] = Placement.construct(this, left, top, right, bottom, allowedRegion, coveredPlacements);
					if (!coveredPlacements)
						break;
				}
				
				right = nextRight;
				left = right - this.width;
				if (left < allowedRegion.left)
					break;
			};
			
			break;
	};
	
	return newPlacements;
};

Overlay.addLowPlacement = function (placements, allowedRegion)
{
	var left = 0;
	var top = 0;
	var right = 0;
	var bottom = 0;
	
	switch (allowedRegion.axis) {
		case "LCUC":
			left = allowedRegion.left + (allowedRegion.right - allowedRegion.left - this.width) / 2;
			top = allowedRegion.bottom - this.height;
			right = left + this.width;
			bottom = allowedRegion.bottom;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						bottom = placement.top;
						top = bottom - this.height;
						if (top < allowedRegion.left)
							return;
						else
							break;
					}
				}
				if (p == placements.length)
					break;
			};
			break;
	
		case "ULUR":
			left = allowedRegion.left;
			top = allowedRegion.top;
			right = left + this.width;
			bottom = top + this.height;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						left = placement.right;
						right = left + this.width;
						if (right > allowedRegion.right)
							return;
						else
							break;
					}
				}
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
	placement.allowedRegion = allowedRegion;
	
	placements[placements.length] = placement;
};

Overlay.addHighPlacement = function (placements, allowedRegion)
{
	var left = 0;
	var top = 0;
	var right = 0;
	var bottom = 0;
	
	switch (allowedRegion.axis) {
		case "LCUC":
			left = allowedRegion.right - (allowedRegion.right - allowedRegion.left - this.width) / 2 - this.width;
			top = allowedRegion.top;
			right = left + this.width;
			bottom = top + this.height;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						top = placement.bottom;
						bottom = top + this.height;
						if (bottom > allowedRegion.bottom)
							return;
						else
							break;
					}
				}
				if (p == placements.length)
					break;
			};
			break;

		case "ULUR":
			left = allowedRegion.right - this.width;
			top = allowedRegion.top;
			right = allowedRegion.right;
			bottom = top + this.height;
			
			while (true) {
				var p = 0;
				for (; p < placements.length; p++) {
					var placement = placements[p];
					if (placement.overlaps(left, top, right, bottom)) {
						right = placement.left;
						left = right - this.width;
						if (left < allowedRegion.left)
							return;
						else
							break;
					}
				}
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
	placement.allowedRegion = allowedRegion;

	placements[placements.length] = placement;
};

