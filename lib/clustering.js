const {Cc, Cu, Ci, Cm} = require("chrome");
const helpers = require("helpers");
const utils = require("./utils");
let Svcs = {}
Cu.import("resource://gre/modules/Services.jsm", Svcs);
let Places = {};
Cu.import("resource://gre/modules/PlacesUtils.jsm", Places);

let J = JSON.stringify;

/*
 * Given a list of place objects, this splits them into clusters.
 */

function revHostCluster (places) {
  let result = {};
  for (let i = 0; i < places.length; i++) {
    let place = places[i];
    if (place.rev_host in result) {
      result[place.rev_host].push(place);
    } else {
      result[place.rev_host] = [place];
    }
  }
  return result;
}

function getLastKVisitsToPlace(placeId, k) {
  let result = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT * FROM moz_historyvisits WHERE place_id = :placeId ORDER BY id DESC LIMIT :k",
    "params" : {
      "placeId" : placeId,
      "k" : k,
    },
    "names" : ["id"],
  });
}

function getPlaceSession(placeId, instances) {
  let result = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT session  FROM moz_historyvisits WHERE place_id = :placeId LIMIT :k",
    "params" : {
      "placeId" : placeId,
      "k" : instances,
    },
      "names" : ["session"]
  });

  if (result.length == 0) {
    return 0; // this should really not happen unless in edge cases
  } 
  
  return result[0]["session"];
}

HID_PARENT_MEMO = {};
function getHIDParent(hid) {
  if (hid in HID_PARENT_MEMO) {
    return HID_PARENT_MEMO[hid];
  }
  let result = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT from_visit FROM moz_historyvisits WHERE id = :hid AND from_visit IS NOT NULL",
    "params": {"hid" : hid},
    "names": ["from_visit"],
  });
  if (result.length == 0) {
    return 0;
  }
  let p = result[0]["from_visit"];
  HID_PARENT_MEMO[hid] = p;
  return p;
}


function getHIDChildren(hid) {
  return utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT id FROM moz_historyvisits WHERE from_visit = :hid",
    "params" : {"hid" : hid},
    "names" : ["id"],
  }).map(function({id}) {
    return id;
  });
}

function createTreeFromRoot(hid) {
  let placeId = getPIDFromHID(hid);
  let url = getURLFromPID(placeId);
  let node = {
    "hid" : hid,
    "placeId" : placeId,
    "url" : url,
    "children" : [],
  };
  let children = getHIDChildren(hid);
  if (!children || children.length == 0) {
    return node;
  }
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    node.children.push(createTreeFromRoot(child));
  }
  return node;
}

function getPIDFromHID(hid) {
  let result = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT place_id FROM moz_historyvisits WHERE id = :hid",
    "params" : {"hid" : hid},
    "names" : ["place_id"],
  });
  if (result.length == 0) {
    return 0;
  }
  return result[0].place_id;
}


function getURLFromPID(placeId) {
  let result = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT url FROM moz_places WHERE id = :placeId",
    "params" : {"placeId" : placeId},
    "names" : ["url"],
  });
  if (result.length == 0) {
    return "";
  }
  return result[0].url;
}



function createHIDTree(hid) {
  if (hid == 0) {
    return {};
  }
  let current = hid;
  while (true) {
    current = getHIDParent(hid);
    if (current == 0) {
      break;
    } else {
      hid = current;
    }
  }
  let tree = createTreeFromRoot(hid);
  tree.all = getAllPlacesInTree(tree);
  return tree;
}

function getAllPlacesInTree (root) {
  let set = {};
  function helper(node) {
    set[node.placeId] = true;
    for (let i = 0; i < node.children.length; i++) {
      let child = node.children[i];
      helper(child);
    }
  }
  helper(root);
  return set;
}

function printHIDTree(root, tab) {
  console.log(tab + root.url);
  for (let i = 0; i < root.children.length; i++) {
    let child = root.children[i];
    printHIDTree(child, tab + "  ");
  }
}

function getPIDFromURL(url) {
  let result = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT id FROM moz_places WHERE url = :url",
    "params"  : {"url" : url},
    "names" : ["id"],
  });
  if (result.length == 0) {
    return 0;
  }
  return result[0]["id"];
}

function getLatestHID(placeId) {
  let result = utils.spinQuery(Places.PlacesUtils.history.DBConnection, {
    "query" : "SELECT id FROM moz_historyvisits WHERE place_id = :placeId ORDER BY id DESC LIMIT 1",
    "params" : {"placeId" : placeId},
    "names" : ["id"],
  });
  if (result.length == 0) {
    return 0;
  }
  return result[0]["id"];
}

function cluster(places, activeTab) {
  console.log("active tab is " + activeTab.url);
  console.log("clustering"  + J(places));
  let canonical = {};
  let doneCanonicals = [];
  let activePID = getPIDFromURL(activeTab.url);
  for (let i = 0; i < places.length; i++) {
    let place = places[i];
    let hid = getLatestHID(place.id);
    let tree = createHIDTree(hid);
    if (activePID in tree.all) {
      printHIDTree(tree, "");
    }
  }
  return {};
}

function getPlaceVisitList(placeId) {

}

function treeCluster(places) {

}

exports.cluster = cluster;
