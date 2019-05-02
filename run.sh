#!/bin/bash
cd "${0%/*}"
node pull.js -7d now "*" -v
node merge.js
