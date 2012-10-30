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
    var theTimeIs = clock.getCurrentTime();
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
    //trace('skipForward');

    var b = context.blockIndex;
    var i = context.itemIndex;

    var blocks = context.schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    if (block.appt && (context.wait > 0))
      i = block.items.length;
    else {
      var playlistUri = items[i].playlistUri;
      
      if (items[i].hidden == "playlist")
        while ((i < items.length) && (items[i].playlistUri == playlistUri) && (items[i].hidden == "playlist"))
          i += 1;
      else {
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
    return context;
  };

  var skipBackward = function (context)
  {
    //trace('skipBackward');

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
    return context;
  };

  var jump = function (context, blockIndex, itemIndex)
  {
    //trace('jump(' + blockIndex + ',' + itemIndex + ')');

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

  var seek = function (context, videoUri, playlistUri)
  {
    var initialBlockIndex = context.blockIndex;
    var initialItemIndex = context.itemIndex;

    var matchingBlockIndex = -1;
    var matchingItemIndex = -1;

    do {
      this.skipForward(context);
      var item = this.getCurrentItem(context);

      if (videoUri && (item.videoUri == videoUri))
        if (item.playlistUri == playlistUri)
          return true;
        else {
          matchingBlockIndex = context.blockIndex;
          matchingItemIndex = context.itemIndex;
        }
      else
        if (!videoUri)
          if (item.playlistUri == playlistUri)
            return true;
    }
    while ((context.blockIndex != initialBlockIndex) || (context.itemIndex != initialItemIndex));

    if (matchingBlockIndex != -1) {
      this.jump(context, matchingBlockIndex, matchingItemIndex);
      return true;
    }
    else
      return false;
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

    var initialBlockIndex = context.blockIndex;
    var initialItemIndex = context.itemIndex;
    
    var time = this.blockStart(schedule, initialBlockIndex);

    while (time < toTime)
    {
      this.describe(context, callback);
      this.skipForward(context);

      if ((context.blockIndex == initialBlockIndex) && (context.itemIndex == initialItemIndex))
        break;
      
      time = this.blockStart(schedule, context.blockIndex);
    }
  };

  var findPlaylistMeta = function (context)
  {
    context = this.cloneContext(context);
    var initialItem = this.getCurrentItem(context);
    var item = initialItem;

    var playlistUri = item.playlistUri;

    while ((!item.meta || !item.meta.playlist) && (playlistUri == item.playlistUri)) {
      this.skipBackward(context);
      item = this.getCurrentItem(context);
      if (item == initialItem)
        break;
    }

    if (item.meta && item.meta.playlist && (playlistUri == item.playlistUri))
      return item.meta.playlist;
    else
      return null;
  };
  
  var describe = function (context, callback)
  {
    context = this.cloneContext(context);

    var blocks = context.schedule.blocks;
    
    // first skip forward
    this.skipForward(context);

    // now skip backward manually, accumulating duration and looking for metadata along the way
    var b = context.blockIndex;
    var i = context.itemIndex - 1;

    var items = blocks[b].items;
    
    if (i < 0) {
      if (b > 0)
        b -= 1;
      else
        b = blocks.length - 1;

      items = blocks[b].items
      i = items.length - 1;
    }

    var playlistUri = items[i].playlistUri;
    var duration = 0;
    var videoMeta = null;
    var playlistMeta = null;
    
    while ((i > 0) && (items[i-1].playlistUri == playlistUri) && (items[i].hidden == "playlist")) {
      duration += items[i].duration;
      i -= 1;
    }

    while ((i >= 0) && items[i].hidden == "post") {
      duration += items[i].duration;
      i -= 1;
    }

    if ((i >= 0) && items[i].meta && items[i].meta.video) {      
      duration += items[i].duration;
      videoMeta = items[i].meta.video;
    }

    while ((i > 0) && (items[i-1].hidden == "pre")) {
      i -= 1;
      duration += items[i].duration;
    }

    if (items[i].meta && items[i].meta.playlist)
      playlistMeta = items[i].meta.playlist;

    // if we didn't find playlist metadata, continue to skip backward until we find it
    if (!playlistMeta) {
      this.skipBackward(context);
      playlistMeta = this.findPlaylistMeta(context);
    }
    
    var startTime = 0;
    if (i == 0)
      startTime = this.blockStart(context.schedule, context.blockIndex);

    callback(startTime, videoMeta, playlistMeta, duration);
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

  var nextUpContext = function (context)
  {
    var next = new ScheduleContext(context);
    this.step(next, true);
    return next;
  };

  var liveContext = function (context)
  {
    var live = new ScheduleContext(context);
    this.sync(live);
    return live;
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

  var newScheduleFromSearchResults = function(results)
  {
    var schedule = {};

    var blocks = [];
    schedule.blocks = blocks;

    var block = {};
    blocks[0] = block;

    var items = [];
    block.items = items;
    
    for (var i = 0; i < results.results.length; i++) {
      var result = results.results[i];

      var item = {};
      item.meta = {};

      switch (result.type) {
        case "video":
          items[items.length] = item;
          item.meta.video = result.video;
          item.videoUri = result.video.uri;
          break;
  
        case "playlist":
          items[items.length] = item;
          item.meta.playlist = result.playlist;
          item.playlistUri = result.playlist.uri;
          break;
  
        case "episode":
          items[items.length] = item;
          item.meta.episode = result.episode;
          item.playlistUri = result.episode.uri;
          break;
      }
    }
    
    return schedule;
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

  var loadSearchResults = function(key, url, callback)
  {
    var controller = this;
    
    Cors.get(url, {
      success: function(results) { 
        trace("Results loaded for " + key + " from " + url);
        var schedule = controller.newScheduleFromSearchResults(results);
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
    'newScheduleFromSearchResults' : newScheduleFromSearchResults,
    'loadSearchResults' : loadSearchResults,
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
    'seek' : seek,
    'guide' : guide,
    'findPlaylistMeta' : findPlaylistMeta,
    'describe' : describe,
    'addListener' : addListener,
    'now' : now,
    'getCurrentItem' : currentItem,
    'getNextUpContext' : nextUpContext,
    'getLiveContext' : liveContext,
    'setup' : setup
  };

}());
