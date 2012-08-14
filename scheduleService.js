// Will need to rethink how to do this. But for now
// it is just an encapsulation of the program/schedule data that
// will eventually be returned by the web service
//

var VIACOM = VIACOM || {};
VIACOM.Schedule = VIACOM.Schedule || {};


VIACOM.Schedule.Service =  ( function () {

 // var trace = VIACOM.Util.trace;


    /*
     * 
dll: don't launch late
This determines whether you'll "drop in" to something in progress.

dfe: don't finish early
This determines whether you'll leave something before it's done in order to start the next thing on time.  Trumps mssl on the subsequent block.

msse: max seconds to start early
The number of seconds we're willing to start a block early when there's not enough scheduled in the previous block.

mssl: max seconds to start late
The number of seconds we're willing to start a block late when the previous block ran over.

appt: appointment
Implies msse=0 and mssl=0, among other things.

auto
The Player will be told to play a playlist containing this item, and will thus step to it automatically.

hidden
Implies auto=true, and additionally means that the item can't be skipped to, and shouldn't be shown in the EPG.
     *
     */

  var schedule = {
    // For testing, these will be reset by the client.
    // But they will be respected once there's a real server serving them.
    startTime: 1341666000000,
    now: 1341666649762,

    blocks: [
      {
      start: 0, dll: false, dfe: false, msse: 0, mssl: 0, appt: false,
      items: [
        {duration: 180,  adDuration:  0, uri: "uri1",  playlistUri: "pl1", dll: false, auto: false, hidden: false},
        {duration: 180,  adDuration: 60, uri: "uri2",  playlistUri: "pl1", dll: false, auto: false, hidden: false},
        {duration: 60,   adDuration:  0, uri: "uri3",  playlistUri: null,  dll: true,  auto: false, hidden: false}
      ],
    },
    {
      start: 900, dll: false, dfe: false, msse: 120, mssl: 0, appt: false,
      items: [
        {duration: 270,  adDuration: 30, uri: "uri4",  playlistUri: null,  dll: false, auto: false, hidden: false},
        {duration: 180,  adDuration:  0, uri: "uri5",  playlistUri: "pl2", dll: false, auto: true,  hidden: false},
        {duration: 90,   adDuration: 30, uri: "uri6",  playlistUri: "pl2", dll: false, auto: true,  hidden: true},
        {duration: 90,   adDuration: 30, uri: "uri7",  playlistUri: "pl2", dll: false, auto: true,  hidden: true},
        {duration: 90,   adDuration: 30, uri: "uri8",  playlistUri: "pl2", dll: false, auto: true,  hidden: true},
        {duration: 90,   adDuration: 30, uri: "uri9",  playlistUri: "pl3", dll: false, auto: true,  hidden: false},
        {duration: 150,  adDuration: 30, uri: "uri10", playlistUri: "pl3", dll: false, auto: true,  hidden: false},
        {duration: 150,  adDuration: 30, uri: "uri11", playlistUri: "pl3", dll: false, auto: true,  hidden: false}
      ],
    },
    {
      start: 3600, dll: false, dfe: false, msse: 0, mssl: 0, appt: true,
      items: [
        {duration: 30,   adDuration: 30, uri: "uri12", playlistUri: null,  dll: false, auto: false, hidden: false},
        {duration: 210,  adDuration: 30, uri: "uri13", playlistUri: null,  dll: false, auto: false, hidden: false},
        {duration: 270,  adDuration: 30, uri: "uri14", playlistUri: null,  dll: false, auto: false, hidden: false}
      ],
    }
    ],

    // This will be computed on the client.
    apptBlocks: null
  }; 

  schedule.apptBlocks = [];

  for (var b = 0; b < schedule.blocks.length; b++) {
    if (schedule.blocks[b].appt) {
      //VIACOM.Schedule.Util.trace(schedule.apptBlocks.length + "->" + b);
      schedule.apptBlocks[schedule.apptBlocks.length] = b; 
    }
  }

  var getSchedule = function () {
    //trace('getSchedule');

    // Just for testing, compute our own current time,
    // and slide the test program forward to be closer to now.
    var now = new Date().getTime();
    while (schedule.startTime + 3600000 < now) {
      schedule.startTime += 3600000;
    }


    return schedule;
  };

  return {
    'getSchedule' : getSchedule
  };


}());




