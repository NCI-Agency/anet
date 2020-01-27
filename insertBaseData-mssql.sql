SET QUOTED_IDENTIFIER ON

--DROP TABLE approvers;
--DROP TABLE reportActions;
--DROP TABLE positionRelationships;
--DROP TABLE reportTasks;
--DROP TABLE reportPeople;
--DROP TABLE reportTags;
--DROP TABLE peoplePositions;
--DROP TABLE savedSearches;
--DROP TABLE positions;
--DROP TABLE tasks;
--DROP TABLE comments;
--DROP TABLE reports;
--DROP TABLE people;
--DROP TABLE approvalSteps;
--DROP TABLE locations;
--DROP TABLE organizations;
--DROP TABLE adminSettings;
--DROP TABLE pendingEmails;
--DROP TABLE tags;
--DROP TABLE authorizationGroupPositions;
--DROP TABLE authorizationGroups;
--DROP TABLE reportAuthorizationGroups;
--DROP TABLE notes;
--DROP TABLE noteRelatedObjects;
--DROP TABLE DATABASECHANGELOG;
--DROP TABLE DATABASECHANGELOGLOCK;

TRUNCATE TABLE peoplePositions;
TRUNCATE TABLE approvers;
TRUNCATE TABLE reportActions;
TRUNCATE TABLE positionRelationships;
TRUNCATE TABLE reportTasks;
TRUNCATE TABLE reportPeople;
TRUNCATE TABLE reportTags;
TRUNCATE TABLE comments;
TRUNCATE TABLE savedSearches;
TRUNCATE TABLE reportsSensitiveInformation;
TRUNCATE TABLE authorizationGroupPositions;
TRUNCATE TABLE reportAuthorizationGroups;
TRUNCATE TABLE noteRelatedObjects;
DELETE FROM positions;
DELETE FROM tasks WHERE customFieldRef1Uuid IS NOT NULL;
DELETE FROM tasks WHERE customFieldRef1Uuid IS NULL;
DELETE FROM reports;
DELETE FROM people;
DELETE FROM approvalSteps;
DELETE FROM locations;
DELETE FROM organizations;
DELETE FROM adminSettings;
DELETE FROM tags;
DELETE FROM authorizationGroups;
DELETE FROM notes;

--Advisors
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'JACKSON, Jack', 0, 0, 'hunter+jack@dds.mil', '123-456-78960', 'OF-9', 'Jack is an advisor in EF 2.1', 'jack', 'Germany', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'ELIZAWELL, Elizabeth', 0, 0, 'hunter+liz@dds.mil', '+1-777-7777', 'Capt', 'Elizabeth is a test advisor we have in the database who is in EF 1.1', 'elizabeth', 'United States of America', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'ERINSON, Erin', 0, 0, 'hunter+erin@dds.mil', '+9-23-2323-2323', 'CIV', 'Erin is an Advisor in EF 2.2 who can approve reports', 'erin', 'Australia', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'REINTON, Reina', 0, 0, 'hunter+reina@dds.mil', '+23-23-11222', 'CIV', 'Reina is an Advisor in EF 2.2', 'reina', 'Italy', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'DVISOR, A', 0, 0, 'hunter+aDvisor@dds.mil', '+444-44-4444', 'OF-2', 'A Divisor was born for this job', 'advisor', 'Canada', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Principals
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES (lower(newid()), 'STEVESON, Steve', 0, 1, 'hunter+steve@dds.mil', '+011-232-12324', 'LtCol', 'this is a sample person who could be a Principal!', 'Afghanistan', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES (lower(newid()), 'ROGWELL, Roger', 0, 1, 'hunter+roger@dds.mil', '+1-412-7324', 'Maj', 'Roger is another test person we have in the database', 'Afghanistan', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES (lower(newid()), 'TOPFERNESS, Christopf', 0, 1, 'hunter+christopf@dds.mil', '+1-422222222', 'CIV', 'Christopf works in the MoD Office', 'Afghanistan', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Super Users
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'BOBTOWN, Bob', 0, 0, 'hunter+bob@dds.mil', '+1-444-7324', 'CIV', 'Bob is a Super User in EF 1.1', 'bob', 'United States of America', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'HENDERSON, Henry', 0, 0, 'hunter+henry@dds.mil', '+2-456-7324', 'BGen', 'Henry is a Super User in EF 2.1', 'henry', 'United States of America', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'JACOBSON, Jacob', 0, 0, 'hunter+jacob@dds.mil', '+2-456-7324', 'CIV', 'Jacob is a Super User in EF 2.2', 'jacob', 'Italy', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'BECCABON, Rebecca', 0, 0, 'hunter+rebecca@dds.mil', '+2-456-7324', 'CTR', 'Rebecca is a Super User in EF 2.2', 'rebecca', 'Germany', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'ANDERSON, Andrew', 0, 0, 'hunter+andrew@dds.mil', '+1-412-7324', 'CIV', 'Andrew is the EF 1 Manager', 'andrew', 'United States of America', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Administrator
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'DMIN, Arthur', '0', '0', 'hunter+arthur@dds.mil', NULL, 'CIV', 'An administrator', 'arthur', 'Albania', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

--People
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES (lower(newid()), 'HUNTMAN, Hunter', 0, 1, 'hunter+hunter@dds.mil', '+1-412-9314', 'CIV', NULL, 'United States of America', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'NICHOLSON, Nick', 0, 0, 'hunter+nick@dds.mil', '+1-202-7324', 'CIV', NULL, 'nick', 'United States of America', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES (lower(newid()), 'SHARTON, Shardul', 1, 1, 'hunter+shardul@dds.mil', '+99-9999-9999', 'CIV', NULL, 'Italy', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'ANET Administrator', 3, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1 Manager', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor A', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor B', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor C', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor D', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor E', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor F', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor for Agriculture', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Old Inactive Advisor', 0, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor for Mining', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor for Space Issues', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 Advisor for Interagency Advising', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 SuperUser', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.1 Advisor B', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.1 Advisor for Accounting', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.1 Advisor for Kites', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.1 SuperUser', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 Advisor C', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 Advisor D', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 Old and Inactive', 0, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 Advisor Sewing Facilities', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 Advisor Local Kebabs', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 Super User', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 Final Reviewer', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 4.1 Advisor E', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 4.1 Advisor for Coffee', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 4.1 Advisor on Software Engineering', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 4.1 Advisor E', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 4.1 Advisor old - dont use', 0, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, type, status, currentPersonUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 9 Advisor <empty>', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- Put Andrew in the EF 1 Manager Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 1 Manager'), (SELECT uuid from people where emailAddress = 'hunter+andrew@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+andrew@dds.mil') WHERE name = 'EF 1 Manager';

-- Put Bob into the Super User Billet in EF 1.1
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 1.1 SuperUser'), (SELECT uuid from people where emailAddress = 'hunter+bob@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+bob@dds.mil') WHERE name = 'EF 1.1 SuperUser';

-- Put Henry into the Super User Billet in EF 2.1
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.1 SuperUser'), (SELECT uuid from people where emailAddress = 'hunter+henry@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+henry@dds.mil') WHERE name = 'EF 2.1 SuperUser';

-- Rotate an advisor through a billet ending up with Jack in the EF 2.1 Advisor B Billet
DECLARE @positionTimestamp DATETIME;
SET @positionTimestamp = CURRENT_TIMESTAMP;
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where emailAddress = 'hunter+erin@dds.mil'), @positionTimestamp);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+erin@dds.mil') WHERE name = 'EF 2.1 Advisor B';
UPDATE peoplePositions SET endedAt = @positionTimestamp WHERE positionUuid = (SELECT uuid from positions where name = 'EF 2.1 Advisor B');
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where emailAddress = 'hunter+jack@dds.mil'), @positionTimestamp);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+jack@dds.mil') WHERE name = 'EF 2.1 Advisor B';

-- Put Elizabeth into the EF 1.1 Advisor A Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 1.1 Advisor A'), (SELECT uuid from people where emailAddress = 'hunter+liz@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+liz@dds.mil') WHERE name = 'EF 1.1 Advisor A';

-- Put Reina into the EF 2.2 Advisor C Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.2 Advisor C'), (SELECT uuid from people where emailAddress = 'hunter+reina@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+reina@dds.mil') WHERE name = 'EF 2.2 Advisor C';

-- Put Erin into the EF 2.2 Advisor D Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.2 Advisor D'), (SELECT uuid from people where emailAddress = 'hunter+erin@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+erin@dds.mil') WHERE name = 'EF 2.2 Advisor D';

-- Put Jacob in the EF 2.2 Super User Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.2 Super User'), (SELECT uuid from people where emailAddress = 'hunter+jacob@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+jacob@dds.mil') WHERE name = 'EF 2.2 Super User';

-- Put Rebecca in the EF 2.2 Final Reviewer Position
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.2 Final Reviewer'), (SELECT uuid from people where emailAddress = 'hunter+rebecca@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+rebecca@dds.mil') WHERE name = 'EF 2.2 Final Reviewer';

-- Put Arthur into the Admin Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'ANET Administrator'), (SELECT uuid from people where emailAddress = 'hunter+arthur@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+arthur@dds.mil') WHERE name = 'ANET Administrator';


INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'ANET Administrators','', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1', 'Planning Programming, Budgeting and Execution', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 1.1', '',0, (SELECT uuid from organizations WHERE shortName ='EF 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2', '',0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 2.1', '', 0, (SELECT uuid from organizations WHERE shortName ='EF 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 2.2', '', 0, (SELECT uuid from organizations WHERE shortName ='EF 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 3', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 4', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 4.1', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 4.2', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 4.3', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 4.4', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 5', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 5.1', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 5.2', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 5.3', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 5.4', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 6', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 6.1', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 6'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
		VALUES (lower(newid()), 'EF 6.2', '', 0 , (SELECT uuid FROM organizations WHERE shortName = 'EF 6'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF7', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF8', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF9', 'Gender', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-N', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-S', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-W', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-E', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-C', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC Air', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE positions SET organizationUuid = (SELECT uuid FROM organizations WHERE shortName ='EF 1') WHERE name LIKE 'EF 1 %';
UPDATE positions SET organizationUuid = (SELECT uuid FROM organizations WHERE shortName ='EF 1.1') WHERE name LIKE 'EF 1.1%';
UPDATE positions SET organizationUuid = (SELECT uuid FROM organizations WHERE shortName ='EF 2.1') WHERE name LIKE 'EF 2.1%';
UPDATE positions SET organizationUuid = (SELECT uuid FROM organizations WHERE shortName ='EF 2.2') WHERE name LIKE 'EF 2.2%';
UPDATE positions SET organizationUuid = (SELECT uuid FROM organizations WHERE shortName ='EF 3') WHERE name LIKE 'EF 3%';
UPDATE positions SET organizationUuid = (SELECT uuid FROM organizations WHERE shortName ='EF 4') WHERE name LIKE 'EF 4%';
UPDATE positions SET organizationUuid = (SELECT uuid FROM organizations WHERE shortName='ANET Administrators') where name = 'ANET Administrator';

-- Create the EF 1.1 approval process
INSERT INTO approvalSteps (uuid, advisorOrganizationUuid, name, type)
	VALUES (lower(newid()), (SELECT uuid from organizations where shortName='EF 1.1'), 'EF 1.1 Approvers', 1);
INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 1.1 Approvers'), (SELECT uuid from positions where name = 'EF 1.1 SuperUser'));

-- Create the EF 2.2 approval process
DECLARE @approvalStepUuid varchar(36);
SET @approvalStepUuid = lower(newid());
INSERT INTO approvalSteps (uuid, name, advisorOrganizationUuid, type)
	VALUES (@approvalStepUuid, 'EF 2.2 Secondary Reviewers', (SELECT uuid from organizations where shortName='EF 2.2'), 1);
INSERT INTO approvalSteps (uuid, name, advisorOrganizationUuid, nextStepUuid, type)
	VALUES (lower(newid()), 'EF 2.2 Initial Approvers', (SELECT uuid from organizations where shortName='EF 2.2'), @approvalStepUuid, 1);

INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Super User'));
INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Advisor D'));
INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 2.2 Secondary Reviewers'), (SELECT uuid from positions where name = 'EF 2.2 Final Reviewer'));

INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid)
	VALUES
		(N'1145e584-4485-4ce0-89c4-2fa2e1fe846a', 'EF 1', 'Budget and Planning', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'fdf107e7-a88a-4dc4-b744-748e9aaffabc', '1.1', 'Budgeting in the MoD', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
		(N'7b2ad5c3-018b-48f5-b679-61fbbda21693', '1.1.A', 'Milestone the First in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
		(N'1b5eb36b-456c-46b7-ae9e-1c89e9075292', '1.1.B', 'Milestone the Second in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
		(N'7fdef880-1bf3-4e56-8476-79166324023f', '1.1.C', 'Milestone the Third in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
		(N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0', 'EF 1.2', 'Budgeting in the MoI', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
		(N'953e0b0b-25e6-44b6-bc77-ef98251d046a', '1.2.A', 'Milestone the First in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
		(N'9d3da7f4-8266-47af-b518-995f587250c9', '1.2.B', 'Milestone the Second in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
		(N'6bbb1be9-4655-48d7-83f2-bc474781544a', '1.2.C', 'Milestone the Third in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
		(N'ac466253-1456-4fc8-9b14-a3643746e5a6', 'EF 1.3', 'Budgeting in the Police?', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
		(N'076793eb-9950-4ea6-bbd5-2d8b8827828c', '1.3.A', 'Getting a budget in place', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'ac466253-1456-4fc8-9b14-a3643746e5a6'),
		(N'30bc5708-c12d-4a21-916c-5acd7f6f11da', '1.3.B', 'Tracking your expenses', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'ac466253-1456-4fc8-9b14-a3643746e5a6'),
		(N'df920c99-10ea-44e8-940f-cb1d1cbd22da', '1.3.C', 'Knowing when you run out of money', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'ac466253-1456-4fc8-9b14-a3643746e5a6'),
		(N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7', 'EF 2', 'Transparency, Accountability, O (TAO)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'75d4009d-7c79-42e0-aa2f-d79d158ec8d6', '2.A', 'This is the first Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
		(N'2200a820-c4c7-4c9c-946c-f0c9c9e045c5', '2.B', 'This is the second Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
		(N'0701a964-5d79-4090-8f35-a40856556675', '2.C', 'This is the third Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
		(N'42afd501-1a2c-4758-9da5-f996b2c97156', '2.D', 'Keep track of the petty cash drawer', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
		(N'44089923-7367-4e97-82c3-dfe6b270d493', 'EF 3', 'Rule of Law', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'39d0c437-720c-4d78-8768-7f3dee5b3cd0', '3.a', 'Get some Lawyers to read a book', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'44089923-7367-4e97-82c3-dfe6b270d493'),
		(N'a710a076-be5c-4982-b870-50dd5d340eb3', '3.b', 'Get some Lawyers to wear a suit to court', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'44089923-7367-4e97-82c3-dfe6b270d493'),
		(N'c00633c5-5479-41b2-b188-89d2a9922924', '3.c', 'Get some Lawyers to cross-examine witnesses in a non-hostile fashion', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'44089923-7367-4e97-82c3-dfe6b270d493'),
		(N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9', 'EF 4', 'Force Gen (Training)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'c098a5b3-8d80-429d-ada2-fd57dc331e2a', '4.a', 'Get a website for people to apply on', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'eddf19f6-f6e1-44f5-9093-f3e2ade59428', '4.b', 'Hire People', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'0cb03167-2772-4d3e-8382-5870da58022a', '4.b.1', 'Get an HR team', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'df8fd269-b382-486e-9bc6-f3f4b77a03b0', '4.b.2', 'Review resumes for hiring', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'17f35bc6-a0f3-4f79-8813-2176a7d7ca2f', '4.b.3', 'Invite people to come interview', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'32788f96-b72c-4314-8286-7f59b683cba2', '4.b.4', 'Interview candidates', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'cca1678a-58d7-4213-9c67-f894879df776', '4.b.5', 'Extend Job Offers to successful candidates', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'98342fa0-9106-4ef1-bc47-e4af2f5da330', '4.c', 'Onboard new Employees', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
		(N'242efaa3-d5de-4970-996d-50ca90ef6480', 'EF 5', 'Force Sustainment (Logistics)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'12b8dbcc-8f31-444a-9437-00fe00fc1f7b', 'EF6', 'C2 Operations', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'19364d81-3203-483d-a6bf-461d58888c76', 'EF7', 'Intelligence', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'9b9f4205-0721-4893-abf8-69e020d4db23', 'EF8', 'Stratcom', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(N'5173f34b-16f5-4e18-aa3d-def55c40e36d', 'Gender', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(lower(newid()), 'TAAC-N', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(lower(newid()), 'TAAC-S', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(lower(newid()), 'TAAC-E', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(lower(newid()), 'TAAC-W', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(lower(newid()), 'TAAC-C', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
		(lower(newid()), 'TAAC Air', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);

INSERT INTO taskTaskedOrganizations (taskUuid, organizationUuid)
  VALUES
		((SELECT uuid from tasks where shortName = '1.1.A'), (SELECT uuid from organizations where shortName='EF 1.1')),
		((SELECT uuid from tasks where shortName = '1.1.B'), (SELECT uuid from organizations where shortName='EF 1.1')),
		((SELECT uuid from tasks where shortName = '1.1.C'), (SELECT uuid from organizations where shortName='EF 1.1')),
		-- ((SELECT uuid from tasks where shortName = 'EF 1.2'), (SELECT uuid from organizations WHERE shortName='EF 1.2')),
		-- ((SELECT uuid from tasks where shortName = '1.2.A'), (SELECT uuid from organizations where shortName='EF 1.2')),
		-- ((SELECT uuid from tasks where shortName = '1.2.B'), (SELECT uuid from organizations where shortName='EF 1.2')),
		-- ((SELECT uuid from tasks where shortName = '1.2.C'), (SELECT uuid from organizations where shortName='EF 1.2')),
		-- ((SELECT uuid from tasks where shortName = 'EF 1.3'), (SELECT uuid FROM organizations WHERE shortName='EF 1.3')),
		-- ((SELECT uuid from tasks where shortName = '1.3.A'), (SELECT uuid from organizations where shortName='EF 1.3')),
		-- ((SELECT uuid from tasks where shortName = '1.3.B'), (SELECT uuid from organizations where shortName='EF 1.3')),
		-- ((SELECT uuid from tasks where shortName = '1.3.C'), (SELECT uuid from organizations where shortName='EF 1.3')),
		((SELECT uuid from tasks where shortName = 'EF 2'), (SELECT uuid from organizations where shortName='EF 2')),
		((SELECT uuid from tasks where shortName = '2.A'), (SELECT uuid from organizations where shortName='EF 2')),
		((SELECT uuid from tasks where shortName = '2.B'), (SELECT uuid from organizations where shortName='EF 2')),
		((SELECT uuid from tasks where shortName = '2.C'), (SELECT uuid from organizations where shortName='EF 2')),
		((SELECT uuid from tasks where shortName = '2.D'), (SELECT uuid from organizations where shortName='EF 2')),
		((SELECT uuid from tasks where shortName = '3.a'), (SELECT uuid from organizations where shortName='EF 3')),
		((SELECT uuid from tasks where shortName = '3.b'), (SELECT uuid from organizations where shortName='EF 3')),
		((SELECT uuid from tasks where shortName = '3.c'), (SELECT uuid from organizations where shortName='EF 3')),
		((SELECT uuid from tasks where shortName = '4.a'), (SELECT uuid from organizations where shortName='EF 4')),
		((SELECT uuid from tasks where shortName = '4.b'), (SELECT uuid from organizations where shortName='EF 4')),
		((SELECT uuid from tasks where shortName = '4.b.1'), (SELECT uuid from organizations where shortName='EF 4')),
		((SELECT uuid from tasks where shortName = '4.b.2'), (SELECT uuid from organizations where shortName='EF 4')),
		((SELECT uuid from tasks where shortName = '4.b.3'), (SELECT uuid from organizations where shortName='EF 4')),
		((SELECT uuid from tasks where shortName = '4.b.4'), (SELECT uuid from organizations where shortName='EF 4')),
		((SELECT uuid from tasks where shortName = '4.b.5'), (SELECT uuid from organizations where shortName='EF 4')),
		((SELECT uuid from tasks where shortName = '4.c'), (SELECT uuid from organizations where shortName='EF 4'));

INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', 'St Johns Airport', 47.613442, -52.740936, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'8c138750-91ce-41bf-9b4c-9f0ddc73608b', 'Murray''s Hotel', 47.561517, -52.708760, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'9c982685-5946-4dad-a7ee-0f5a12f5e170', 'Wishingwells Park', 47.560040, -52.736962, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'0855fb0a-995e-4a79-a132-4024ee2983ff', 'General Hospital', 47.571772, -52.741935, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'95446f93-249b-4aa9-b98a-7bd2c4680718', 'Portugal Cove Ferry Terminal', 47.626718, -52.857241, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'c8fdb53f-6f93-46fc-b0fa-f005c7b49667', 'Cabot Tower', 47.570010, -52.681770, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'c7a9f420-457a-490c-a810-b504c022cf1e', 'Fort Amherst', 47.563763, -52.680590, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'7339f9e3-99d1-497a-9e3b-1269c4c287fe', 'Harbour Grace Police Station', 47.705133, -53.214422, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (N'f2207d9b-204b-4cb5-874d-3fe6bc6f8acd', 'Conception Bay South Police Station', 47.526784, -52.954739, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'e0ff0d6c-e663-4639-a44d-b075bf1e690d', 'MoD Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'5046a870-6c2a-40a7-9681-61a1d6eeaa07', 'MoI Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'c15eb29e-2965-401e-9f36-6ac8b9cc3842', 'President''s Palace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'0585f158-5121-46a2-b099-799fe980aa9c', 'Kabul Police Academy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'053ab2ad-132a-4a62-8cbb-20827f50ec34', 'Police HQ Training Facility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'e87f145b-32e9-47ec-a0f4-e0dcf18e8a8c', 'Kabul Hospital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'6465dd40-9fec-41db-a3b9-652fa52c7d21', 'MoD Army Training Base 123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'2a59dd78-0c29-4b3f-bc94-7c98ff80b197', 'MoD Location the Second', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'18c9be38-bf68-40e2-80d8-aac47f5ff7cf', 'MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'8a34768c-aa15-41e4-ab79-6cf2740d555e', 'MoI Training Center', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'9f364c59-953e-4c17-919c-648ea3a74e36', 'MoI Adminstrative Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'dfc3918d-c2e3-4308-b161-2445cde77b3f', 'MoI Senior Executive Suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'3652e114-ad16-43f0-b179-cc1bce6958d5', 'MoI Coffee Shop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'5ac4078d-d445-416a-a93e-5941562359bb', 'MoI Herat Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'22b0137c-4d89-43eb-ac95-a9f68aba884f', 'MoI Jalalabad Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'60f4084f-3304-4cd5-89df-353edef07d18', 'MoI Kandahar Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'c136bf89-cc24-43a5-8f51-0f41dfc9ab77', 'MoI Mazar-i-Sharif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (N'b0979678-0ed0-4b42-9b26-9976fcfa1b81', 'MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


INSERT INTO organizations (uuid, shortName, longName, type, identificationCode, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoD', 'Ministry of Defense', 1, 'Z12345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations (uuid, shortName, longName, type, identificationCode, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI', 'Ministry of Interior', 1, 'P12345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO organizations (uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'MOD-F', 'Ministry of Defense Finances', 1,
	(SELECT uuid from organizations where shortName = 'MoD'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'879121d2-d265-4d26-8a2b-bd073caa474e', 'Minister of Defense', 'MOD-FO-00001', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'1a45ccd6-40e3-4c51-baf5-15e7e9b8f03d', 'Chief of Staff - MoD', 'MOD-FO-00002', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'4be6baa5-c611-4c70-a2a8-c01bf9b7d2bc', 'Executive Assistant to the MoD', 'MOD-FO-00003', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'a9ab507e-cda9-469b-8d9e-b47445852af4', 'Planning Captain', 'MOD-FO-00004', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'61371573-eefc-4b85-81a0-27d6c0b78c58', 'Director of Budgeting - MoD', 'MOD-Bud-00001', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'c2e3fdff-2b36-4ef9-9790-afbca0c53f57', 'Writer of Expenses - MoD', 'MOD-Bud-00002', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'c065c2b6-a04a-4ead-a3a2-5aabf921446d', 'Cost Adder - MoD', 'MOD-Bud-00003', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (N'731ee4f9-f21b-4166-b03d-d7ba5e7f735c', 'Chief of Police', 'MOI-Pol-HQ-00001', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Interior'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Put Steve into a Tashkil and associate with the EF 1.1 Advisor A Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'Cost Adder - MoD'), (SELECT uuid from people where emailAddress = 'hunter+steve@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+steve@dds.mil') WHERE name = 'Cost Adder - MoD';
INSERT INTO positionRelationships (positionUuid_a, positionUuid_b, createdAt, updatedAt, deleted)
	VALUES ((SELECT uuid from positions WHERE name ='EF 1.1 Advisor A'),
	(SELECT uuid FROM positions WHERE name='Cost Adder - MoD'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- But Roger in a Tashkil and associate with the EF 2.1 Advisor B Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'Chief of Police'), (SELECT uuid from people where emailAddress = 'hunter+roger@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+roger@dds.mil') WHERE name = 'Chief of Police';
INSERT INTO positionRelationships (positionUuid_a, positionUuid_b, createdAt, updatedAt, deleted)
	VALUES ((SELECT uuid FROM positions WHERE name='EF 2.1 Advisor B'),
	(SELECT uuid from positions WHERE name ='Chief of Police'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- But Christopf in a Tashkil and associate with the EF 2.2 Advisor D Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'Planning Captain'), (SELECT uuid from people where emailAddress = 'hunter+christopf@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+christopf@dds.mil') WHERE name = 'Planning Captain';
INSERT INTO positionRelationships (positionUuid_a, positionUuid_b, createdAt, updatedAt, deleted)
	VALUES ((SELECT uuid FROM positions WHERE name='EF 2.2 Advisor D'),
	(SELECT uuid from positions WHERE name ='Planning Captain'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);


UPDATE positions SET locationUuid = (SELECT uuid from LOCATIONS where name = 'Kabul Police Academy') WHERE name = 'Chief of Police';
UPDATE positions SET locationUuid = (SELECT uuid from LOCATIONS where name = 'MoD Headquarters Kabul') WHERE name = 'Cost Adder - MoD';

--Write a couple reports!
DECLARE @reportUuid varchar(36);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Discuss improvements in Annual Budgeting process',
	'Today I met with this dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
	'Meet with the dude again next week',
	(SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), 2, '2016-05-25', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, keyOutcomes, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='General Hospital'), 'Run through FY2016 Numbers on tool usage',
	'Today we discussed the fiscal details of how spreadsheets break down numbers into rows and columns and then text is used to fill up space on a web page, it was very interesting and other adjectives',
	'we read over the spreadsheets for the FY17 Budget',
	'meet with him again :(', (SELECT uuid FROM people where domainUsername='jack'), 2, '2016-06-01', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+roger@dds.mil'), @reportUuid, 0);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.A'), @reportUuid);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.B'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, keyOutcomes, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Kabul Hospital'), 'Looked at Hospital usage of Drugs',
	'This report needs to fill up more space',
	'putting something in the database to take up space',
	'to be more creative next time', (SELECT uuid FROM people where domainUsername='jack'), 2, '2016-06-03', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.C'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, keyOutcomes, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Kabul Hospital'), 'discuss enagement of Doctors with Patients',
	'Met with Nobody in this engagement and discussed no tasks, what a waste of time',
	'None',
	'Head over to the MoD Headquarters buildling for the next engagement', (SELECT uuid FROM people where domainUsername='jack'), 2, '2016-06-10', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.A'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, authorUuid, state, releasedAt, engagementDate, atmosphere, atmosphereDetails, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='MoD Headquarters Kabul'), 'Meet with Leadership regarding monthly status update',
	'This engagement was sooooo interesting',
	'Meet up with Roger next week to look at the numbers on the charts', (SELECT uuid FROM people where domainUsername='jack'), 2,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2, 'Guy was grumpy',
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+bob@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.B'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, keyOutcomes, nextSteps, authorUuid, state, releasedAt, engagementDate, atmosphere, atmosphereDetails, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Fort Amherst'), 'Inspect Ft Amherst Medical Budgeting Facility?',
	'Went over to the fort to look at the beds and the spreadsheets and the numbers and the whiteboards and the planning and all of the budgets. It was GREAT!',
	'Seeing the whiteboards firsthand',
	'head to Cabot Tower and inspect their whiteboards next week', (SELECT uuid FROM people where domainUsername='jack'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'Very good tea',
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+roger@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.A'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Cabot Tower'), 'Inspect Cabot Tower Budgeting Facility',
	'Looked over the places around Cabot Tower for all of the things that people do when they need to do math.  There were calculators, and slide rules, and paper, and computers',
	'keep writing fake reports to fill the database!!!', (SELECT uuid FROM people where domainUsername='jack'), 1, '2016-06-20', 1,
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.C'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Discuss discrepancies in monthly budgets',
	'Back to the hospital this week to test the recent locations feature of ANET, and also to look at math and numbers and budgets and things',
	'Meet with the dude again next week',(SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), 1, '2016-06-25', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.A'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='St Johns Airport'), 'Inspect Air Operations Capabilities',
	'We went to the Aiport and looked at the planes, and the hangers, and the other things that airports have. ',
	'Go over to the Airport next week to look at the helicopters',(SELECT uuid FROM people where domainUsername='elizabeth'), 2, '2016-05-20', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 1.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+roger@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+liz@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '2.A'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='St Johns Airport'), 'Inspect Helicopter Capabilities',
	'Today we looked at the helicopters at the aiport and talked in depth about how they were not in good condition and the AAF needed new equipment.  I expressed my concerns to the pilots and promised to see what we can do.',
	'Figure out what can be done about the helicopters',(SELECT uuid FROM people where domainUsername='elizabeth'), 2, '2016-05-22', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 1.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+roger@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+liz@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '2.A'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, keyOutcomes, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Look for Budget Controls',
	'Goal of the meeting was to look for the word spreadsheet in a report and then return that in a search result about budget. Lets see what happens!!',
	'Searching for text', 'Test Cases are good', (SELECT uuid FROM people where domainUsername='erin'), 2, '2017-01-14', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.2'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+christopf@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+erin@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+reina@dds.mil'), @reportUuid, 0);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.B'), @reportUuid);
INSERT INTO reportsSensitiveInformation (uuid, createdAt, updatedAt, text, reportUuid)
	VALUES (lower(newid()), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Need to know only', @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, keyOutcomes, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Look for Budget Controls Again',
	'The search for the spreadsheet was doomed to be successful, so we needed to generate more data in order to get a more full test of the system that really is going to have much much larger reports in it one day.',
	'Mocking up test cases','Better test data is always better', (SELECT uuid FROM people where domainUsername='erin'), 2, '2017-01-04', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.2'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+christopf@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+erin@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.B'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, keyOutcomes, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Talk to the Interior about things',
	'We know that we want to go to the house with the food and eat the food, but the words in the database need to be long enough to do something. What that is were not sure, but we know we cant use apostrophies or spell.  Wow, we really cant do much, right? It was decided that we would do more tomorrow.',
	'Mocking up test cases','Looking at the telescope with our eyes', (SELECT uuid FROM people where domainUsername='erin'), 2, '2017-01-04', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.2'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Interior'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+christopf@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+erin@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.B'), @reportUuid);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, keyOutcomes, authorUuid, state, engagementDate, atmosphere, cancelledReason, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Weekly Checkin with MG Somebody',
	'Meeting got cancelled',
	'Reschedule Meeting','', (SELECT uuid FROM people where domainUsername='erin'), 4, CURRENT_TIMESTAMP, 0, 1,
	(SELECT uuid FROM organizations where shortName = 'EF 2.2'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Interior'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+erin@dds.mil'), @reportUuid, 1);

SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, keyOutcomes, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'A test report from Arthur', '',
	'keep on testing!','have reports in organizations', (SELECT uuid FROM people where domainUsername='arthur'), 2, DATEADD (minute, 1, CURRENT_TIMESTAMP), 0,
	(SELECT uuid FROM organizations where shortName = 'ANET Administrators'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Interior'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+arthur@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+shardul@dds.mil'), @reportUuid, 1);
INSERT INTO reportTasks (taskUuid, reportUuid)
	VALUES ((SELECT uuid from tasks where shortName = '1.1.B'), @reportUuid);


-- Release all of the reports right now, so they show up in the rollup.
UPDATE reports SET releasedAt = reports.createdAt WHERE state = 2 OR state = 4;

--Create the default Approval Step
INSERT INTO approvalSteps (uuid, name, advisorOrganizationUuid, type)
	VALUES (lower(newid()), 'Default Approvers', (select uuid from organizations where shortName='ANET Administrators'), 1);
INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps where name = 'Default Approvers'), (SELECT uuid from positions where name = 'ANET Administrator'));

-- Set approvalStepUuids from organizations with default
UPDATE reports SET
approvalStepUuid = (SELECT uuid FROM approvalSteps WHERE name = 'Default Approvers')
WHERE reports.uuid IN
(SELECT reports.uuid FROM reports INNER JOIN (people INNER JOIN (organizations INNER JOIN positions ON positions.organizationUuid = organizations.uuid) ON people.uuid = positions.currentPersonUuid) ON reports.authorUuid = people.uuid WHERE approvalStepUuid IS NULL AND reports.state = 1);

--Set the Admin Settings
INSERT INTO adminSettings ([key], value)
	VALUES ('SECURITY_BANNER_TEXT', 'DEMO USE ONLY');
INSERT INTO adminSettings ([key], value)
	VALUES ('SECURITY_BANNER_COLOR', 'green');
INSERT INTO adminSettings ([key], value)
	VALUES ('DEFAULT_APPROVAL_ORGANIZATION', (select uuid from organizations where shortName='ANET Administrators'));
INSERT INTO adminSettings ([key], value)
	VALUES ('HELP_LINK_URL', 'http://google.com');
INSERT INTO adminSettings ([key], value)
	VALUES ('CONTACT_EMAIL', 'team-anet@dds.mil');
INSERT INTO adminSettings ([key], value)
	VALUES ('DAILY_ROLLUP_MAX_REPORT_AGE_DAYS', '14');
INSERT INTO adminSettings ([key], value)
	VALUES ('EXTERNAL_DOCUMENTATION_LINK_TEXT', '');
INSERT INTO adminSettings ([key], value)
	VALUES ('EXTERNAL_DOCUMENTATION_LINK_URL', '');
INSERT INTO adminSettings ([key], value)
	VALUES ('GENERAL_BANNER_TEXT', '');
INSERT INTO adminSettings ([key], value)
	VALUES ('GENERAL_BANNER_LEVEL', 'notice');
INSERT INTO adminSettings ([key], value)
	VALUES ('GENERAL_BANNER_VISIBILITY', '1');

-- Tags
INSERT INTO tags (uuid, name, description, createdAt, updatedAt)
	VALUES
  (lower(newid()), 'bribery', 'Giving/Promising money or something valuable to corrupt the behavior of a public official', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'clientelism', 'Exhange of goods or services for political support; involves quid-pro-quo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'collusion', 'A secret agreement that involves fraud', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'embezzlement', 'Steal or misappropriate money from the organization the person works for', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'extortion', 'Using force or threats to obtain money or a service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'fraud', 'Criminal deception resulting in financial personal gain', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'grand corruption', 'Abuse of high level power that benefits a few people at the expense of many', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'nepotism', 'Leaders favoring relatives or friends usually by giving them jobs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'patronage', 'Leaders illegally appointing someone to a position', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'state capture', 'Private interests that significantly influence a decision-making process for private gain', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'petty corruption', 'Every day abuse of entrusted power by low- to mid-level public officials', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (lower(newid()), 'facilitation payment', 'Payment made to a government official that acts as an incentive to complete an action quickly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Tag some reports
INSERT INTO reportTags (reportUuid, tagUuid)
  SELECT r.uuid, t.uuid
  FROM reports r, tags t
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('0', '2', '4', '6', '8', 'a', 'c', 'e')
  AND t.name = 'bribery';

INSERT INTO reportTags (reportUuid, tagUuid)
  SELECT r.uuid, t.uuid
  FROM reports r, tags t
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('0', '3', '6', '9', 'c', 'f')
  AND t.name = 'embezzlement';

INSERT INTO reportTags (reportUuid, tagUuid)
  SELECT r.uuid, t.uuid
  FROM reports r, tags t
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('1', '3', '5', '7', '9', 'b', 'd', 'f')
  AND t.name = 'patronage';

INSERT INTO reportTags (reportUuid, tagUuid)
  SELECT r.uuid, t.uuid
  FROM reports r, tags t
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('1', '4', '7', 'a', 'd')
  AND t.name = 'facilitation payment';

-- Insert report with created at and updated at date for two days before current timestamp
SET @reportUuid = lower(newid());
INSERT INTO reports (uuid, createdAt, updatedAt, locationUuid, intent, text, nextSteps, authorUuid, state, engagementDate, atmosphere, advisorOrganizationUuid, principalOrganizationUuid)
	VALUES (@reportUuid, DATEADD (day, -2, CURRENT_TIMESTAMP), DATEADD (day, -2, CURRENT_TIMESTAMP), (SELECT uuid from locations where name='General Hospital'), 'Discuss improvements in Annual Budgeting process',
	'Today I met with Edwin the dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
	'Meet with the dude again next week',
	(SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), 2, '2016-05-25', 0,
	(SELECT uuid FROM organizations where shortName = 'EF 2.1'), (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+steve@dds.mil'), @reportUuid, 1);
INSERT INTO reportPeople (personUuid, reportUuid, isPrimary)
	VALUES ((SELECT uuid FROM people where emailAddress='hunter+jack@dds.mil'), @reportUuid, 1);

-- Authorization groups
INSERT INTO authorizationGroups (uuid, name, description, status, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 1.1 positions', 'All positions related to EF 1.1', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO authorizationGroups (uuid, name, description, status, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.1 positions', 'All positions related to EF 2.1', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO authorizationGroups (uuid, name, description, status, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 2.2 positions', 'All positions related to EF 2.2', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO authorizationGroups (uuid, name, description, status, createdAt, updatedAt)
	VALUES (lower(newid()), 'Inactive positions', 'Inactive positions', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Authorization group positions
INSERT INTO authorizationGroupPositions (authorizationGroupUuid, positionUuid)
  SELECT a.uuid, p.uuid
  FROM authorizationGroups a, positions p
  WHERE a.name LIKE 'EF 1.1%'
  AND p.name LIKE 'EF 1.1%';
INSERT INTO authorizationGroupPositions (authorizationGroupUuid, positionUuid)
  SELECT a.uuid, p.uuid
  FROM authorizationGroups a, positions p
  WHERE a.name LIKE 'EF 2.1%'
  AND p.name LIKE 'EF 2.1%';
INSERT INTO authorizationGroupPositions (authorizationGroupUuid, positionUuid)
  SELECT a.uuid, p.uuid
  FROM authorizationGroups a, positions p
  WHERE a.name LIKE 'EF 2.2%'
  AND p.name LIKE 'EF 2.2%';

-- Report authorization groups
INSERT INTO reportAuthorizationGroups (reportUuid, authorizationGroupUuid)
  SELECT DISTINCT rp.reportUuid, agp.authorizationGroupUuid
  FROM reportPeople rp
  JOIN people p ON p.uuid = rp.personUuid AND rp.isPrimary = 1
  JOIN peoplePositions pp on pp.personUuid = p.uuid,
  authorizationGroupPositions agp
  WHERE pp.positionUuid = agp.positionUuid
  AND NOT EXISTS (
    SELECT *
    FROM reportAuthorizationGroups rap
    WHERE rap.reportUuid = rp.reportUuid
    AND rap.authorizationGroupUuid = agp.authorizationGroupUuid
  );

-- Add some notes and link them to the objects they relate to
DECLARE @authorUuid varchar(36);
DECLARE @noteUuid varchar(36);

SET @authorUuid = (SELECT uuid FROM people WHERE name = 'BECCABON, Rebecca');
SET @noteUuid = lower(newid());
INSERT INTO notes (uuid, authorUuid, type, text, createdAt, updatedAt)
	VALUES (@noteUuid, @authorUuid, 0, 'A really nice person to work with', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO noteRelatedObjects (noteUuid, relatedObjectType, relatedObjectUuid)
	SELECT @noteUuid, 'people', p.uuid
	FROM people p
	WHERE p.rank = 'CIV';

SET @authorUuid = (SELECT uuid FROM people WHERE name = 'DMIN, Arthur');
SET @noteUuid = lower(newid());
INSERT INTO notes (uuid, authorUuid, type, text, createdAt, updatedAt)
	VALUES (@noteUuid, @authorUuid, 0, '<em>This position should always be filled!</em>', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO noteRelatedObjects (noteUuid, relatedObjectType, relatedObjectUuid)
	SELECT @noteUuid, 'positions', p.uuid
	FROM positions p
	WHERE p.type = 3;

SET @authorUuid = (SELECT uuid FROM people WHERE name = 'ERINSON, Erin');
SET @noteUuid = lower(newid());
INSERT INTO notes (uuid, authorUuid, type, text, createdAt, updatedAt)
	VALUES (@noteUuid, @authorUuid, 0, 'Check out this report, it is really positive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO noteRelatedObjects (noteUuid, relatedObjectType, relatedObjectUuid)
	SELECT @noteUuid, 'reports', r.uuid
	FROM reports r
	WHERE r.atmosphere = 0;

SET @noteUuid = lower(newid());
INSERT INTO notes (uuid, authorUuid, type, text, createdAt, updatedAt)
	VALUES (@noteUuid, @authorUuid, 0, 'Report text contains some valuable information, especially for the next meeting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO noteRelatedObjects (noteUuid, relatedObjectType, relatedObjectUuid)
	SELECT @noteUuid, 'reports', r.uuid
	FROM reports r
	WHERE r.text LIKE 'Today%';

-- LEAVE THIS AS LAST STATEMENT
-- Truncate all the dates (on reports etc.) to dates that could have been generated by
-- Java (millisecond precision) rather than by the database itself (microsecond precision)
UPDATE reports SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3)),
    releasedAt=cast(updatedAt as datetime2(3)),
    engagementDate=cast(engagementDate as datetime2(0))
  ;
UPDATE people SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3)),
    endOfTourDate=cast(endOfTourDate as datetime2(0))
  ;
UPDATE positions SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3))
  ;
UPDATE peoplePositions SET
    createdAt=cast(createdAt as datetime2(3)),
    endedAt=cast(endedAt as datetime2(3))
  ;
UPDATE organizations SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3))
  ;
UPDATE tasks SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3)),
    plannedCompletion=cast(updatedAt as datetime2(0)),
    projectedCompletion=cast(updatedAt as datetime2(0))
  ;
UPDATE locations SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3))
  ;
UPDATE tags SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3))
  ;
UPDATE authorizationGroups SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3))
  ;
UPDATE notes SET
    createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3))
  ;
