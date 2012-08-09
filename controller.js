var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};

VIACOM.Schedule.Controller = ( function () {

  var trace = VIACOM.Schedule.Util.trace;

  var schedule = VIACOM.Schedule.Service.getSchedule();

  //set start time in schedule until we have live data
  //schedule.startTime = this.now();

  var clock = new RemoteClock('http://schedule.mtvnservices-d.mtvi.com/api/v1/now.esi', {
    initialTimeUTC: schedule.now,       // get this from the schedule data feed
    maxDriftMsec: 2000,        // this is the default value, so you could leave it out
    updateFrequencyMsec: 1000  // also the default value
  });


  schedule.apptBlocks = [];

  for (var b = 0; b < schedule.blocks.length; b++) {
    if (schedule.blocks[b].appt) {
      schedule.apptBlocks[schedule.apptBlocks.length] = b; 
    }
  }

  // Constructor function for the ViewerStatus "class"
  var ViewerStatus = function(spec) {

    // Function to zero-out all the state variables
    this.reset = function() {
      this.blockIndex = 0;
      this.itemIndex = 0;
      this.offset = 0;
      this.time = 0;
      this.wait = 0;
      this.adsEnabled = false;
      this.hasLoopedBlock = false;
    }

      if (spec) {
        this.blockIndex = spec.blockIndex || 0;
        this.itemIndex = spec.itemIndex || 00;
        this.offset = spec.offset || 0;
        this.time = spec.time || 0;
        this.wait = spec.wait || 0;
        this.adsEnabled = spec.adsEnabled || false;
        this.hasLoopedBlock = spec.hasLoooedBlock || false;
      }
      else {
        this.reset()
      }
    // Create a read-only "interface" to the internal state
    var ro = {};

    // Create accessor functions for each property
    var that = this;
    for (var prop in this) {
      // Skip functions
      if (typeof this[prop] == 'function') {
        continue;
      }
      // Create the accessor function. See below for why it's done this way:
      // http://www.mennovanslooten.nl/blog/post/62/
      ro[prop] = (function(p) {
        return function() {
          return that[p];
        }
      })(prop);
    }

    this.readOnlyCopy = ro;
  }

  var viewer = new ViewerStatus();
  var live = new ViewerStatus();



  var now = function () {
    // will need to base this on server time eventually.
    var theTimeIs = new Date().getTime();
    //var theTimeIs = clock.getCurrentTime()
    //trace("the time is: " + theTimeIs);
    //trace("the clock sez: " + theClockSez);
    //return theTimeIs;
    return theTimeIs;
  
  }

  // private
  // TODO done
  var stepToTime = function (time, status)
  {


    //var schedule = schedule;
    var timeOffset = time - schedule.startTime;

    var b = status.blockIndex;
    var i = status.itemIndex;

    var blocks = schedule.blocks;
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
        if (block.appt) {
          msse = 0;
        }
        if ((msse >= 0) && (timeUntilBlockStart > msse)) {
          status.wait = timeUntilBlockStart - msse;
        }
        status.blockIndex = b;
        status.hasLoopedBlock = false;
      }
      else {
        if (hasLoopedBlock) {
          status.hasLoopedBlock = true;
        }
      }
      status.itemIndex = i;
  };
  //TODO figure out what to do with the boolean return values
  var sync = function (status, now)
  {

    status.blockIndex = 0;
    status.itemIndex = 0;
    status.offset = 0;
    status.time = 0;
    status.hasLoopedBlock = false;
    status.wait = 0;


    //var schedule = schedule;


    if ((schedule.blocks.length == 0) || (schedule.blocks[0].items.length == 0)) {
      return false;
    }

    var time = schedule.startTime + schedule.blocks[0].start * 1000;
    while (true) {
      stepToTime(time, status);

      time += status.wait;

      if (time > now) {
        status.wait = time - now;
        return true;
      }
      else {
        status.wait = 0;

        var block = schedule.blocks[status.blockIndex];			

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
    return true;
  };


  var goLive = function () {
    trace("go live");
    return sync(viewer, this.now());
  }



  var step = function (status, playerCanStepThroughPlaylist)
  {

    trace('stepForward');


    var i = status.itemIndex + 1;

    var items = schedule.blocks[status.blockIndex].items;

    if (playerCanStepThroughPlaylist) {
      while ((i < items.length) && (items[status.itemIndex].playlistUri == items[i].playlistUri) && items[i].auto) {
        i += 1;
      }
    }

    status.itemIndex = i;

    return stepToTime(now(), status);
  };

  var stepForward = function (playerCanStepThroughPlaylist) {
    return step(viewer, playerCanStepThroughPlaylist);
  }

  var skipForward = function ()
  {

    trace('skipForward');

    var now = this.now();

    //var schedule = schedule;

    var b = viewer.blockIndex;
    var i = viewer.itemIndex;

    var blocks = schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    if (viewer.wait > 0) {
      if (block.appt) {
        i = block.items.length;
      }
      else {
        viewer.wait = 0;
        return viewer.readOnlyCopy;
      }
    }
    else {
      i += 1;
      while ((i < items.length) && items[i].hidden) {
        i += 1;
      }
    }

    if (i >= items.length) {
      i = 0;
      if (b + 1 < blocks.length) {
        b += 1;
      }
      else {
        b = 0;
      }
    }

    return this.jump(b, i);
  };

  var skipBackward = function ()
  {
    trace('skipBackward');

    //var schedule = schedule;

    var b = viewer.blockIndex;
    var i = viewer.itemIndex;

    var blocks = schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    if (viewer.wait > 0) {
      i = -1;
    }
    else {
      i -= 1;

      while ((i >= 0) && items[i].hidden) {
        i -= 1;
      }
    }

    if (i < 0) {
      if (b > 0) {
        b -= 1;
      }
      else {
        b = blocks.length - 1;
      }

      block = blocks[b];
      items = block.items;
      i = items.length - 1;

      while ((i >= 0) && items[i].hidden) {
        i -= 1;
      }
    }

    return this.jump(b, i);
  };

  var jump = function (blockIndex, itemIndex)
  {
    trace('jump(' + blockIndex + ',' + itemIndex + ')');

    var now = this.now();

    //var schedule = schedule;

    block = schedule.blocks[blockIndex];

    if (blockIndex != viewer.blockIndex) {
      viewer.hasLoopedBlock = false;
    }

    viewer.wait = 0;
    viewer.offset = 0;
    viewer.adsEnabled = true;

    if (block.appt) {
      var nowOffset = now - schedule.startTime;

      if (block.start * 1000 > nowOffset) {
        viewer.wait = block.start * 1000 - nowOffset;
        i = 0;
      }
    }

    viewer.blockIndex = blockIndex;
    viewer.itemIndex = itemIndex;

    return viewer.readOnlyCopy;

  };

  var onPlayerVideoStarted = function (uri)
  {
    trace('onPlayerVideoStarted');

    var items = schedule.blocks[viewer.blockIndex].items;

    for (var i = viewer.itemIndex; (i < items.length) && items[i].auto; i++)
    if (items[i].uri == uri) {
      viewer.itemIndex = i;
      break;
    }
     
    return viewer.readOnlyCopy;

  };

  //TODO remove status param, figure our what to do with player
  var play = function (player)
  {
    trace('play');

    var item = schedule.blocks[viewer.blockIndex].items[viewer.itemIndex];

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
      else {
        player.loadVideo(uri, duration);
      }
    }
    else {
      player.config(uri);
      player.loadVideo(uri, duration);
    }

    if (viewer.adsEnabled) {
      player.setAdDuration(adDuration);
    }

    if (viewer.offset > 0) {
      player.seekToOffset(viewer.offset);
    }
    player.play();

     return viewer.readOnlyCopy;
  };

  var timeUntilBlockStart = function (b) {

    var now = this.now();
    //trace('timeUntilBlockStart(' + b + ')');

    return schedule.startTime + schedule.blocks[b].start * 1000 - now;
  };

  var addListener = function (eventName, callback) {
    trace('Added Listener [ ' + eventName  + ' ]');
  }

  var getViewerStatus = function () {
     return viewer.readOnlyCopy;
  }

  var getLiveStatus = function () {
    //trace("getLiveStatus");
    sync(live, this.now());
    return live.readOnlyCopy;
  }

  var currentItem = function () {
    return schedule.blocks[viewer.blockIndex].items[viewer.itemIndex];
  }
  var nextUpItem = function() {
    var next = new ViewerStatus(viewer);
    this.step
    return schedule.blocks[next.blockIndex].items[next.itemIndex];
  }
  var currentLiveItem = function () {
    return schedule.blocks[live.blockIndex].items[live.itemIndex];
  }

  var setWait = function(secs) {
    trace ("Setting viewer wait to: " + secs + "secs.");
    viewer.wait = secs;
  }



  return {
    'goLive' : goLive,
    'play' : play,
    'onPlayerVideoStarted' : onPlayerVideoStarted,
    'timeUntilBlockStart' : timeUntilBlockStart,
    'skipForward' : skipForward,
    'skipBackward' : skipBackward,
    'jump' : jump,
    'addListener' : addListener,
    'now' : now,
    'getViewerStatus' : getViewerStatus,
    'getCurrentItem' : currentItem,
    'getNextUpItem' : nextUpItem,
    'getLiveItem' : currentLiveItem,
    'getLiveStatus' : getLiveStatus,
    'setWait' : setWait
  };


}());



