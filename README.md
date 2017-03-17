
# Picturemaxx Proxy

This is a tiny proxy, which intercepts picturemaxx multipart responses,
searches for a x-embed-url header, rewrites the multipart part, ie. fetches
and injects the data from the specified url. The x-embed-url should be first
header line of the multipart part, but must be at least appear before the
content-length header.

# Why?

The picturemaxx protocol expects binary data, ie. image files, to be returned
in a multipart fashion, such that a typical app server needs to fetch the image
file from eg. S3. Thus, you can't simply return a URL and the picturemaxx
clients fetch the files on their own. Now, if your app servers aren't hosted at
AWS this of course introduces latency and sometimes, if your connection to S3
breaks, your app server workers are ally busy trying to fetch the files unless
you specify a very low timeout. If you specify a very low timeout, the users
will get errors regularly. Thus, this proxy somewhat simulates a client,
fetches the files and injects them into the response and nodejs is perfectly
suited for this job.

