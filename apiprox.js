/*
* HEPIC API Bridge
* (c) QXIP BV
* http://qxip.net
*
* See LICENSE for license details.
*/ 

var version = '0.0.1';
var debug = false;

var express = require('express');  
var request = require('request');
var jar = request.jar();
var homercookie = request.cookie("PCAPTURESESSION="+Math.random().toString(36).slice(2)+";path=/");

/********************** 
	OPTIONS 
**********************/

var _config_ = require("./config");
if(process.argv.indexOf("-c") != -1){
    _config_ = require(process.argv[process.argv.indexOf("-c") + 1]);
}

if(process.argv.indexOf("-d") != -1){
    debug = true; // set debug ON
}

var apiUrl = _config_.apiUrl;
var apiSess = _config_.apiSess;
var apiUser = _config_.apiUser;
var apiPass = _config_.apiPass;
var timeOut = _config_.timeOut ? _config_.timeOut : 120 ;

jar.setCookie(homercookie, apiSess, function(error, cookie) {});

/********************** 
	FUNCTIONS 
**********************/

var getAuth = function(){

    var auth = JSON.stringify({ "username": apiUser, "password": apiPass, "auth_type": "local" });
    if (debug) console.log(auth);
    request({
	  uri: apiSess,
	  method: "POST",
	  form: auth,
	  jar: jar
	}, function(error, response, body) {
          if (!body) {
		console.log('API Error connecting to '+apiUrl);
		console.log('Exiting...',error); 
		process.exit(1);
	  } else {
		if (debug) console.log(body);
		if (response.statusCode == 200){
			var status = JSON.parse(body).auth;
			if (!status || status != true ){
				  console.log('API Auth Failure!', status); process.exit(1);
			}
		}
	  }
    });

    return;

}

/**********************
	AUTH
**********************/

getAuth();
setInterval(function() {
    getAuth();
}, timeOut*1000 );


/**********************
	RUN
**********************/

var app = express();  
app.use('/', function(req, res) {  
  var url = apiUrl + req.url.substring(1);
  req.pipe(
     request({
          uri: url,
          jar: jar
        }, function(error, response, body) {
          if (!body || error) {
                console.log('API Error connecting to '+apiUrl);
          }
     })
  ).pipe(res);
});

app.listen(_config_.proxyPort, _config_.proxyHost, function() {
  console.log("Proxy listening on %s:%d", _config_.proxyHost,_config_.proxyPort);
});
