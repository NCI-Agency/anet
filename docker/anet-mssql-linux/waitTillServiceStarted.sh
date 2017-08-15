#!/bin/bash

for i in {30..0}; do
  if sqlcmd -U SA -P "$SA_PASSWORD" -Q 'SELECT 1;' &> /dev/null; then
    break
  fi
  sleep 1
done