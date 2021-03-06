var fs = require("fs-extra");
var chance = require("chance").Chance();

const quotesFilePath = "./quotes.json";

module.exports = {
    add: function (_clientInfo, parameters) {
        var quotesObject = getQuotesFromFile();
        var quoteString = parameters.trim();
        if (quoteString === "")
            return;
        quotesObject.push(parameters);
        _clientInfo.client.say(_clientInfo.channel, "Quote #" + quotesObject.length + " added.");
        writeQuotesToFile(quotesObject);
    },
    getRandom: function (_clientInfo, parameters) {
        var quotesObject = getQuotesFromFile();
        if (!quotesObject || quotesObject.length === 0)
            return;

        var requestedIndex = parseInt(parameters);
        var index = chance.integer({ min: 0, max: quotesObject.length - 1 });
        if (!isNaN(requestedIndex) && requestedIndex <= quotesObject.length && requestedIndex > 0)
            index = requestedIndex - 1;
        var quote = quotesObject[index];
        var result = "(" + (index + 1) + "/" + quotesObject.length + "): " + quote;
        _clientInfo.client.say(_clientInfo.channel, result);
    },
    remove: function (_clientInfo, parameters) {
        var quotesObject = getQuotesFromFile();
        if (!quotesObject || quotesObject.length === 0)
            return;
        var requestedIndex = parseInt(parameters) - 1;
        if (isNaN(requestedIndex) || requestedIndex > quotesObject.length || requestedIndex < 0)
            return;
        quotesObject.splice(requestedIndex, 1);
        _clientInfo.client.say(_clientInfo.userName, "quote #" + (requestedIndex + 1) + " removed!");
        writeQuotesToFile(quotesObject);
    }
};

function getQuotesFromFile() {
    try {
        return fs.readJsonSync(quotesFilePath);
    }
    catch (e) {
        return [];
    }
}
function writeQuotesToFile(quotesObject) {
    try {
        fs.writeJsonSync(quotesFilePath, quotesObject);
    }
    catch (e) {
        console.log("error writing quotes to file: " + e);
    }
};