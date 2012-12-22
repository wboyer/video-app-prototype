var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};

VIACOM.Schedule.PlayoutController = (function () {

  var trace = VIACOM.Schedule.Util.trace;

  var Cors = VIACOM.Cors;

  var schedules = {}, latestSchedules = {}, clock = null;

  var now = function ()
  {
    var theTimeIs = clock.getCurrentTime();
    return theTimeIs;
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
    clock = new RemoteClock('http://schedule.mtvnservices.com/api/v1/now.esi', {
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
        var session = VIACOM.Schedule.PlayoutSession();
        callback(session.init(schedule, controller));
        //old
        //var context = controller.newContext(schedule);
        //controller.sync(context);
        //callback(context);
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
    'setSchedule' : setSchedule,
    'loadSchedule' : loadSchedule,
    'newScheduleFromSearchResults' : newScheduleFromSearchResults,
    'loadSearchResults' : loadSearchResults,
    'removeSchedule' : removeSchedule,
    'addListener' : addListener,
    'now' : now,
    'setup' : setup
  };

}());
