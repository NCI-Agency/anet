
# sqlite time zone string: requires colon, disallows spaces
zonestring=`date +\ %z`

function dtg_linux {
	a=`date +%Y-%m-%d\ %H:%M:%S.`
	b=`date +%N | cut -c1,2,3`
	echo "${a}${b}${zonestring}"
}

function dtg_mac {
	a=`date +%Y-%m-%d\ %H:%M:%S.`
	b=`perl -MTime::HiRes -e 'printf "%03d", Time::HiRes::time * 1000 % 1000'`
	echo "${a}${b}${zonestring}"
}

# Start by turning on foreign keys for this connection
cat <<_EOF_
BEGIN;
PRAGMA foreign_keys = ON;
PRAGMA temp_store = 2;
CREATE TEMP TABLE _variables(name TEXT PRIMARY KEY, value TEXT);
INSERT INTO _variables (name) VALUES ('reportUuid');
_EOF_

while read input
do
	# Break out when we reach the last statement
	if [[ "$input" == "-- LEAVE THIS AS LAST STATEMENT" ]]; then
		break
	fi
	# First, handle special cases cheaply
	if [[ "$input" == "SET @reportUuid"* ]]; then
		echo "UPDATE _variables SET value = lower(hex(randomblob(16))) WHERE name = 'reportUuid';"
		continue;
	fi
	if [[ "$input" == "SET "* || "$input" == "DECLARE "* ]]; then
		echo "-- $input" # comment out any mssql-specific session-modifying commands
		continue;
	fi
	if [[ "$input" == "TRUNCATE"* ]]; then
		echo "$input" | sed "s/TRUNCATE TABLE/DELETE FROM/";
		continue;
	fi
	# uuid's
	if [[ "$input" == *"lower(newid())"* ]]; then
		input=`echo "$input" | sed "s/lower(newid())/lower(hex(randomblob(16)))/g"`
	fi
	if [[ "$input" == *"@reportUuid"* ]]; then
		input=`echo "$input" | sed "s/@reportUuid/(SELECT value FROM _variables WHERE name = 'reportUuid')/g"`
	fi
	if [[ "$input" == *"SUBSTRING"* ]]; then
		input=`echo "$input" | sed "s/SUBSTRING/substr/g"`
	fi
	# regenerate the current time down to the millisecond, so that things don't have identical timestamps
	if [[ "$OSTYPE" == "darwin"* ]]; then
		time=`dtg_mac`;
		sed_flag="-E"
	else
		time=`dtg_linux`;
		sed_flag="-r"
	fi
	# Handle one more time-related special case...
	if [[ "$input" == *"DATEADD"* ]]; then
		input=`echo "$input" | sed "s/DATEADD (day, -2, CURRENT_TIMESTAMP)/STRFTIME('%Y-%m-%d %H:%M:%f${zonestring}', substr('${time}', 1, 22), '-2 days')/g"`
	fi
	# And sub in the actual time for remaining CURRENT_TIMESTAMP instances
	echo "$input" | sed "s/CURRENT_TIMESTAMP/'${time}'/g" | sed $sed_flag "s/'([0-9]{4}-[0-9]{2}-[0-9]{2})'/'\1 00:00:00.000 -0000'/g"
done

cat <<_EOF_
DROP TABLE _variables;
COMMIT;
_EOF_
