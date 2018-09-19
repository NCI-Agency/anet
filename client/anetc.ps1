param(  [string] $action,
        [string] $type,
        [string] $text,
        [string] [ValidateSet('ACTIVE','INACTIVE','NEW_USER')] $status,
        [int] $orgId,
        [int] $locationId,
        [string] [ValidateSet('ADVISOR','PRINCIPAL')] $role,
        [string] $country
    )

$PersonTemplate = "id, domainUsername, rank, name, endOfTourDate, role, emailAddress
    position {
        id, name, location {
            id, name
        }
        organization {
            id, shortName
        }
    }"

$TaskTemplate = "id, shortName, status
    responsibleOrg {
        id, shortName
    }
    plannedCompletion, projectedCompletion, customField, customFieldEnum1, customFieldEnum2
    customFieldRef1 {
        id, shortName
    }, longName"

$OrganizationTemplate = "id, shortName, identificationCode
    parentOrg {
        id, shortName
    }, positions {
        id, name
    }, type
    childrenOrgs {
        id, shortName
    }, status"


$ReportTemplate = "id, intent, 
    author {
        id, name
    }, location {
        id, name
    }, atmosphere
    approvalStatus {
        step {
            id, name
            }
        }
    engagementDate
    primaryAdvisor{
        id, name
    }
    primaryPrincipal {
        id, name
    }, atmosphereDetails"

$PositionTemplate = "id, name, 
    person {
        id, name
    }
    organization {
        id, shortName
    }
    previousPeople {
        person{
            id, name
        }
    }
    location {
        id, name
    }
    status, isApprover"


if (![string]::IsNullOrEmpty($text)) { $query = $query + " text: ""$text""," }
if (![string]::IsNullOrEmpty($status)) { $query = $query + " status: ""$status""," }
if (![int]::IsNullOrEmpty($orgId)) { $query = $query + " orgId: ""$orgId""," }
if (![int]::IsNullOrEmpty($locationId)) { $query = $query + " locationId: ""$locationId""," }
if (![string]::IsNullOrEmpty($role)) { $query = $query + " role: ""$role""," }

if (![string]::IsNullOrEmpty($query)) {$query = "{$query}"}

Write-Host $query



    switch ( $type )
    {
        "me" { 
            $GQLQuery = "{ me { $PersonTemplate } }"
        }
        "people" { 

            if ([string]::IsNullOrEmpty($query)) {
                $query = "{role: ADVISOR}"
            } 
            $GQLQuery = "{personList(query: $query) {list {$PersonTemplate}}}"
        }
        "tasks" { 
            if ([string]::IsNullOrEmpty($query)) {
                $query = "{status:ACTIVE}"
            } 
            $GQLQuery = "{taskList(query: $query) {list {$TaskTemplate}}}"
        }
        "organizations" { 
            if ([string]::IsNullOrEmpty($query)) {
                $query = "{status:ACTIVE}"
            } 
            $GQLQuery = "{organizationList(query: $query) {list {$OrganizationTemplate}}}"
         }
        "reports" { 
            if ([string]::IsNullOrEmpty($query)) {
                $query = "{state:RELEASED}"
            } 
            $GQLQuery = "{reportList(query: $query) {list {$ReportTemplate}}}"
         }
        "positions" { 
            if ([string]::IsNullOrEmpty($query)) {
                $query = "{status:ACTIVE}"
            } 
            $GQLQuery = "{positionList(query: $query) {list {$PositionTemplate}}}"
         }

        default { 
            Write-Host "anetc usage:
            get commands:
                anetc get me
                anetc get people
                anetc get people -text ""test"" | Format-Table
                anetc get tasks
                anetc get organizations
                anetc get reports
                anet get positions
            set commands: comming soon"
            exit
        }
    }

$Result = (ConvertFrom-Json (Invoke-WebRequest -Uri "http://localhost:8080/graphql" -Body (ConvertTo-Json @{ query = $GQLQuery }) -Method Post -Authentication Basic -Credential arthur -AllowUnencryptedAuthentication -ContentType "application/json")).data

switch ( $type )
{
    "me" { return $Result.me }
    "people" { return $Result.personList.list }
    "tasks" { return $Result.taskList.list }
    "organizations" { return $Result.organizationList.list }
    "reports" { return $Result.reportList.list }
    "positions" { return $Result.positionList.list }
}
