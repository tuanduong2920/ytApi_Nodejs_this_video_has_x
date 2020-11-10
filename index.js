var fs = require("fs");
// var readline = require("readline");
var { google } = require("googleapis");
var http = require("http");
var url = require("url");
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"];
var TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";
var TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

// Load client secrets from a local file.
fs.readFile("client_secret.json", function processClientSecrets(err, content) {
  if (err) {
    console.log("Error loading client secret file: " + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  authorize(JSON.parse(content), getVideos);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);

  http
    .createServer(function (req, res) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      var q = url.parse(req.url, true);
      var c = q.query.code;
      oauth2Client.getToken(c, (err, token) => {
        if (err) {
          console.log(err);
          return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        console.log(c);
        callback(oauth2Client);
      });

      // console.log(req.url);

      res.end("Hello World!");
    })
    .listen(8000, () => {
      console.log("listen: 8000");
    });

  //   var rl = readline.createInterface({
  //     input: process.stdin,
  //     output: process.stdout
  //   });
  //   rl.question('Enter the code from that page here: ', function(code) {
  //     rl.close();
  //     oauth2Client.getToken(code, function(err, token) {
  //       if (err) {
  //         console.log('Error while trying to retrieve access token', err);
  //         return;
  //       }
  //       oauth2Client.credentials = token;
  //       storeToken(token);
  //       callback(oauth2Client);
  //     });
  //   });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getVideos(auth) {
  var service = google.youtube("v3");
  var viewCount;
  service.videos.list(
    {
      auth: auth,
      part: "snippet,statistics",
      id: "X4SKIrkGiuw",
    },
    function (err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      var video = response.data.items;
      if (video.length == 0) {
        console.log("No video found.");
      } else {
        // console.log(
        //   "This channel's ID is %s. Its title is '%s', and " +
        //     "it has %s views.",
        //   video[0].id,
        //   video[0].snippet.title,
        //   video[0].statistics.viewCount
        // );
        viewCount = video[0].statistics.viewCount;
        console.log(viewCount);
        updateVideo(auth,service,viewCount);
      }
    }
  );
}

function updateVideo(auth,service, viewCount) {
  service.videos
    .update({
      auth:auth,
      part: ["snippet"],
      resource: {
        id: "X4SKIrkGiuw",
        snippet: {
          title: "This video has " + viewCount + " view.",
          categoryId: "22",
        },
      },
    })
    .then(
      function (response) {
        // Handle the results here (response.result has the parsed body).
        console.log("Response", response);
      },
      function (err) {
        console.error("Execute error", err);
      }
    );
}
