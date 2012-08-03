// TODO add Object.create fallback

// Create a VIACOM.Schedule "namespace" if it doesn't already exist
var VIACOM = VIACOM || {};
VIACOM.Schedule = {};

//Turn trace for debugging
VIACOM.enableTrace = true;

// Common utility methods
VIACOM.Util = ( function() {
  // Writes trace output messages into a div named "trace-output" if the div exists and
  // MTVN.enableTrace is true.
  var trace = function(msg) {
    if(VIACOM.enableTrace) {
      if(window['console']) {
        console.log('[TRACE] ' + new Date().toString() + ' - VIACOM.Schedule.Controller - ' + msg);
      }
      var t = document.getElementById('trace-output');
      if(t) {
        t.innerHTML += '=&gt; ' + msg + '<br>';
      }
    }
  };
  return {
    'trace' : trace
  };
}());

/**
 * Utility class to make cross-origin AJAX requests (CORS) that works in both IE and
 * other browsers. One public function is exposed to perform a GET request.
 * 
 * Sample usage:
 * Cors.get('http://www.whatever.com/foo.json', {
 *   success: function(response) { alert('Got it: ' + response); },
 *   failure: function() { alert('Oops'); },
 *   timeout: function() { alert('Took too long'); }
 *   parseJson: true
 * });
 * 
 * Use the parseJson option if you want to parse the response as JSON and return the
 * result as an object. If parsing fails, the failure callback will be invoked. If parseJson
 * is false (or not set), the response passed to the success callback will be the raw
 * response text (string).
 * 
 * Known limitations:
 * - Errors can't be fully surfaced due to limitations of IE's XDomainRequest object,
 *   which gives you access to neither the status code nor the response body.
 * - POSTs are not supported (not needed at the time of implementation).
 * - withCredentials is not supported, so cookies and auth headers will not be included
 *   in the request.
 */
var Cors = ( function() {
  
	// Check if XDomainRequest exists (for IE)
	var useXdr = (window.XDomainRequest != null);
	
	// Gets a URL via AJAX using the provided options. See above for a description of
	// available options.
	var get = function(url, options) {
		if (useXdr) {
			getWithXdr(url, options);
		}
		else {
			getWithXhr(url, options	);
		}
	};
	
	// Uses the XDomainRequest object (IE's cross-domain XHR implementation)
	var getWithXdr = function(url, options) {
		var xdr = new XDomainRequest();
		xdr.timeout = (options['timeoutSeconds'] ? options.timeoutSeconds * 1000 : 0);
		xdr.onerror = (options['failure'] ? options.failure : null);
		xdr.ontimeout = (options['timeout'] ? options.timeout : null);
		xdr.onload = function() {
			handleSuccess(xdr.responseText, options);
		};
		xdr.open("get", url);
		xdr.send();
	};
	
	// Uses the standard XMLHttpRequest Level 2 object to make a cross-domain AJAX
	// request.
	var getWithXhr = function(url, options) {
		var xhr = new XMLHttpRequest();
		// Not all browsers support the timeout property on XHR natively, so
		// we need to do this instead
		var timeoutId = 0;
		if (options['timeoutSeconds']) {
			timeoutId = window.setTimeout(function() {
				xhr.abort();
				if (options['timeout']) {
					options.timeout();
				}
			}, options.timeoutSeconds * 1000);
		}
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) { // DONE
				if (timeoutId > 0) {
					window.clearTimeout(timeoutId);
				}
				if (xhr.status == 200) {
					handleSuccess(xhr.responseText, options);
				}
				else if (xhr.status >= 400) {
					if (options['failure']) {
						options.failure();
					}					
				}
			}
		};
		xhr.open("get", url);
		xhr.send();
	};
	
	// Helper function to handle a successful response. It will automatically
	// evaluate a JSON document in the body of the response, if the parseJson
	// option is true.
	var handleSuccess = function(response, options) {
		if (options['parseJson'] && options.parseJson == true) {
			try {
				response = eval('(' + response + ')');
			}
			catch (e) {
				if (options['failure']) {
					options.failure();
					return;
				}
			}
		}
		if (options['success']) {
			options.success(response);
		}
	};

	// Return object with "public" functions
	return {
		"get": get
	};
}());

VIACOM.Schedule.Controller = ( function () {

  var trace = VIACOM.Util.trace;

  var ProgramStatus = {program: null, blockIndex: 0, itemIndex: 0, wait: 0, offset: 0, adsEnabled: true, hasLoopedBlock: false};


  ProgramStatus.reset = function ()
  {
    //trace('ProgramStatus.reset called');
    this.blockIndex = 0;
    this.itemIndex = 0;
    this.wait = 0;
    this.offset = 0;
    this.adsEnabled = true;
    this.hasLoopedBlock = false;
  };

  ProgramStatus.clone = function (status)
  {

    //trace('ProgramStatus.clone called');

    this.program = status.program;
    this.blockIndex = status.blockIndex;
    this.itemIndex = status.itemIndex;
    this.wait = status.wait;
    this.offset = status.offset;
    this.adsEnabled = status.adsEnabled;
    this.hasLoopedBlock = status.hasLoopedBlock;
  };


  ProgramStatus.currentItem = function ()
  {

    //trace('ProgramStatus.currentItem caled');

    return this.program.blocks[this.blockIndex].items[this.itemIndex];
  };

  var start = function (program)
  {

    trace('start');

    program.apptBlocks = [];
    for (var b = 0; b < program.blocks.length; b++)
    if (program.blocks[b].appt)
      program.apptBlocks[program.apptBlocks.length] = b;

    var programStatus = Object.create(ProgramStatus);
    programStatus.program = program;
    return programStatus;
  };

  var goLive = function (status)
  {

    //trace('goLive');

    status.reset();
    var now = new Date().getTime();
    var program = status.program;

    if ((program.blocks.length == 0) || (program.blocks[0].items.length == 0))
      return false;

    var time = program.startTime + program.blocks[0].start * 1000;

    while (true) {
      stepToTime(time, status);

      time += status.wait;

      if (time > now) {
        status.wait = time - now;
        return true;
      }
      else {
        status.wait = 0;

        var block = program.blocks[status.blockIndex];			

        while (true) {
          var item = block.items[status.itemIndex];
          var duration = (item.duration + item.adDuration) * 1000;
          var adDuration = item.adDuration * 1000;

          time += duration;

          if (time > now) {
            if (block.dll || item.dll)
              time -= duration;
            else {
              status.offset = now + duration - time;
              status.adsEnabled = false;
              if (status.offset < adDuration) {
                status.wait = adDuration - status.offset;
                status.offset = adDuration;
              }
            }					
            return true;
          }

          var i = status.itemIndex + 1;
          if ((i < block.items.length) && (item.playlistUri == block.items[i].playlistUri) && block.items[i].auto)
            status.itemIndex = i;
          else
            break;
        }
      }

      status.itemIndex += 1;
    }
  };

  // private
  var stepToTime = function (time, status)
  {

    //trace('stepToTime called');

    var program = status.program;
    var timeOffset = time - program.startTime;

    var b = status.blockIndex;
    var i = status.itemIndex;

    var blocks = program.blocks;
    var block = blocks[b];
    var items = block.items;

    var hasLoopedBlock = status.hasLoopedBlock;

    var done = false;

    while (!done)
      {
        done = true;

        if (i >= items.length) {
          i = 0;
          hasLoopedBlock = true;
        }

        if (b + 1 < blocks.length) {
          var nextBlock = blocks[b + 1];
          var timeUntilBlockStart = nextBlock.start * 1000 - timeOffset;

          var mssl = nextBlock.mssl;
          if (nextBlock.appt)
            mssl = 0;

          var duration = items[i].duration + items[i].adDuration;
          for (var j = i + 1; (j < items.length) && (items[i].playlistUri == items[j].playlistUri) && items[j].auto; j++)
          duration += items[j].duration + items[j].adDuration;

          if ((mssl >= 0) && ((duration - mssl) * 1000 > timeUntilBlockStart) && (hasLoopedBlock || !block.dfe)) {
            b += 1;
            i = 0;
            block = blocks[b];
            hasLoopedBlock = false;
            done = false;
          }
        }
      }

      status.wait = 0;
      status.offset = 0;
      status.adsEnabled = true;

      if (b != status.blockIndex) {
        var timeUntilBlockStart = block.start * 1000 - timeOffset;

        var msse = block.msse * 1000;
        if (block.appt)
          msse = 0;

        if ((msse >= 0) && (timeUntilBlockStart > msse))
          status.wait = timeUntilBlockStart - msse;

        status.blockIndex = b;
        status.hasLoopedBlock = false;
      }
      else
        if (hasLoopedBlock)
          status.hasLoopedBlock = true;

      status.itemIndex = i;
  };

  var stepForward = function (status, playerCanStepThroughPlaylist)
  {

    trace('stepForward');

    var now = new Date().getTime();

    var i = status.itemIndex + 1;

    var items = status.program.blocks[status.blockIndex].items;

    if (playerCanStepThroughPlaylist)
      while ((i < items.length) && (items[status.itemIndex].playlistUri == items[i].playlistUri) && items[i].auto)
        i += 1;

    status.itemIndex = i;

    this.stepToTime(now, status);
  };

  var skipForward = function (status)
  {

    trace('skipForward');

    var now = new Date().getTime();

    var program = status.program;

    var b = status.blockIndex;
    var i = status.itemIndex;

    var blocks = program.blocks;
    var block = blocks[b];
    var items = block.items;

    if (status.wait > 0)
      if (block.appt)
        i = block.items.length;
    else {
      status.wait = 0;
      return;
    }
    else {
      i += 1;

      while ((i < items.length) && items[i].hidden)
        i += 1;
    }

    if (i >= items.length) {
      i = 0;
      if (b + 1 < blocks.length)
        b += 1;
      else
        b = 0;
    }

    this.jump(status, b, i);
  };

  var skipBackward = function (status)
  {
    trace('skipBackward');

    var program = status.program;

    var b = status.blockIndex;
    var i = status.itemIndex;

    var blocks = program.blocks;
    var block = blocks[b];
    var items = block.items;

    if (status.wait > 0)
      i = -1;
    else {
      i -= 1;

      while ((i >= 0) && items[i].hidden)
        i -= 1;
    }

    if (i < 0) {
      if (b > 0)
        b -= 1;
      else
        b = blocks.length - 1;

      block = blocks[b];
      items = block.items;
      i = items.length - 1;

      while ((i >= 0) && items[i].hidden)
        i -= 1;
    }

    this.jump(status, b, i);
  };

  var jump = function (status, b, i)
  {
    trace('jump(' + b + ',' + i + ')');

    var now = new Date().getTime();

    var program = status.program;

    block = program.blocks[b];

    if (b != status.blockIndex)
      status.hasLoopedBlock = false;

    status.wait = 0;
    status.offset = 0;
    status.adsEnabled = true;

    if (block.appt) {
      var nowOffset = now - program.startTime;

      if (block.start * 1000 > nowOffset) {
        status.wait = block.start * 1000 - nowOffset;
        i = 0;
      }
    }

    status.blockIndex = b;
    status.itemIndex = i;
  };

  var onPlayerVideoStarted = function (uri, status)
  {
    trace('onPlayerVideoStarted');

    var items = status.program.blocks[status.blockIndex].items;

    for (var i = status.itemIndex; (i < items.length) && items[i].auto; i++)
    if (items[i].uri == uri) {
      status.itemIndex = i;
      break;
    }
  };

  var play = function (player, status)
  {
    trace('play');

    var item = status.program.blocks[status.blockIndex].items[status.itemIndex];

    var uri = item.uri;
    var playlistUri = item.playlistUri;
    var duration = (item.duration + item.adDuration) * 1000;
    var adDuration = item.adDuration * 1000;

    if (playlistUri) {
      player.config(playlistUri);
      if (item.auto) {
        player.loadPlaylist(playlistUri);
        player.seekToPlaylistVideo(uri, duration);
      }
      else
        player.loadVideo(uri, duration);
    }
    else {
      player.config(uri);
      player.loadVideo(uri, duration);
    }

    if (status.adsEnabled)
      player.setAdDuration(adDuration);

    if (status.offset > 0)
      player.seekToOffset(status.offset);
    player.play();
  };

  var timeUntilBlockStart = function (program, b)
  {
    //trace('timeUntilBlockStart called');

    var now = new Date().getTime();
    return program.startTime + program.blocks[b].start * 1000 - now;
  };

  var addListener = function (eventName, callback) 
  {
    trace('Added Listener [ ' + eventName  + ' ]');
  }

  var pause = function () 
  {
    trace('pause');
  }

  return {
    'goLive' : goLive,
    'start' : start,
    'play' : play,
    'onPlayerVideoStarted' : onPlayerVideoStarted,
    'timeUntilBlockStart' : timeUntilBlockStart,
    'stepForward' : stepForward,
    'skipForward' : skipForward,
    'skipBackward' : skipBackward,
    'jump' : jump,
    'stepToTime' : stepToTime,
    'addListener' : addListener,
    'pause' : pause
  };


}());



