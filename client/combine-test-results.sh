#!/bin/bash
echo '<?xml version="1.0" encoding="UTF-8"?>'
echo '<testsuites>'
for f in ${1+"$@"}
do
  grep -Evh '</?testsuites|<\?xml' "${f}"
done
echo '</testsuites>'
