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

function getPlacePath(placeId) {

}

function cluster(places) {
  console.log("clustering"  + J(places));
  return {
    1 : places,
  }
}

function getPlaceVisitList(placeId) {

}

function treeCluster(places) {

}

exports.cluster = cluster;
