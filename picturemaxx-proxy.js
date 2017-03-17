
var http = require("http");
var https = require("https");
var url = require("url");

function parseHeaders(str) {
  var headers = {};

  str.trim().split(/\r?\n/).forEach(function(line) {
    var split = line.split(/:(.*)/);

    headers[split[0].toLowerCase()] = split[1];
  });

  return headers;
}

function readBodyBuffer(request, callback) {
  var data = [];

  request.on("data", function(chunk) {
    data.push(chunk);
  });

  request.on("end", function() {
    callback(Buffer.concat(data));
  });
}

function fetchEmbed(embed, callback) {
  var embedUrl = embed.replace(/x-embed-url:\s*/, "").replace(/\s(.|\s)*/, "");
  var headers = parseHeaders(embed);
  var scheme = embedUrl.match(/^https:/) ? https : http;
  var parsedUrl = url.parse(embedUrl);

  request = scheme.request({ method: "GET", timeout: 30, host: parsedUrl.host, path: parsedUrl.path }, function(response) {
    readBodyBuffer(response, function(buffer) {
      var responseHeaders = [
        "content-length: " + buffer.length,
        "X-opengate-CommandID: " + headers["x-opengate-commandid"]
      ]

      if(response.headers["content-type"])
        responseHeaders.push("content-type: " + response.headers["content-type"])

      callback(Buffer.concat([Buffer(responseHeaders.join("\n") + "\n\n", "utf-8"), buffer]).toString("binary"));
    });
  });

  request.on("error", function() {
    var responseHeaders = [
      "content-length: 0",
      "content-type: application/octet-stream",
      "X-opengate-CommandID: " + headers["x-opengate-commandid"]
    ]

    callback(Buffer(responseHeaders.join("\n") + "\n\n", "utf-8").toString("binary"));
  });

  request.end();
}

function rewrite(body, callback) {
  var embeds = body.match(/x-embed-url:([^\n]|\n\r?[^\n])+[^\n]\r?\n\r?\n/g) || [];
  var responseBody = body;
  var finished = 0;

  if(embeds.length === 0)
    callback(responseBody);

  embeds.forEach(function(embed) {
    fetchEmbed(embed, function(data) {
      responseBody = responseBody.replace(embed, function() { return data; });

      finished += 1;

      if(finished === embeds.length)
        callback(responseBody);
    });
  });
}

function handleRequest(request, response) {
  readBodyBuffer(request, function(buffer) {
    var backendRequest = http.request({ timeout: 30, method: request.method, host: "127.0.0.1", port: 80, path: "/picturemaxx/index?v2=true" }, function(backendResponse) {
      readBodyBuffer(backendResponse, function(buffer) {
        rewrite(buffer.toString("binary"), function(rewrittenResponseBody) {
          if("content-length" in backendResponse.headers)
            backendResponse.headers["content-length"] = rewrittenResponseBody.length;

          response.writeHead(backendResponse.statusCode, backendResponse.headers);
          response.end(rewrittenResponseBody, "binary");
        });
      });
    });

    backendRequest.on("error", function(e) {
      response.end("HTTP/1.1 503 Service Unavailable\r\n\r\n");
    });

    backendRequest.write(buffer.toString("binary"));

    backendRequest.end();
  });
}

var server = http.createServer(handleRequest);

server.on("clientError", function(err, socket) {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(8080);

