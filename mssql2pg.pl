#!/usr/bin/perl -p

# Comment out the MSSQL SET command
s/^(?=SET)/-- /;
# Eliminate the weird "[key]" column naming
s/\[key\]/key/g;
# Quote mixed-case column and table names
s/(?<!")([a-z]\w+[A-Z]\w+)/"$1"/g;
# Turn a couple very specific 1/0 booleans into true/false booleans
# This one is for "isPrimary" in "reportPeople"
s/(?<=\Q(SELECT max(id) FROM reports), \E)([10])/$1 ? 'TRUE' : 'FALSE'/ie;
# This one is for "deleted" in "positionRelationships"
s/(?<=CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, )([10])(?=\s*\))/$1 ? 'TRUE' : 'FALSE'/e;
if (/^INSERT INTO positions.* authorized/) { # very very specific
    s/([10])(?=\s*,\s*NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP\))/$1 ? 'TRUE' : 'FALSE'/e;
}
# standard date-time math would be so nice...
s/DATEADD\s*\(day,\s*-(\d+),\s*CURRENT_TIMESTAMP\)/CURRENT_TIMESTAMP - INTERVAL '$1 DAYS'/g;