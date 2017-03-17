#!/bin/sh

nodejs picturemaxx-proxy.js $1 2>&1 | /usr/bin/tee -a log/picturemaxx-proxy.log

