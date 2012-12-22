var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};

VIACOM.Schedule.PlayoutSession = function () {

  var trace = VIACOM.Schedule.Util.trace;


  var controller, context;

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
      this.justPlayedPrestitial = false;
    };

    if (spec) {
      this.schedule = spec.schedule;
      this.blockIndex = spec.blockIndex;
      this.itemIndex = spec.itemIndex;
      this.offset = spec.offset;
      this.wait = spec.wait;
      this.adsEnabled = spec.adsEnabled;
      this.hasLoopedBlock = spec.hasLoopedBlock;
      this.justPlayedPrestitial = spec.justPlayedPrestitial;
    }
    else
      this.reset();
  };


  var init = function (schedule, controller) {
    this.controller = controller;
    this.context = new ScheduleContext();
    this.context.schedule = schedule;
    return this;
  };

  // private
  // Check whether to step to a new block, based on the current time.
  var stepToNewBlock = function (time)
  {
    var schedule = this.context.schedule;

    var timeOffset = time - schedule.startTime;

    var b = this.context.blockIndex;
    var i = this.context.itemIndex;

    var blocks = schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    var hasLoopedBlock = this.context.hasLoopedBlock;

    var done = false;

    while (!done)
    {
      done = true;

      // if we've reached the end of the items in a block, we've looped back
      if (i >= items.length) {
        i = 0;
        hasLoopedBlock = true;
      }

      var duration = 0;        
      var timeUntilBlockStart = 0;

      // if there's a block following this one that might need to start now
      if (b + 1 < blocks.length) {
        var nextBlock = blocks[b + 1];

        if (nextBlock.start > 0) {
          timeUntilBlockStart = nextBlock.start * 1000 - timeOffset;

          // if next block is appt block, mssl is overridden
          var mssl = nextBlock.mssl;
          if (nextBlock.appt)
            mssl = 0;

          // mssl gives us more time before the next block needs to start
          if (mssl >= 0)
            timeUntilBlockStart += mssl * 1000;
          
          // total duration = item duration + ad duration
          duration += items[i].duration + items[i].adDuration;

          // if the next item is in the same playlist and it's an auto playlist 
          // (i.e., the player handles stepping), add up the durations
          // of the items in that playlist
          for (var j = i + 1; (j < items.length) && (items[i].playlistUri == items[j].playlistUri) && items[j].auto; j++)
            duration += items[j].duration + items[j].adDuration;
        }
      }

      // If we've played the current block once, and the next block has a floating start time, OR if both the following are true:
      //  - The duration of the current item and the "auto" items following it is greater than the time until the next block starts.
      //  - We've played the current block, or that block doesn't prohibit finishing early if we haven't.
      // ...then step to the next block.
      if (((timeUntilBlockStart == 0) && hasLoopedBlock) || 
          ((timeUntilBlockStart < duration * 1000) && (hasLoopedBlock || !block.dfe)))
      {
        var saveBlockIndex = b;
        
        if (b + 1 < blocks.length)
          b += 1;
        else
          while ((b > 0) && (blocks[b].start == 0))
            b -= 1;
        
        if (b != saveBlockIndex) {
          i = 0;
          block = blocks[b];
          items = block.items;
          hasLoopedBlock = false;
          done = false;
        }
      }
    }

    this.context.wait = 0;
    this.context.offset = 0;
    this.context.adsEnabled = true;

    // disable ads after "pre" and before "post" items
    if (this.context.justPlayedPrestitial || (items[i].hidden == "post"))
      this.context.adsEnabled = false;

    // remember that we're playing a "pre" item so that later we can suppress ads before the next item
    this.context.justPlayedPrestitial = false;
    if (items[i].hidden == "pre")
      this.context.justPlayedPrestitial = true;
    
    // have we stepped to a new block?
    if (b != this.context.blockIndex)
      this.context.hasLoopedBlock = false;
    else
      if (hasLoopedBlock)
        this.context.hasLoopedBlock = true;

    // see if we need to wait for this block to start
    var timeUntilBlockStart = block.start * 1000 - timeOffset;

    var msse = block.msse * 1000;
    // if it's an appt block, we can't start early
    if (block.appt)
      msse = 0;

    // if the time until the next block is greater than msse, wait out the difference
    if ((msse >= 0) && (timeUntilBlockStart > msse)) {
      this.context.wait = timeUntilBlockStart - msse;
      i = 0;
    }
    
    this.context.blockIndex = b;
    this.context.itemIndex = i;
  };

  // Sync ScheduleContext with what is live now if possible
  var sync = function (now)
  {
    var schedule = this.context.schedule;

    if (!now)
      now = this.controller.now();
    
    this.context.reset();

    if ((schedule.blocks.length == 0) || (schedule.blocks[0].items.length == 0))
      return null;

    // set time to when the first block should start
    var time = schedule.startTime + schedule.blocks[0].start * 1000;

    while (true) {
      this.stepToNewBlock(context, time);

      // catch blocks with no duration
      if (this.context.hasLoopedBlock && (time == schedule.startTime + schedule.blocks[this.context.blockIndex].start * 1000))
        return this.context;
      
      // if we need to wait, add it
      time += this.context.wait;

      // if "live" is in the future, we're done, wait it out.
      if (time > now) {
        this.context.wait = time - now;
        return this.context;
      }
      else {
        this.context.wait = 0;

        var block = schedule.blocks[this.context.blockIndex];			

        while (true) {
          var item = block.items[this.context.itemIndex];
          var duration = (item.duration + item.adDuration) * 1000;
          var adDuration = item.adDuration * 1000;

          time += duration;

          if (time >= now) {
            if (block.dll || item.dll)
              time -= duration;
            else {
              this.context.offset = now + duration - time;
              this.context.adsEnabled = false;
              if (this.context.offset < adDuration) {
                this.context.wait = adDuration - context.offset;
                this.context.offset = adDuration;
              }
            }
            return this.context;
          }

          var i = this.context.itemIndex + 1;
          if ((i < block.items.length) && (item.playlistUri == block.items[i].playlistUri) && block.items[i].auto)
            this.context.itemIndex = i;
          else
            break;
        }
      }

      this.context.itemIndex += 1;
    }
  };

  var newContext = function (schedule)
  {
    var context = new ScheduleContext();
    context.schedule = schedule;
    return context;
  };

  var cloneContext = function (spec)
  {
    return new ScheduleContext(spec);
  };

  var step = function (playerCanStepThroughPlaylist)
  {
    trace('step');

    var i = this.context.itemIndex + 1;


    var items = this.context.schedule.blocks[this.context.blockIndex].items;

    // Skip "auto" items that the Player should have stepped to on its own.
    if (playerCanStepThroughPlaylist) {
      while ((i < items.length) && (items[this.context.itemIndex].playlistUri == items[i].playlistUri) && items[i].auto)
        i += 1;
    }
     trace('and here');


    this.context.itemIndex = i;

    this.stepToNewBlock(this.controller.now());
    
    return this.context;
  };

  var stepForward = function (playerCanStepThroughPlaylist)
  {
    trace('stepForward');
    this.step(playerCanStepThroughPlaylist);
    fireScheduleEvent(context.schedule.key, 'Step'); 
    return context;
  };

  var skipForward = function ()
  {
    //trace('skipForward');

    var b = this.context.blockIndex;
    var i = this.context.itemIndex;

    var blocks = this.context.schedule.blocks;
    var block = blocks[b];
    var items = block.items;

    if (block.appt && (this.context.wait > 0))
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

    this.jump(b, i);
    return this.context;
  };

  var skipBackward = function ()
  {
    //trace('skipBackward');

    var b = this.context.blockIndex;
    var i = this.context.itemIndex;

    var blocks = this.context.schedule.blocks;
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
    
    this.jump(b, i);
    return this.context;
  };

  var jump = function (blockIndex, itemIndex)
  {
    //trace('jump(' + blockIndex + ',' + itemIndex + ')');

    var schedule = this.context.schedule;
    var now = this.controller.now();

    block = schedule.blocks[blockIndex];

    if (blockIndex != this.context.blockIndex)
      this.context.hasLoopedBlock = false;

    this.context.wait = 0;
    this.context.offset = 0;
    this.context.adsEnabled = true;

    if (block.appt) {
      var nowOffset = now - schedule.startTime;

      if (block.start * 1000 > nowOffset) {
        this.context.wait = block.start * 1000 - nowOffset;
        itemIndex = 0;
      }
    }

    this.context.blockIndex = blockIndex;
    this.context.itemIndex = itemIndex;

    return this.context;
  };

  var seek = function (videoUri, playlistUri)
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
          // bug here; must jump(), not just return
          return true;
        else {
          matchingBlockIndex = context.blockIndex;
          matchingItemIndex = context.itemIndex;
        }
      else
        if (!videoUri)
          if (item.playlistUri == playlistUri)
            // bug here; must jump(), not just return
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
  
  var pull = function (videoUri, playlistUri)
  {
    var initialBlockIndex = context.blockIndex;
    var initialItemIndex = context.itemIndex;

    if (this.seek(context, videoUri, playlistUri) && (context.blockIndex == initialBlockIndex))
    {
      var items = context.schedule.blocks[context.blockIndex].items;
      var itemToPull = items[context.itemIndex];

      for (var i = context.itemIndex; i > 0; i--)
        items[i] = items[i-1];

      items[0] = itemToPull;

      return true;
    }

    context.blockIndex = initialBlockIndex;
    context.itemIndex = initialItemIndex;

    return false;
  };
  
  var onPlayerVideoStarted = function (uri)
  {
    trace('onPlayerVideoStarted');

    var items = this.context.schedule.blocks[this.context.blockIndex].items;

    for (var i = this.context.itemIndex; (i < items.length) && items[i].auto; i++)
      if (items[i].videoUri == uri) {
        this.context.itemIndex = i;
        break;
      }

    return context;
  };

  var play = function (player)
  {
    trace('play');

    var item = this.context.schedule.blocks[this.context.blockIndex].items[this.context.itemIndex];

    var videoUri = item.videoUri;
    var playlistUri = item.playlistUri;
    
    var duration = (item.duration + item.adDuration) * 1000;
    var adDuration = item.adDuration * 1000;

    if (playlistUri) {
      player.config(playlistUri);
      if (!videoUri || item.auto) {
        player.loadPlaylist(playlistUri);
        if (videoUri)
          player.seekToPlaylistVideo(videoUri, duration);
      }
      else
        player.loadVideo(videoUri, duration);
    }
    else {
      player.config(videoUri);
      player.loadVideo(videoUri, duration);
    }

    var adsEnabled = this.context.adsEnabled;
    
    if (adsEnabled) {
      var adUri = this.findAdUri();
      if (adUri) {
        player.setAdUri(adUri);
        player.setAdDuration(adDuration);
      }
      else
        adsEnabled = false;
    }

    player.setAdsEnabled(adsEnabled);
        
    if (this.context.offset > 0)
      player.seekToOffset(this.context.offset);

    player.play();

    return this.context;
  };

  var findAdUri = function ()
  {
    var items = this.context.schedule.blocks[this.context.blockIndex].items;
    var i = this.context.itemIndex;
    
    if ((items[i].hidden != "post") && ((i == 0) || (items[i-1].hidden != "pre")))
    {
      while ((i < items.length) && (items[i].hidden == "pre"))
        i += 1;

      if (i < items.length)
        if (!items[i].hidden)
          return items[i].videoUri;
        else
          if (items[i].hidden == "playlist")
            return items[i].playlistUri;
    }

    return null;
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

  var findPlaylistMeta = function ()
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
  
  var describe = function (callback)
  {
    context = this.cloneContext(this.context);

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

    if ((i >= 0) && !items[i].hidden && items[i].meta && items[i].meta.video) {      
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
    return this.blockStart(schedule, blockIndex) - this.controller.now();
  };

  var currentItem = function ()
  {
    return this.context.schedule.blocks[this.context.blockIndex].items[this.context.itemIndex];
  };

  var nextUpContext = function (context)
  {
    // todo -- make work with cloned session
    var next = new ScheduleContext(context);
    this.step(next, true);
    return next;
  };

  var liveContext = function (context)
  {
    //todo -- make work with cloned context
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

  
  return {
    'init' : init,
    'play' : play,
    'onPlayerVideoStarted' : onPlayerVideoStarted,
    'newContext' : newContext,
    'cloneContext' : cloneContext,
    'blockStart' : blockStart,
    'timeUntilBlockStart' : timeUntilBlockStart,
    'sync' : sync,
    'step' : step,
    'stepToNewBlock' : stepToNewBlock,
    'skipForward' : skipForward,
    'skipBackward' : skipBackward,
    'jump' : jump,
    'seek' : seek,
    'pull' : pull,
    'guide' : guide,
    'findAdUri' : findAdUri,
    'findPlaylistMeta' : findPlaylistMeta,
    'describe' : describe,
    'addListener' : addListener,
    'getCurrentItem' : currentItem,
    'getNextUpContext' : nextUpContext,
    'getLiveContext' : liveContext,
    'context' : context
  };

};
