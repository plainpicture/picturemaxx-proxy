
# Picturemaxx Proxy

This is a tiny HTTP proxy, written in nodejs, which intercepts picturemaxx
requests, searches within multipart responses for a X-Embed-Url header and
rewrites the multipart part, ie. fetches the BLOB data from the specified url
and injects it into the response.

## Motivation

The picturemaxx protocol expects binary data like e.g. image files, to be
returned in a multipart fashion, such that you can't simply respond with a URL
that points to your BLOB, but instead your app servers need to download the
BLOB from where they are stored to build the multipart response. If your BLOBs
are stored at e.g. S3, but your app servers aren't hosted at AWS this of course
introduces latency and sometimes, if your connection to S3 breaks and you don't
use a very low timeout, your app server workers are ally busy trying to fetch
the files. Contrary, if you specify a very low timeout, the users will get
errors regularly.

This proxy allows to simply respond with URLs that point to your BLOBs via a
special X-Embed-Url header within your multipart response part, and the proxy
fetches the files and injects them into the response, such that your app
servers won't be blocked.

## Usage

The proxy listens on `127.0.0.1:8080` by default, but you can edit
`config.json` to change that and to specify your picturemaxx api endpoint. To
start the proxy, simply run:

```
$ sh start.sh
```

or

```
sh start.sh ./config.json
```

Now you can remove the BLOBs from your picturemaxx responses, i.e. replace
multipart parts like:

```
...
Content-Type: image/jpeg
Content-Length: 12828
X-opengate-CommandID: image01

BLOB
...
```

with the following:

```
...
X-Embed-Url: http://url.to/my/blob
Content-Type: application/octet-stream
Content-Length: 0
X-opengate-CommandID: image01
...
```

The X-Embed-Url header should be first the header line of the multipart part,
but must at least appear before the Content-Length header line, because header
lines listed before the X-Embed-Url header are simply ignored and header lines
after the X-Embed-Url header are rewritten/removed. Moreover, your multipart
part must be empty, i.e. have `Content-Length: 0` and must be without any data
in its body.

