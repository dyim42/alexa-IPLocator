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
                + 'For example, ' + spellOut("8.8.8.8") + '. '
                + repromptText

    response.ask(wrapSSML(speechOutput), wrapSSML(repromptText));
}

function handleOneshotIPLocationRequest(intent, session, response) {
    var repromptText = 'What ' + spellOut("IP") + ' address would you like to locate?';
    var ipaddr = getIPFromIntent(intent);
    if (ipaddr.error.value) {
        var speechOutput = ipaddr.error.message + repromptText;
        response.ask(wrapSSML(speechOutput), wrapSSML(repromptText));
    } else  {
        getFinalLocationResponse(ipaddr.value, response);
    }
}

function makeLocationRequest(ipaddr, callback) {
    var url = 'https://api.ip2country.info/ip?' + ipaddr;
    console.log("makeLocationRequest.url: " + url);

    https.get(url, function(res) {
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            callback(new Error("Non 200 Response"));
        }

        res.on( 'data', function( data ) {
            var content = JSON.parse(data);

            if (content.error) {
                console.log('ip2country error: ' + content.error.message);

            } else {
                callback(null, content);
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

        if (err || !locationResponse.countryName) {
            speechOutput = "Sorry, the location cannot be found. Please try again later";
        } else {
            speechOutput = "The " + ipaddr + " address is located in " + locationResponse.countryName;
        }

        response.tellWithCard(speechOutput, "GetIPLocation", speechOutput);
    });
}

// Gets the city from the intent or returns error
function getIPFromIntent(intent) {
    // Extracts IP address from intent and returns IP address and errors if any
    var ipaddr = [intent.slots.One.value,
                  intent.slots.Two.value,
                  intent.slots.Three.value,
                  intent.slots.Four.value].join('.');
    result = {
        error: {
            value: false,
            message: ""
        },
        value: ipaddr
    };

    if (ip.isV4Format(ipaddr)) {
        // pass, default values are OK
    } else {
        console.log('IPAddress invalid: ' + ipaddr.value);
        result.error.value = true;
        result.error.message =  spellOut("IP") + " address is not valid. ";

        // Return early if failed basic IP address check
        return result;
    }

    // Check if ipaddr is private. Modify results if isPrivate
    if (ip.isPrivate(ipaddr)) {
        console.log('IPAddress is private: ' + ipaddr.value);
        result.error.value = true;
        result.error.message = spellOut("IP") + " address is private. ";
    }

    return result;
}

exports.handler = function(event, context) {
    var getIPLocation = new GetIPLocation();
    console.log("handler.event: " + JSON.stringify(event));
    console.log("handler.context: " + JSON.stringify(context));
    getIPLocation.execute(event, context);
}
