#!/bin/bash

wget --tries=3 --retry-connrefused -q http://$SELENIUM_HOST:$SELENIUM_PORT -O /dev/null

exec "$@"