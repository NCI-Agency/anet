#!/usr/bin/perl -pi

my $identifiers = qr/
 (?<!:)
 (?<!Integer\s)
 (?<!int )
 (?<!String )
 (?<!\.(?:get|put)\()
 (?<!\.(?:contains)\()
 (?<!\.equals\()
 \b
 (  adminSettings
  | advisorOrganizationId
  | approvalActions
  | approvalStepId
  | approvalSteps
  | atmosphereDetails
  | authorId
  | cancelledReason
  | createdAt
  | currentPersonId
  | domainUsername
  | emailAddress
  | endOfTourDate
  | engagementDate
  | isPrimary
  | identificationCode
  | jobSpec
  | keyOutcomes
  | locationId
  | longName
  | nextStepId
  | nextSteps
  | objectType
  | organizationId
  | ownerId
  | parentOrgId
  | parentPoamId
  | pendingEmails
  | pendingVerification
  | peoplePositions
  | personId
  | phoneNumber
  | poamId
  | positionId
  | positionId_a
  | positionId_b
  | positionRelationships
  | principalOrganizationId
  | releasedAt
  | reportId
  | reportPeople
  | reportPoams
  | reportTags
  | savedSearches
  | shortName
  | tagId
  | updatedAt
 )\b
 (?!") # this should allow us to skip field lists without missing anything else
 (?!\.equals\() # a place where identically-named java identifiers are used
/x;

# skip lines that are specifically annoying: method declarations, exception message
# builders, and two specific cases in ReportDao that don't generalize
next if /^\s+(?:public [A-Z]|\.bind\(|throw |query\.setParentOrgId|\@BindBean)/ 
    or /Utils\.buildParentOrgMapping/;
s/$identifiers/\\"$1\\"/g;
s/\[key\]/\\"key\\"/; # super super specific case that I'm sick of re-doing by hand
