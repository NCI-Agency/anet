#!/bin/bash

echo waiting for MS SQL to start
for i in {60..0}; do
  if /opt/mssql-tools/bin/sqlcmd -d "$DB_NAME" -U "$DB_USER" -P "$DB_USER_PASSWORD" -Q 'SELECT 1;' &> /dev/null; then
    break
  fi
  echo .
  sleep 1
done