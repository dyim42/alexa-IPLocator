# Alexa Skill to lookup IP address location #



## Examples
Example user interactions:

### One-shot model:
    User:  "Alexa, ask IP Locator 93.210.15.68"
    Alexa: "The 93.210.15.68 is located in Germany"

### Dialog model:
    User:  "Alexa, open IP Locator"
    Alexa: "Which IP address would you like to locate?"
    User:  "201.83.41.11"
    Alexa: "The 201.83.41.11 is located in Brazil"


## Known Issues ##
Naturally you would use the word "dot" or "point" when reading an IP address
out loud. You would also space delimit the IP address octets but because of how
Alexa registers slots and numbers, I have not been able to figure out how to
"space" delimit groupings of numbers. I suppose something like street addresses
would work because of switching between AMAZON.NUMBER and AMAZON.STRING slot
types. 
