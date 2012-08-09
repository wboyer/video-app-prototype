/**
 * A RemoteClock keeps track of the local time on a remote server. It does this
 * by initializing itself with the current time on the server and periodically
 * updating its "local copy" of the time. The frequency of this update is
 * configurable. Each update will increment the local copy of the time by the
 * frequency value. Since these updates may not happen at precisely the specified
 * frequency (due to system load, going to sleep), it will keep track of how much
 * "drift" in time has been accumulated. If a configurable maximum drift is
 * exceeded, it will re-sync with the remote server.
 *
 * The constructor requires the URL of the remote clock and accepts a number of
 * additional options:
 * initialTimeUTC:      The initial time of the remote clock. If not specified, it will
 *                      get its initial time from the remote server.
 * maxDriftMsec:        The maximum number of milliseconds of drift permitted before the
 *                      clock must re-sync with the remote server. Default is 2000.
 * updateFrequencyMsec: How often to update the local time (msec). Default is 1000.
 *
 * TODO: What if the sync() operation fails?
 */
var RemoteClock = function(remoteClockUrl, options) {
  var initialTimeUTC = options['initialTimeUTC'] ? options.initialTimeUTC : 0;  
  var maxDriftMsec = options['maxDriftMsec'] ? options.maxDriftMsec : 2000;
  var updateFrequencyMsec = options['updateFrequencyMsec'] ? options.updateFrequencyMsec : 1000;
  var totalDriftMsec = 0;
  var currentTimeUTC = initialTimeUTC;
  var lastUpdateTimeUTC = new Date().getTime();
  var updateIntervalId = 0;
  var Cors = VIACOM.Cors;

  // Starts the clock update "thread" (for lack of a better term) at the specified
  // update frequency.
  var start = function() {
    updateIntervalId = window.setInterval(updateCurrentTime, updateFrequencyMsec);
  };
  
  // Stops the clock update thread.
  var stop = function() {
    if (updateIntervalId > 0) {
      window.clearInterval(updateIntervalId);
      updateIntervalId = 0;
    }
  };
  
  // Synchronizes the clock's local time with the time on the remote server.
  // Invokes the specified callback after the sync is done.
  var sync = function(callback) {
    Cors.get(remoteClockUrl, {
      success: function(responseText) {
        setCurrentTime(parseInt(responseText));
        totalDriftMsec = 0;
        callback();
      }
    });
  };
  
  var setCurrentTime = function(timeUTC) {
    currentTimeUTC = timeUTC;
    lastUpdateTimeUTC = new Date().getTime();
  };
  
  // Update our local copy of the time. This function is invoked at the specified
  // updateFrequencyMsec. Here, we calculate how much "drift" we have accumulated
  // and re-sync with the remote server if we've exceeded the max.  
  var updateCurrentTime = function() {
    var now = new Date().getTime();
    totalDriftMsec += (now - lastUpdateTimeUTC - updateFrequencyMsec);
    if (totalDriftMsec > maxDriftMsec) {
      stop();
      sync(start);
    }
    else {
      setCurrentTime(currentTimeUTC + updateFrequencyMsec);
    }
  };

  // Public function to get the current time.
  this.getCurrentTime = function() {
    return currentTimeUTC;
  };

  // If no initial time was specified, get it from the remote server.  
  if (initialTimeUTC == 0) {
    sync(start);
  }
  else {
    start();
  }
}
