// index.js
// Get External IP

var http = require('https');
var AlexaSkill = require('./AlexaSkill');

exports.handler = "";

function getLocation( ip ) {
    var https = require( 'https' );
    var url = 'https://api.ip2country.info/ip?' + ip;
    https.get( url, function( response ) {
        response.on( 'data', function( data ) {
            content = JSON.parse(data);
            var text = 'The location of the IP is ' + content.countryName;
            // console.log(text);
            output( text, context );
        });
    });
};

function output( text, context ) {
	var response = {
		outputSpeech: {
			type: "PlainText",
			text: text
		},
		card: {
			type: "Simple",
			title: "System Data",
			content: text
		},
		shouldEndSession: true
	};
	context.succeed( { response: response } );
}

// exports.getLocation = getLocation
exports.handler = getLocation
