var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};

VIACOM.Schedule.Controller = (function () {

  var trace = VIACOM.Schedule.Util.trace;

  var Cors = VIACOM.Cors;

  var schedules = {}, latestSchedules = {}, clock = null;

  // Constructor function for the ScheduleContext "class"
  var ScheduleContext = function (spec)
  {
    // Function to zero-out all the state variables
    this.reset = function() {
      this.blockIndex = 0;
      this.itemIndex = 0;
      this.offset = 0;
      this.wait = 0;
      this.adsEnabled = false;
      this.hasLoopedBlock = false;
    };

    if (spec) {
      this.schedule = spec.schedule;
      this.blockIndex = spec.blockIndex;
      this.itemIndex = spec.itemIndex;
      this.offset = spec.offset;
      this.wait = spec.wait;
      this.adsEnabled = spec.adsEnabled;
      this.hasLoopedBlock = spec.hasLoopedBlock;
    }
    else
      this.reset();
  };

  var now = function ()
  {
    //var theTimeIs = new Date().getTime();
    var theTimeIs = clock.getCurrentTime();
    //trace("the time is: " + theTimeIs);
    return theTimeIs;
  };

  // private
  // Step to a particular point in time
  var stepToTime = function (context, time)
  {
    var schedule = context.schedule;

    var timeOffset = time - schedule.startTime;

    var b = context.blockIndex;
    var i = context.itemIndex;

    var blocks = schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    var hasLoopedBlock = context.hasLoopedBlock;

    var done = false;

    while (!done)
    {
      done = true;

      // if we've reached the end of the items in a block, we've looped back
      if (i >= items.length) {
        i = 0;
        hasLoopedBlock = true;
      }

      // if there is at least one more block
      if (b + 1 < blocks.length) {

        var nextBlock = blocks[b + 1];
        var timeUntilBlockStart = nextBlock.start * 1000 - timeOffset;

        // if next block is appt block, mssl is overridden
        var mssl = nextBlock.mssl;
        if (nextBlock.appt)
          mssl = 0;

        // total duration = item duration + ad duration
        var duration = items[i].duration + items[i].adDuration;

        // if the next item is in the same playlist and it's an auto playlist 
        // (i.e., the player handles stepping), add up the durations
        // of the items in that playlist
        for (var j = i + 1; (j < items.length) && (items[i].playlistUri == items[j].playlistUri) && items[j].auto; j++)
          duration += items[j].duration + items[j].adDuration;

        // 1. Is the duration of the current block minus the mssl of the next block (i.e., the minimum time to finish the block)
        //    greater than the time until the next block?
        // 2. Has the the block looped or does the block prohibit finishing early?
        //    If both of these are true, then continue to next block
        if ((mssl >= 0) && ((duration - mssl) * 1000 > timeUntilBlockStart) && (hasLoopedBlock || !block.dfe)) {
          b += 1;
          i = 0;
          block = blocks[b];
          hasLoopedBlock = false;
          done = false;
        }
      }
    }

    context.wait = 0;
    context.offset = 0;
    context.adsEnabled = true;

    // have we stepped to the next block?
    if (b != context.blockIndex)
      context.hasLoopedBlock = false;
    else
      if (hasLoopedBlock)
        context.hasLoopedBlock = true;

    // see if we need to wait for this block to start
    var timeUntilBlockStart = block.start * 1000 - timeOffset;

    var msse = block.msse * 1000;
    // if it's an appt block, we can't start early
    if (block.appt)
      msse = 0;

    // if the time until the next block is greater than msse, wait out the difference
    if ((msse >= 0) && (timeUntilBlockStart > msse)) {
      context.wait = timeUntilBlockStart - msse;
      i = 0;
    }
    
    context.blockIndex = b;
    context.itemIndex = i;
  };

  // Sync ScheduleContext with what is live now if possible
  var sync = function (context, now)
  {
    var schedule = context.schedule;

    if (!now)
      now = this.now();
    
    context.reset();

    if ((schedule.blocks.length == 0) || (schedule.blocks[0].items.length == 0))
      return null;

    // set time to when the first block should start
    var time = schedule.startTime + schedule.blocks[0].start * 1000;

    while (true) {
      // step forward to the beginning
      this.stepToTime(context, time);

      // catch blocks with no duration
      if (context.hasLoopedBlock && (time == schedule.startTime + schedule.blocks[context.blockIndex].start * 1000))
        return context;
      
      // if we need to wait, add it
      time += context.wait;

      // if "live" is in the future, we're done, wait it out.
      if (time > now) {
        context.wait = time - now;
        return context;
      }
      else {
        context.wait = 0;

        var block = schedule.blocks[context.blockIndex];			

        while (true) {
          var item = block.items[context.itemIndex];
          var duration = (item.duration + item.adDuration) * 1000;
          var adDuration = item.adDuration * 1000;

          time += duration;

          if (time >= now) {
            if (block.dll || item.dll)
              time -= duration;
            else {
              context.offset = now + duration - time;
              context.adsEnabled = false;
              if (context.offset < adDuration) {
                context.wait = adDuration - context.offset;
                context.offset = adDuration;
              }
            }
            return context;
          }

          var i = context.itemIndex + 1;
          if ((i < block.items.length) && (item.playlistUri == block.items[i].playlistUri) && block.items[i].auto)
            context.itemIndex = i;
          else
            break;
        }
      }

      context.itemIndex += 1;
    }
  };

  var newContext = function (schedule)
  {
    var context = new ScheduleContext();
    context.schedule = schedule;
    return context;
  };

  var cloneContext = function (context)
  {
    return new ScheduleContext(context);
  };

  var step = function (context, playerCanStepThroughPlaylist)
  {
    trace('step');

    var i = context.itemIndex + 1;

    var items = context.schedule.blocks[context.blockIndex].items;

    if (playerCanStepThroughPlaylist) {
      while ((i < items.length) && (items[context.itemIndex].playlistUri == items[i].playlistUri) && items[i].auto)
        i += 1;
    }

    context.itemIndex = i;

    this.stepToTime(context, this.now());
    
    return context;
  };

  var stepForward = function (context, playerCanStepThroughPlaylist)
  {
    trace('stepForward');
    this.step(context, playerCanStepThroughPlaylist);
    fireScheduleEvent(context.schedule.key, 'Step'); 
    return context;
  };

  var skipForward = function (context)
  {
    trace('skipForward');

    var b = context.blockIndex;
    var i = context.itemIndex;

    var blocks = context.schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    if (context.wait > 0) {
      if (block.appt)
        i = block.items.length;
      else {
        context.wait = 0;
        return;
      }
    }
    else {
      var playlistUri = items[i].playlistUri;
      if (items[i].hidden == "playlist")
        while ((i < items.length) && (items[i].playlistUri == playlistUri) && (items[i].hidden == "playlist"))
          i += 1;
      else
      {
        while ((i < items.length) && (items[i].hidden == "pre"))
          i += 1;

        if ((i < items.length) && !items[i].hidden)
          i += 1;

        while ((i < items.length) && (items[i].hidden == "post"))
          i += 1;
      }
    }

    if (i >= items.length) {
      i = 0;
      if (b + 1 < blocks.length)
        b += 1;
      else
        b = 0;
    }

    this.jump(context, b, i);
    fireScheduleEvent(context.schedule.key, 'SkipForward');
    return context;
  };

  var skipBackward = function (context)
  {
    trace('skipBackward');

    var b = context.blockIndex;
    var i = context.itemIndex;

    var blocks = context.schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    var playlistUri = items[i].playlistUri;
    if (items[i].hidden == "playlist")
      while ((i >= 0) && (items[i].playlistUri == playlistUri) && (items[i].hidden == "playlist"))
        i -= 1;
    else {
      while ((i >= 0) && (items[i].hidden == "post"))
        i -= 1;

      if ((i >= 0) && !items[i].hidden)
        i -= 1;

      while ((i >= 0) && (items[i].hidden == "pre"))
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
    }

    var playlistUri = items[i].playlistUri;
    while ((i > 0) && (items[i-1].playlistUri == playlistUri) && (items[i].hidden == "playlist"))
      i -= 1;

    while ((i >= 0) && items[i].hidden == "post")
      i -= 1;

    while ((i > 0) && (items[i-1].hidden == "pre"))
      i -= 1;
    
    this.jump(context, b, i);
    fireScheduleEvent(context.schedule.key, 'SkipBackward');
    return context;
  };

  var jump = function (context, blockIndex, itemIndex)
  {
    trace('jump(' + blockIndex + ',' + itemIndex + ')');

    var schedule = context.schedule;
    var now = this.now();

    block = schedule.blocks[blockIndex];

    if (blockIndex != context.blockIndex)
      context.hasLoopedBlock = false;

    context.wait = 0;
    context.offset = 0;
    context.adsEnabled = true;

    if (block.appt) {
      var nowOffset = now - schedule.startTime;

      if (block.start * 1000 > nowOffset) {
        context.wait = block.start * 1000 - nowOffset;
        itemIndex = 0;
      }
    }

    context.blockIndex = blockIndex;
    context.itemIndex = itemIndex;

    return context;
  };

  var onPlayerVideoStarted = function (context, uri)
  {
    trace('onPlayerVideoStarted');

    var items = context.schedule.blocks[context.blockIndex].items;

    for (var i = context.itemIndex; (i < items.length) && items[i].auto; i++)
      if (items[i].videoUri == uri) {
        context.itemIndex = i;
        break;
      }

    return context;
  };

  var play = function (context, player)
  {
    trace('play');

    var item = context.schedule.blocks[context.blockIndex].items[context.itemIndex];

    var uri = item.videoUri;
    var playlistUri = item.playlistUri;
    var duration = (item.duration + item.adDuration) * 1000;
    var adDuration = item.adDuration * 1000;

    if (playlistUri) {
      player.config(playlistUri);
      if (!uri || item.auto) {
        player.loadPlaylist(playlistUri);
        if (uri)
          player.seekToPlaylistVideo(uri, duration);
      }
      else
        player.loadVideo(uri, duration);
    }
    else {
      player.config(uri);
      player.loadVideo(uri, duration);
    }

    if (context.adsEnabled)
      player.setAdDuration(adDuration);

    if (context.offset > 0)
      player.seekToOffset(context.offset);

    player.play();

    return context;
  };

  var guide = function (schedule, fromTime, toTime, callback)
  {
    var context = this.newContext(schedule);
    this.sync(context, fromTime);
    
    var time = this.blockStart(schedule, context.blockIndex);
    time += context.wait;

    var playlistUri = null;
    var playlistMeta = null;

    while (time < toTime)
    {
      var block = schedule.blocks[context.blockIndex];
      var items = block.items;
      var i = context.itemIndex;

      if (items[i].playlistUri != playlistUri) {
        playlistUri = items[i].playlistUri;
        playlistMeta = null;
      }

      if (playlistUri && !playlistMeta)
        for (var j = i; (j >= 0) && (items[j].playlistUri == playlistUri) && !playlistMeta; j--)
          playlistMeta = items[j].meta.playlist;

      var startTime = 0;
      if (i == 0)
        startTime = time;

      var videoMeta = null;
      var duration = 0;
      var j = i;
      
      while ((j < items.length) && (items[j].hidden == "pre")) {
        duration += items[j].duration;
        j += 1;
      }

      if ((j < items.length) && !items[j].hidden) {
        videoMeta = items[j].meta.video;
        duration += items[j].duration;
        j += 1;
      }

      while ((j < items.length) && (items[j].hidden == "post")) {
        duration += items[j].duration;
        j += 1;
      }
      
      callback(startTime, videoMeta, playlistMeta, items[i].offset, duration);

      this.skipForward(context);

      var nextTime = this.blockStart(schedule, context.blockIndex);
      if (nextTime < time)
        break;
      else
        time = nextTime;
    }
  };
  
  var blockStart = function (schedule, blockIndex)
  {
    return schedule.startTime + schedule.blocks[blockIndex].start * 1000;
  };

  var timeUntilBlockStart = function (schedule, blockIndex)
  {
    return this.blockStart(schedule, blockIndex) - this.now();
  };

  var currentItem = function (context)
  {
    return context.schedule.blocks[context.blockIndex].items[context.itemIndex];
  };

  var nextUpItem = function (context)
  {
    var next = new ScheduleContext(context);
    this.step(next, true);
    return currentItem(next);
  };

  var liveItem = function (context)
  {
    var live = new ScheduleContext(context);
    this.sync(live);
    return currentItem(live);
  };

  // Data structure to store event listeners. Key is event name, value is an array
  // of listeners.
  var eventRegistry = {};

  // Data structure to store listeners for schedule-based events. Outer key is the
  // schedule key, inner key is event name, and value is an array of listeners.
  var scheduleEventRegistry = {};

  // Public method to register for the specified eventName. The callback is the function
  // to invoke when the event is fired, and the scope determines the value of "this"
  // within the callback function. If no scope is specified, it will default to the
  // global scope (ie, the window). You can register as many listeners as you want for
  // an event.
  var addListener = function(eventName, callback, scope)
  {
    trace("Adding listener: " + eventName + "->" + callback);

    var listeners = eventRegistry[eventName];
    if (!listeners)
      eventRegistry[eventName] = listeners = [];

    if (!scope)
      scope = window;

    listeners.push({ 'scope': scope, 'callback': callback });
  };

  var addScheduleListener = function(key, eventName, callback, scope)
  {
    trace("Adding schedule listener: " + key + ", " + eventName + "->" + callback);

    var registry = scheduleEventRegistry[key];
    if (!registry)
      scheduleEventRegistry[key] = registry = [];
      
    var listeners = registry[eventName];
    if (!listeners)
      registry[eventName] = listeners = [];

    if (!scope)
      scope = window;

    listeners.push({ 'scope': scope, 'callback': callback });
  };

  // Fire the named event. You can pass as many additional arguments as needed to this
  // function when firing an event, and they will be passed on to the callback function.
  var fireEvent = function(eventName, context)
  {
    trace("EVENT: " + eventName);

    var listeners = eventRegistry[eventName], args = [], i, listener;
    if (!listeners)
      return;

    // Grab the arguments to be passed to the callback function
    // There's a more clever way to do this, but I don't remember what it is :)
    for (i = 1; i < arguments.length; i++)
      args.push(arguments[i]);

    // Invoke each listener's callback in succession, passing along the arguments
    for (i = 0; i < listeners.length; i++) {
      listener = listeners[i];
      listener.callback.apply(listener.scope, args);
    }
  };

  var fireScheduleEvent = function(key, eventName)
  {
    trace("EVENT: " + key + ", " + eventName);

    var registry = scheduleEventRegistry[key];
    if (!registry)
      return;
    
    var listeners = registry[eventName], args = [], i, listener;
    if (!listeners)
      return;

    for (i = 2; i < arguments.length; i++)
      args.push(arguments[i]);
 
    for (i = 0; i < listeners.length; i++) {
      listener = listeners[i];
      listener.callback.apply(listener.scope, args);
    }
  };

  var setup  = function()
  {
    clock = new RemoteClock('http://schedule.mtvnservices-d.mtvi.com/api/v1/now.esi', {
      maxDriftMsec: 2000,
      updateFrequencyMsec: 1000,
      ready: function () {
        fireEvent("Ready"); 
      }
    });
  };

  var setSchedule = function(key, schedule)
  {
    schedule.key = key;
    
    if (!schedule.startTime)
      schedule.startTime = 0;

    trace("setSchedule called: " + schedule.startTime);

    schedule.apptBlocks = [];
    for (var b = 0; b < schedule.blocks.length; b++) {
      var block = schedule.blocks[b];

      if (!block.start)
        block.start = 0;

      if (block.appt)
        schedule.apptBlocks[schedule.apptBlocks.length] = b; 

      for (var i = 0; i < block.items.length; i++) {
        var item = block.items[i];

        if (!item.duration)
          item.duration = 0;

        if (!item.adDuration)
          item.adDuration = 0;
      }
    }
    
    schedules[key] = schedule;
    latestSchedules[key] = schedule;
  };
  
  var loadSchedule = function(key, url, callback)
  {
    var controller = this;
    
    Cors.get(url, {
      success: function(schedule) { 
        trace("Schedule loaded for " + key + " from " + url);
        controller.setSchedule(key, schedule);
        var context = controller.newContext(schedule);
        controller.sync(context);
        callback(context);
      },
      failure: function() { trace("Could not get schedule for " + key + " from " + url); },
      timeout: function() { trace("Schedule GET request timeout for " + key + " from " + url); },
      parseJson: true
    });
  };

  var removeSchedule = function(key)
  {
    trace("removeSchedule called: " + key);

    schedules[key] = null;
    latestSchedules[key] = null;    
    scheduleEventRegistry[key] = null;
  };
  
  return {
    'play' : play,
    'onPlayerVideoStarted' : onPlayerVideoStarted,
    'setSchedule' : setSchedule,
    'loadSchedule' : loadSchedule,
    'removeSchedule' : removeSchedule,
    'newContext' : newContext,
    'cloneContext' : cloneContext,
    'blockStart' : blockStart,
    'timeUntilBlockStart' : timeUntilBlockStart,
    'sync' : sync,
    'step' : step,
    'stepToTime' : stepToTime,
    'skipForward' : skipForward,
    'skipBackward' : skipBackward,
    'jump' : jump,
    'guide' : guide,
    'addListener' : addListener,
    'now' : now,
    'getCurrentItem' : currentItem,
    'getNextUpItem' : nextUpItem,
    'getLiveItem' : liveItem,
    'setup' : setup
  };

}());
