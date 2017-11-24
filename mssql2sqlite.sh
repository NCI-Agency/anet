
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
	if [[ "$input" == "SET "* ]]; then
		echo "-- $input" # comment out any mssql-specific session-modifying commands
	elif [[ "$OSTYPE" == "darwin"* ]]; then
		time=`dtg_mac`;
		echo ${input} | sed "s/CURRENT_TIMESTAMP/'${time}'/g" | sed -E "s/'([0-9]{4}-[0-9]{2}-[0-9]{2})'/date('\1 00:00:00.000 -0000')/g" | sed "s/TRUNCATE TABLE/DELETE FROM/"
	else
		time=`dtg_linux`;
		echo ${input} | sed "s/CURRENT_TIMESTAMP/'${time}'/g" | sed -r "s/'([0-9]{4}-[0-9]{2}-[0-9]{2})'/'\1 00:00:00.000 -0000'/g" | sed "s/TRUNCATE TABLE/DELETE FROM/"
	fi
done
