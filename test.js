function init()
{
  App.init();

  var scheduleDiv = document.getElementById("schedule");
  var playerDiv = document.getElementById("player");
  var videoDiv = document.getElementById("video");

  initOverlayAllowedRegion("overlay0", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);
  initOverlayAllowedRegion("overlay1", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);
  initOverlayAllowedRegion("overlay21", videoDiv.offsetLeft, videoDiv.offsetTop, videoDiv.offsetLeft + videoDiv.clientWidth + 2, videoDiv.offsetTop + videoDiv.clientHeight + 2);
  initOverlayAllowedRegion("overlay22", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);
  initOverlayAllowedRegion("overlay3", 0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2 + 40);

  window.setInterval(function () {
    playerDiv = document.getElementById("player");
    videoDiv = document.getElementById("video");

    if (App.activeScheduleContext) {
      var controller = App.scheduleController;      
      var activeSession = App.activeSession;
      
      var now = controller.now();

      var context = App.activeScheduleContext;

      var liveSession = App.liveSession;

      var liveContext = liveSession.context;
      liveSession.sync();
      var item =  liveSession.getCurrentItem();
      
      UI.markScheduleOffset(scheduleDiv, "t_m_s", "marker_sync", liveContext.blockIndex, liveContext.itemIndex, (item.duration + item.adDuration) * 1000, liveContext.offset);

      item = activeSession.getCurrentItem();
      UI.markScheduleOffset(scheduleDiv, "t_m_c", "marker_current", context.blockIndex, context.itemIndex, (item.duration + item.adDuration) * 1000, App.player.offset);

      App.player.onInterval(now);
      UI.updatePlayer(App.player, videoDiv);

      App.onInterval(now);
      UI.displayOnAirNow(App, document.getElementById("onAirNow"));
      UI.displayOnAirNext(App, document.getElementById("onAirNext"));
      UI.displayWait(App, document.getElementById("wait"));
      UI.displayNextUp(App, document.getElementById("nextUp"));
      UI.displayNextAppt(App, document.getElementById("nextAppt"), now);
    }

    var overlays = [];
    overlays[overlays.length] = createOverlay("overlay0");
    overlays[overlays.length] = createOverlay("overlay1");
    overlays[overlays.length] = createOverlay("overlay2");
    overlays[overlays.length] = createOverlay("overlay3");

    var overlayGroups = [];
    overlayGroups[0] = overlays;

    var region = Object.create(Region);
    region.construct(0, 0, playerDiv.clientWidth + 2, playerDiv.clientHeight + 2);			
    var arrangement = Arrangement.findBest(overlayGroups, region);
    UI.displayOverlays(playerDiv, overlayGroups, arrangement, "overlay");
    
    //console.debug(new Date().getTime() - now);
  },
  300);
}

function initOverlayAllowedRegion(id, left, top, right, bottom)
{
  document.getElementById(id + "left").value = left;
  document.getElementById(id + "top").value = top;
  document.getElementById(id + "right").value = right;
  document.getElementById(id + "bottom").value = bottom;
};

function createOverlay(id)
{
  overlay = Object.create(Overlay);
  overlay.id = id;
  overlay.enabled = document.getElementById(id + "enabled").checked;
  overlay.width = +document.getElementById(id + "width").value;
  overlay.height = +document.getElementById(id + "height").value;
  overlay.color = document.getElementById(id + "color").value;
  overlay.canBeCovered = document.getElementById(id + "covered").checked;
  document.getElementById(id + "color").style["border"] = "1px solid " + overlay.color;

  if (id == "overlay2")
    id = "overlay21";

  addOverlayAllowedRegion(overlay, id);			

  if (id == "overlay21") {
    id = "overlay22";
    addOverlayAllowedRegion(overlay, id);			
  }

  return overlay;
}

function addOverlayAllowedRegion(overlay, id)
{
  var region = Object.create(Region);
  region.construct(+document.getElementById(id + "left").value, +document.getElementById(id + "top").value, +document.getElementById(id + "right").value, +document.getElementById(id + "bottom").value, document.getElementById(id + "axis").value, +document.getElementById(id + "bias").value);			
  overlay.addAllowedRegion(region);
}

function slideSchedule(offset)
{
  App.activeScheduleContext.schedule.startTime += offset;

  UI.displaySchedule(App, document.getElementById("schedule"));
  UI.displayGuide(App, document.getElementById("guide"));

  App.onAirNowStart = 0;
}

function loadLocalSchedule(path)
{
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = path;
  var body = document.getElementsByTagName("body")[0];
  body.appendChild(script);
}

function setLocalSchedule(schedule)
{
  var controller = App.scheduleController;      

  while (schedule.startTime + 3600000 < controller.now())
    schedule.startTime += 3600000;
  
  controller.setSchedule("local", schedule);

   var session =  VIACOM.Schedule.PlayoutSession();
   session.init(schedule, controller);


  //var context = controller.newContext(schedule);
  session.sync(context);

  App.playSchedule(session.context, App.player);

  slideSchedule(0);
}

function setLocalSearchResults(results)
{
  var controller = App.scheduleController;      

  setLocalSchedule(controller.newScheduleFromSearchResults(results));
}
