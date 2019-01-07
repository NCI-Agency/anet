#!/usr/bin/perl -p

# Change variable setting to psql syntax
s/^SET \@reportUuid = lower\(newid\(\)\);/SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \\gset/;
s/\@reportUuid/:reportuuid/;
#
s/^SET \@approvalStepUuid = lower\(newid\(\)\);/SELECT ('''' || uuid_generate_v4() || '''') AS approvalStepUuid \\gset/;
s/\@approvalStepUuid/:approvalStepUuid/;
#
s/^SET \@authorUuid = \(SELECT uuid ([^;]*)\);/SELECT ('''' || uuid || '''') AS authorUuid $1 \\gset/;
s/\@authorUuid/:authorUuid/;
#
s/^SET \@noteUuid = lower\(newid\(\)\);/SELECT ('''' || uuid_generate_v4() || '''') AS noteUuid \\gset/;
s/\@noteUuid/:noteUuid/;
# Comment out the other MSSQL SET/DECLARE commands
s/^(?=(SET|DECLARE))/-- /;
# Eliminate the weird "[key]" column naming
s/\[key\]/key/g;
# Quote mixed-case column and table names
s/(?<![":])\b([a-z]\w+[A-Z]\w+)/"$1"/g;
# Turn a couple very specific 1/0 booleans into true/false booleans
# This one is for "isPrimary" in "reportPeople"
s/(?<=\Q:reportuuid, \E)([10])/$1 ? 'TRUE' : 'FALSE'/ie;
# This one is for "deleted" in "positionRelationships"
s/(?<=CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, )([10])(?=\s*\))/$1 ? 'TRUE' : 'FALSE'/e;
if (/^INSERT INTO positions.* authorized/) { # very very specific
    s/([10])(?=\s*,\s*NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP\))/$1 ? 'TRUE' : 'FALSE'/e;
}
# This one is for populating report authorization groups
s/(?<=rp.\"isPrimary\")\s+=\s+([10])/"= " . ($1 ? 'TRUE' : 'FALSE')/e;
# standard date-time math would be so nice...
s/DATEADD\s*\(([^,]*),\s*(-?\d+),\s*CURRENT_TIMESTAMP\)/CURRENT_TIMESTAMP + INTERVAL '$2 $1'/g;
s/cast\((\S+) as datetime2\((\d+)\)\)/"date_trunc(" . ($2 eq '3' ? "'milliseconds'" : "'second'") . ", $1)"/ie;
# Function to generate uuid's
s/lower\(newid\(\)\)/uuid_generate_v4()/g;
