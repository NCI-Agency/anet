$DB_NAME = ""
$DB_USERNAME = "sa"
$DB_PASSWORD = ""
$indir = "backups"


bcp dbo.adminSettings IN $indir/adminSettings.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.approvalActions IN $indir/approvalActions.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.approvalSteps IN $indir/approvalSteps.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.approvers IN $indir/approvers.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.locations IN $indir/locations.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.organizations IN $indir/organizations.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.people IN $indir/people.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.peoplePositions IN $indir/peoplePositions.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.tasks IN $indir/tasks.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.positionRelationships IN $indir/positionRelationships.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.positions IN $indir/positions.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -q -E
bcp dbo.reportPeople IN $indir/reportPeople.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.reportTasks IN $indir/reportTasks.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.reports IN $indir/reports.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
bcp dbo.savedSearches IN $indir/savedSearches.bak -N  -d $DB_NAME -U $DB_USERNAME -P "$DB_PASSWORD" -E
