const util = require("util");
const request = require("request");
const requestPostP = util.promisify(request.post);
const URL = require("url-parse");

var _clientInfo = undefined;
var _clientID = undefined;
var _clientSecret = undefined;
var _auth = undefined;

module.exports = {
    initCredentials,
    handleTwitchUrl
}

function initCredentials (options) {
    if (!options.twitchClientID || !options.twitchClientSecret)
        console.log("Twitch API: missing credentials in settings.")
    _clientID = options.twitchClientID;
    _clientSecret = options.twitchClientSecret;
}

function handleTwitchUrl(clientInfo, url) {
    _clientInfo = clientInfo;
    var urlObject = new URL(url);
    var path = urlObject.pathname.split("/")[1];
    if (!path || path === "")
        return false;

    switch (urlObject.hostname) {
        case "go.twitch.tv":
        case "twitch.tv":
            sendRequest("https://api.twitch.tv/helix/streams?user_login=" + path, onStreamsResponse);
            return true;
        case "clips.twitch.tv":
            sendRequest("https://api.twitch.tv/helix/clips?id=" + path, onClipsResponse);
            return true;
        default:
            return false;
    }
}

function sendRequest(url, callback) {
    request({
        url: url,
        headers: getRequestHeaders()
    }, callback);
}

function getRequestHeaders() {
    return {
        "Authorization": _auth,
        "Client-ID": _clientID
	}
}

function onStreamsResponse(error, response, body) {
    try {
        var json = JSON.parse(body);
        if (json.error)
            handleResponseError(response, json, onStreamsResponse);
        else if (json.data.length > 0) {
            var stream = json.data[0];
            var message = stream.title + " [" + stream.viewer_count + "]";
            postMessageWithGameCategory(stream.game_id, message);
        }
    }
    catch (e) {

    }
}

function onClipsResponse(error, response, body) {
    try {
        var json = JSON.parse(body);
        if (json.error)
            handleResponseError(response, json, onClipsResponse);            
        else if (json.data.length > 0) {
            var clipInfo = json.data[0];
            var message = clipInfo.broadcaster_name + ": " + clipInfo.title + " [" + clipInfo.view_count + "]";
            postMessageWithGameCategory(clipInfo.game_id, message);
        }
    }
    catch (e) {

    }    
}

function postMessageWithGameCategory(game_id, message) {
    sendRequest("https://api.twitch.tv/helix/games?id=" + game_id, (error, response, body) => {
		if (!error) {
			try {
				var json = JSON.parse(body);
				if (json.data.length > 0)
					message += " [" + json.data[0].name + "]";
				_clientInfo.client.say(_clientInfo.channel, message);
			}
			catch (e) {

			}
		}
	});
}

function handleResponseError(response, bodyAsJson, callback) {
    console.log("Twitch API - request failed: " + bodyAsJson.message);
    if (bodyAsJson.status === 401) // Unauthorized - request a new access token and resend the original request
        requestAccessToken().then(() => sendRequest(response.request.href, callback)).catch((error) => console.log(error));
}

function requestAccessToken() {
    return requestPostP({
        url: "https://id.twitch.tv/oauth2/token?client_id=" + _clientID,
        form: {client_secret: _clientSecret, grant_type: "client_credentials"},
        headers: {"content-type": "application/json"}
    }).then((response, body) => setAccessToken(response, body));
}

function setAccessToken(response, body) {
    var json = JSON.parse(response.body);
    if (response.statusCode !== 200)
        throw "Twitch API - failed to set access token: " + json.message;
    _auth = "Bearer " + json.access_token;
}