#!/bin/bash

jshint src/*.js
rm -f getIPLocation.zip
pushd src
zip -r ../getIPLocation.zip index.js AlexaSkill.js node_modules/
popd 
