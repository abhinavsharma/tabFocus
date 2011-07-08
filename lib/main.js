const self = require("self");
const tabs = require("tabs");
const pageMod = require("page-mod");
const {Hotkey} = require("hotkeys");
const {Cc, Cu, Ci, Cm} = require("chrome");
const widgets = require("widget");


const helpers = require("helpers");
const utils = require("./utils");
const clustering = require("./clustering")

let Svcs = {}
Cu.import("resource://gre/modules/Services.jsm", Svcs);
let Places = {};
Cu.import("resource://gre/modules/PlacesUtils.jsm", Places);

function getPlaceInformation(url) {
  let results = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query": "SELECT id, url, title, rev_host FROM moz_places WHERE url = :url",
    "params": {"url" : url},
    "names": ["id", "url", "title"],
  });
  
  if (results.length == 0) {
    return null;
  }

  return results[0];
}

function getVisiblePlaces() {
  let gBrowser = Svcs.Services.wm.getMostRecentWindow("navigator:browser").gBrowser;
  let visibleTabs = gBrowser.visibleTabs;
  let uris = [];
  for (let i = 0; i < visibleTabs.length; i++) {
    let tab = visibleTabs[i];
    let uri = gBrowser.getBrowserForTab(tab).currentURI.spec;
    uris.push(getPlaceInformation(uri));
  }
  return uris;
}

clusters = {};
function recall() {
  clusters = clustering.cluster(getVisiblePlaces());
  let tab = tabs.open({
    "url" : self.data.url("dashboard.html"),
  });
}

widgets.Widget({
  id: "recall-monkey-launcher",
  label: "Launch Recall Monkey",
  contentURL: self.data.url("img/monkey.png"),
  onClick: function() {
    recall();
  }
});

let mod = pageMod.PageMod({
  include: "resource://taborganizer-at-prospector-dot-labs-dot-mozilla-taborganizer-data/*",
  contentScriptFile: self.data.url("monkey.js"),
  onAttach: function attached(worker) {
    worker.postMessage({
      "clusters" : clusters,
    });
    worker.on("message", function(data) {
      console.log("message from data");
    });
  }
});

var showHotKey = Hotkey({
  combo: "accel-shift-m",
  onPress: function() {
    recall();
  }
});
//let tab = tabs.open(self.data.url("dashboard.html"));
