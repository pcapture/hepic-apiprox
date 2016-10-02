/*
* PCAPTURE API Bridge
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

    var auth = JSON.stringify({ "username": apiUser, "password": apiPass });
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
			var status = JSON.parse(body).status;
			if (status == "ok" ){
				 if (debug) console.log('API Auth OK');
			} else { console.log('API Auth Failure!', status); process.exit(1); }
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
  var url = apiUrl.slice(0, -1) + req.url;
  console.log(url);
  request({
          uri: url,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          form: req.args,
          jar: jar
        }, function(error, response, body) {
          if (!body) {
                console.log('API Error connecting to '+apiUrl);
                console.log('Exiting...');
                process.exit(1);
          } else {
                if (debug) console.log(body);
                if (JSON.parse(body).status == 200){
                         if (debug) console.log('API Auth OK');
			 req.pipe(body);
                } else { console.log('API Auth Failure!'); return; }
          }
    });

  req.pipe(request( { uri: url, jar: jar } )).pipe(res);
});

app.listen(process.env.PORT || 8822);
