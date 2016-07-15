// index.js
// get location of IP address

var APP_ID = undefined;

// The Alexa prototype and helper functions
var AlexaSkill = require('./AlexaSkill');
var https = require( 'https' );
var ip = require('ip');


// GetIPLocation is a child of AlexaSkill
var GetIPLocation = function() {
    AlexaSkill.call(this, APP_ID);
}

// Extend AlexaSkill
GetIPLocation.prototype = Object.create(AlexaSkill.prototype);
GetIPLocation.prototype.constructor = GetIPLocation;

// Override AlexaSkill request and intent handlers
GetIPLocation.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
                    + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

GetIPLocation.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

GetIPLocation.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
                    + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

// Override intentHandlers to map intent handling functions
GetIPLocation.prototype.intentHandlers = {
    "OneshotIPLocation": function(intent, session, response) {
        handleOneshotIPLocationRequest(intent, session, response);
    },

    "DialogIPLocation": function(intent, session, response) {
        // Determine if this turn is for city
        handleOneshotIPLocationRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
}

function handleWelcomeRequest(response) {
    var speechOutput = 'Welcome to ' + spellOut("IP") + ' locator. '
                     + 'Which ' + spellOut("IP") + ' address would you like to locate? ',
        repromptOutput = 'You will need to provide an ' + spellOut("IP") + ' address.'

    response.ask(wrapSSML(speechOutput), wrapSSML(repromptOutput));
}

function wrapSSML(text) {
    return {
        speech: '<speak>' + text + '</speak>',
        type: AlexaSkill.speechOutputType.SSML
    }
}

function spellOut(text) {
    return '<say-as interpret-as="spell-out">' + text + '</say-as>';
}

function handleHelpRequest(response) {
    var repromptText = 'What ' + spellOut("IP") + ' address would you like to locate?';
    var speechOutput = 'You will need to provide an ' + spellOut('ipv4') + 'address. '
                + 'For example, ' + spellOut("192.168.0.1") + '. '
                + repromptText

    response.ask(wrapSSML(speechOutput), wrapSSML(repromptText));
}

function handleOneshotIPLocationRequest(intent, session, response) {
    var ipaddr = getIPFromIntent(intent);
    if (ipaddr.error) {
        console.log('IPAddress invalid: ' + ipaddr.value)
        var speechOutput = spellOut("IP") + 'address provided is invalid'
        response.tell(wrapSSML(speechOutput));
    }
    getFinalLocationResponse(ipaddr.value, response);
}

function makeLocationRequest(ipaddr, cb) {
    var url = 'https://api.ip2country.info/ip?' + ipaddr;
    console.log("http_ipaddr: " + ipaddr.value);

    https.get(url, function(res) {
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            cb(new Error("Non 200 Response"));
        }

        res.on( 'data', function( data ) {
            var content = JSON.parse(data);
            // var text = 'The location of the IP is ' + content.countryName;
            // console.log(text);
            // output( text, context );
            if (content.error) {
             console.log('ip2country error: ' + content.error.message);
            } else {
                cb(null, content);
            }
        });
    }).on('error', function(err) {
        console.log("Communications error: " + err.message);
        cb(new Error(err.message));
    });
}

function getFinalLocationResponse(ipaddr, response) {
    makeLocationRequest(ipaddr, function getIPLocationResponseCallback(err, locationResponse) {
        var speechOutput;
        console.log("ipaddr: " + JSON.stringify(ipaddr));

        if (err) {
            speechOutput = "Sorry, the location cannot be found. Please try again later";
        } else {
            speechOutput = "The " + ipaddr + " address is located in " + locationResponse.countryName;
        }

        response.tellWithCard(speechOutput, "GetIPLocation", speechOutput);
    });
}

// Gets the city from the intent or returns error
function getIPFromIntent(intent) {
    var ipaddr = [intent.slots.One.value,
                  intent.slots.Two.value,
                  intent.slots.Three.value,
                  intent.slots.Four.value].join('.');
    if (ip.isV4Format(ipaddr)) {
        return {
            error: false,
            value: ipaddr
        }
    } else {
        return {
            error: true,
            value: ipaddr
        }
    }
}

exports.handler = function(event, context) {
    var getIPLocation = new GetIPLocation();
    console.log("handler.event: " + JSON.stringify(event));
    console.log("handler.context: " + JSON.stringify(context));
    getIPLocation.execute(event, context);
}
