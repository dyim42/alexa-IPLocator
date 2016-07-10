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
    var whichCityPrompt = "Which eye pee address would you like to locate?",
        speechOutput = {
            speech: "<speak>Welcome to IP Locator.</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "You will need to provide an eye pee address.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleHelpRequest(response) {
    var repromptText = "What I P address would you like to locate?";
    var speechOutput = "You will need to provide an I P V 4 address"
        + " for example, 192 dot 168 dot 0 dot 1. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}

function handleOneshotIPLocationRequest(intent, session, response) {

    var ipaddr = getIPFromIntent(intent);
    if (ipaddr.error) {
        console.log('IPAddress invalid: ' + ipaddr.value)
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
            speechOutput = "The " + ipaddr + " is located in " + locationResponse.countryName;
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
    getIPLocation.execute(event, context);
}
