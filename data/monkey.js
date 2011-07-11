const reportError = console.log
let $ = document.getElementById
let C = document.createElement;
let J = JSON.stringify;

self.on("message", function(data) {
  //console.log(J(data.clusters));
  let allClusters = $('all-clusters');
  for (let idx in data.clusters) {
    let clusterElem = C('ul');
    clusterElem.setAttribute('id', 'cluster-' + idx);
    allClusters.appendChild(clusterElem);
    data.clusters[idx].forEach(function ({id, title, url, rev_host, session}) {
      let el = C('li');
      el.innerHTML = title + " | " + session;
      clusterElem.appendChild(el);
    })
  }
});

