#!/bin/bash

for i in {60..0}; do
  if /opt/mssql-tools/bin/sqlcmd -U SA -P "$SA_PASSWORD" -Q 'SELECT 1;' &> /dev/null; then
    break
  fi
  sleep 1
done