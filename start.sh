#!/bin/sh

nodejs picturemaxx-proxy.js 2>&1 | /usr/bin/tee -a log/picturemaxx-proxy.log

