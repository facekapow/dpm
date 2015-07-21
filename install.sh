#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "please run as root."
  exit 1
fi

cp index.js /usr/local/bin/dpm
chmod +x /usr/local/bin/dpm