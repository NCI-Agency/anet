
function dtg_linux {
	a=`date +%Y-%m-%d\ %H:%M:%S.`
	b=`date +%N | cut -c1,2,3`
	c=`date +\ %z`
	echo "${a}${b}${c}"
}

function dtg_mac {
	a=`date +%Y-%m-%d\ %H:%M:%S.`
	b=`perl -MTime::HiRes -e 'printf("%.0f\n",Time::HiRes::time()*1000)' | cut -c11,12,13`
	c=`date +\ %z`
	echo "${a}${b}${c}"
}

while read input
do
	# First, handle special cases cheaply
	if [[ "$input" == "SET "* ]]; then
		echo "-- $input" # comment out any mssql-specific session-modifying commands
		continue;
	fi
	if [[ "$input" == "TRUNCATE"* ]]; then
		echo $input | sed "s/TRUNCATE TABLE/DELETE FROM/";
		continue;
	fi
	# regenerate the current time down to the millisecond, so that things don't have identical timestamps
	if [[ "$OSTYPE" == "darwin"* ]]; then
		time=`dtg_mac`;
	else
		time=`dtg_linux`;
	fi
	# Handle one more time-related special case...
	if [[ "$input" == *"DATEADD"* ]]; then
		input=`echo $input | sed "s/DATEADD (day, -2, CURRENT_TIMESTAMP)/DATETIME('${time}', '-2 days')/g"`
	fi
	# And sub in the actual time for remaining CURRENT_TIMESTAMP instances
	if [[ "$OSTYPE" == "darwin"* ]]; then
		echo ${input} | sed "s/CURRENT_TIMESTAMP/'${time}'/g" | sed -E "s/'([0-9]{4}-[0-9]{2}-[0-9]{2})'/date('\1 00:00:00.000 -0000')/g"
	else
		echo ${input} | sed "s/CURRENT_TIMESTAMP/'${time}'/g" | sed -r "s/'([0-9]{4}-[0-9]{2}-[0-9]{2})'/'\1 00:00:00.000 -0000'/g"
	fi
done
