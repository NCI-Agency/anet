#!/bin/bash

echo -n Waiting for MS SQL to start
for i in {60..0}; do
  if /opt/mssql-tools/bin/sqlcmd -d "$DB_NAME" -U "$DB_USER" -P "$DB_USER_PASSWORD" -Q 'SELECT 1;' &> /dev/null; then
    echo done
    break
  fi
  echo -n .
  sleep 1
done
