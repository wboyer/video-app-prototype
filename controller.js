var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};

VIACOM.Schedule.Controller = ( function () {

  var trace = VIACOM.Schedule.Util.trace;

  var schedule = VIACOM.Schedule.Service.getSchedule();

  schedule.apptBlocks = [];

  for (var b = 0; b < schedule.blocks.length; b++) {
    if (schedule.blocks[b].appt) {
      schedule.apptBlocks[schedule.apptBlocks.length] = b; 
    }
  }


   var viewerStatus = function (spec) {

    var that  = {};

    var blockIndex = function ()  {
      return  spec.blockIndex;
    }
    var itemIndex = function ()  {
      return  spec.itemIndex;
    }
    var offset = function ()  {
      return  spec.offset;
    }
    var time = function ()  {
      return  spec.timex;
    }
    var hasLoopedBlock = function ()  {
      return  spec.hasLoopedBlock;
    }
    var wait = function ()  {
      return  spec.wait;
    }


    that.blockIndex =  blockIndex;
    that.itemIndex = itemIndex;
    that.offset = offset;
    that.time = time;
    that.hasLoopedBlock = hasLoopedBlock;
    that.wait = wait;

    return that;


  }

  var viewerStatusState = {
    blockIndex: 0, 
    itemIndex: 0, 
    offset: 0, 
    time : 0, 
    hasLoopedBlock: false,
    wait: 0
  }

  var liveStatusState = {
    blockIndex: 0, 
    itemIndex: 0, 
    offset: 0, 
    time : 0, 
    hasLoopedBlock: false,
    wait: 0
  }

  var now = function () {
    // will need to base this on server time eventually.
    return new Date().getTime();
    //
  }

  // private
  // TODO done
  var stepToTime = function (time, status)
  {


    var program = schedule;
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

    //trace('it is now: ' + now);

    //status.reset();
    //this could be a method, right?
    //statusState = {
    //  blockIndex: 0, 
    //  itemIndex: 0, 
    //  offset: 0, 
    //  time : 0, 
    //  hasLoopedBlock: false,
    //  wait: 0
    //};

    status.blockIndex = 0;
    status.itemIndex = 0;
    status.offset = 0;
    status.time = 0;
    status.hasLoopedBlock = false;
    status.wait = 0;


    var program = schedule;


    if ((program.blocks.length == 0) || (program.blocks[0].items.length == 0)) {
      return false;
    }

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
    return viewerStatus(statusState);
  };


  var goLive = function () {
    trace("go live");
    return sync(viewerStatusState, this.now());
  }



  var stepForward = function (playerCanStepThroughPlaylist)
  {

    trace('stepForward');

    var now = this.now();

    var i = viewerStatusState.itemIndex + 1;

    var items = schedule.blocks[viewerStatusState.blockIndex].items;

    if (playerCanStepThroughPlaylist) {
      while ((i < items.length) && (items[viewerStatusState.itemIndex].playlistUri == items[i].playlistUri) && items[i].auto) {
        i += 1;
      }
    }

    viewerStatusState.itemIndex = i;

    return stepToTime(now, viewerStatusState);
  };

  var skipForward = function ()
  {

    trace('skipForward');

    var now = this.now();

    var program = schedule;

    var b = viewerStatusState.blockIndex;
    var i = viewerStatusState.itemIndex;

    var blocks = program.blocks;
    var block = blocks[b];
    var items = block.items;

    if (viewerStatusState.wait > 0) {
      if (block.appt) {
        i = block.items.length;
      }
      else {
        viewerStatusState.wait = 0;
        return viewerStatus(viewerStatusState);
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

    var program = schedule;

    var b = viewerStatusState.blockIndex;
    var i = viewerStatusState.itemIndex;

    var blocks = program.blocks;
    var block = blocks[b];
    var items = block.items;

    if (viewerStatusState.wait > 0) {
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

    var program = schedule;

    block = program.blocks[blockIndex];

    if (blockIndex != viewerStatusState.blockIndex) {
      viewerStatusState.hasLoopedBlock = false;
    }

    viewerStatusState.wait = 0;
    viewerStatusState.offset = 0;
    viewerStatusState.adsEnabled = true;

    if (block.appt) {
      var nowOffset = now - program.startTime;

      if (block.start * 1000 > nowOffset) {
        viewerStatusState.wait = block.start * 1000 - nowOffset;
        i = 0;
      }
    }

    viewerStatusState.blockIndex = blockIndex;
    viewerStatusState.itemIndex = itemIndex;

    return viewerStatus(viewerStatusState);

  };

  var onPlayerVideoStarted = function (uri)
  {
    trace('onPlayerVideoStarted');

    var items = schedule.blocks[viewerStatusState.blockIndex].items;

    for (var i = viewerStatusState.itemIndex; (i < items.length) && items[i].auto; i++)
    if (items[i].uri == uri) {
      viewerStatusState.itemIndex = i;
      break;
    }
     
    return viewerStatus(viewerStatusState);

  };

  //TODO remove status param, figure our what to do with player
  var play = function (player)
  {
    trace('play');

    var item = schedule.blocks[viewerStatusState.blockIndex].items[viewerStatusState.itemIndex];

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

    if (viewerStatusState.adsEnabled) {
      player.setAdDuration(adDuration);
    }

    if (viewerStatusState.offset > 0) {
      player.seekToOffset(viewerStatusState.offset);
    }
    player.play();

    return viewerStatus(viewerStatusState);
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
    return viewerStatus(viewerStatusState);
  }

  var getLiveStatus = function () {
    //trace("getLiveStatus");
    sync(liveStatusState, this.now());
    return viewerStatus(liveStatusState);
  }

  var currentItem = function () {
    return schedule.blocks[viewerStatusState.blockIndex].items[viewerStatusState.itemIndex];
  }
  var currentLiveItem = function () {
    //trace( schedule.blocks[liveStatusState.blockIndex].items[liveStatusState.itemIndex].uri);
    return schedule.blocks[liveStatusState.blockIndex].items[liveStatusState.itemIndex];
  }



  return {
    'goLive' : goLive,
    'play' : play,
    'onPlayerVideoStarted' : onPlayerVideoStarted,
    'timeUntilBlockStart' : timeUntilBlockStart,
    'stepForward' : stepForward,
    'skipForward' : skipForward,
    'skipBackward' : skipBackward,
    'jump' : jump,
    'addListener' : addListener,
    'now' : now,
    'getViewerStatus' : getViewerStatus,
    'getCurrentItem' : currentItem,
    'getLiveItem' : currentLiveItem,
    'getLiveStatus' : getLiveStatus
  };


}());



