const {Cu, Cm, Cc, Ci} = require("chrome");

function Utils() {
  let me = this;
  me.faviconSvc = Cc["@mozilla.org/browser/favicon-service;1"]
                  .getService(Ci.nsIFaviconService);
  me.ios = Cc["@mozilla.org/network/io-service;1"]
           .getService(Ci.nsIIOService);
  me.bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
             .getService(Ci.nsINavBookmarksService);
  me.FAVICON_CACHE = {};
  /* some useful regular expressions */
  me.re_tokenize = new RegExp(/[\s]/);
  me.re_hostname = new RegExp(/s/);
}

Utils.prototype.getFaviconData = function(url) {
  let me = this;
  try {
    let wrappedURL = me.ios.newURI(url, null, null);
    let faviconURL = me.faviconSvc.getFaviconForPage(wrappedURL);
    let dataURL = me.faviconSvc.getFaviconDataAsDataURL(faviconURL);
    return dataURL;
  } catch (ex) {
    return null;
  }
}

Utils.prototype.isBookmarked = function(url) {
  let me = this;
  try {
    let wrappedURL = me.ios.newURI(url, null, null);
    return me.bmsvc.isBookmarked(wrappedURL);
  } catch (ex) {
    reportError(ex);
    return false;
  }
}

exports.help = Utils;

function lcs(x,y){
	var s,i,j,m,n,
		lcs=[],row=[],c=[],
		left,diag,latch;
	//make sure shorter string is the column string
	if(m<n){s=x;x=y;y=s;}
	m = x.length;
	n = y.length;
	//build the c-table
	for(j=0;j<n;row[j++]=0);
	for(i=0;i<m;i++){
		c[i] = row = row.slice();
		for(diag=0,j=0;j<n;j++,diag=latch){
			latch=row[j];
			if(x[i] == y[j]){row[j] = diag+1;}
			else{
				left = row[j-1]||0;
				if(left>row[j]){row[j] = left;}
			}
		}
	}
	i--,j--;
	//row[j] now contains the length of the lcs
	//recover the lcs from the table
	while(i>-1&&j>-1){
		switch(c[i][j]){
			default: j--;
				lcs.unshift(x[i]);
			case (i&&c[i-1][j]): i--;
				continue;
			case (j&&c[i][j-1]): j--;
		}
	}
	return lcs.join('');
}

exports.lcs = lcs;

