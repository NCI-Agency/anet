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
	VALUES (lower(newid()), 'HUNTMAN, Hunter', 0, 1, 'hunter+hunter@dds.mil', '+1-412-9314', 'CIV', '', 'United States of America', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES (lower(newid()), 'NICHOLSON, Nick', 0, 0, 'hunter+nick@dds.mil', '+1-202-7324', 'CIV', '', 'nick', 'United States of America', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (uuid, name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES (lower(newid()), 'SHARTON, Shardul', 1, 1, 'hunter+shardul@dds.mil', '+99-9999-9999', 'CIV', '', 'Italy', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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

-- Put Bob into the Super User Billet in EF 1
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 1.1 SuperUser'), (SELECT uuid from people where emailAddress = 'hunter+bob@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+bob@dds.mil') WHERE name = 'EF 1.1 SuperUser';

-- Put Henry into the Super User Billet in EF 2
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.1 SuperUser'), (SELECT uuid from people where emailAddress = 'hunter+henry@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+henry@dds.mil') WHERE name = 'EF 2.1 SuperUser';

-- Rotate an advisor through a billet ending up with Jack in the EF 2 Advisor Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where emailAddress = 'hunter+erin@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+erin@dds.mil') WHERE name = 'EF 2.1 Advisor B';
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where emailAddress = 'hunter+jack@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+jack@dds.mil') WHERE name = 'EF 2.1 Advisor B';

-- Put Elizabeth into the EF 1 Advisor Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 1.1 Advisor A'), (SELECT uuid from people where emailAddress = 'hunter+liz@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+liz@dds.mil') WHERE name = 'EF 1.1 Advisor A';

-- Put Reina into the EF 2.2 Advisor Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'EF 2.2 Advisor C'), (SELECT uuid from people where emailAddress = 'hunter+reina@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+reina@dds.mil') WHERE name = 'EF 2.2 Advisor C';

-- Put Erin into the EF 2.2 Advisor Billet
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
INSERT INTO approvalSteps (uuid, advisorOrganizationUuid, name)
	VALUES (lower(newid()), (SELECT uuid from organizations where shortName='EF 1.1'), 'EF 1.1 Approvers');
INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 1.1 Approvers'), (SELECT uuid from positions where name = 'EF 1.1 SuperUser'));

-- Create the EF 2.2 approval process
DECLARE @approvalStepUuid varchar(36);
SET @approvalStepUuid = lower(newid());
INSERT INTO approvalSteps (uuid, name, advisorOrganizationUuid)
	VALUES (@approvalStepUuid, 'EF 2.2 Secondary Reviewers', (SELECT uuid from organizations where shortName='EF 2.2'));
INSERT INTO approvalSteps (uuid, name, advisorOrganizationUuid, nextStepUuid)
	VALUES (lower(newid()), 'EF 2.2 Initial Approvers', (SELECT uuid from organizations where shortName='EF 2.2'), @approvalStepUuid);

INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Super User'));
INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Advisor D'));
INSERT INTO approvers (approvalStepUuid, positionUuid)
	VALUES ((SELECT uuid from approvalSteps WHERE name='EF 2.2 Secondary Reviewers'), (SELECT uuid from positions where name = 'EF 2.2 Final Reviewer'));

INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)	VALUES (lower(newid()), 'EF 1', 'Budget and Planning', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid)
	VALUES (lower(newid()), '1.1', 'Budgeting in the MoD', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.1.A', 'Milestone the First in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.1'), (SELECT uuid from organizations where shortName='EF 1.1'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.1.B', 'Milestone the Second in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.1'), (SELECT uuid from organizations where shortName='EF 1.1'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.1.C', 'Milestone the Third in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.1'), (SELECT uuid from organizations where shortName='EF 1.1'));

INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), 'EF 1.2', 'Budgeting in the MoI', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1'), (SELECT uuid from organizations WHERE shortName='EF 1.2'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.2.A', 'Milestone the First in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.2'), (SELECT uuid from organizations where shortName='EF 1.2'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.2.B', 'Milestone the Second in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.2'), (SELECT uuid from organizations where shortName='EF 1.2'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.2.C', 'Milestone the Third in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.2'), (SELECT uuid from organizations where shortName='EF 1.2'));

INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), 'EF 1.3', 'Budgeting in the Police?', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1'), (SELECT uuid FROM organizations WHERE shortName='EF 1.3'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.3.A', 'Getting a budget in place', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.3'), (SELECT uuid from organizations where shortName='EF 1.3'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.3.B', 'Tracking your expenses', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.3'), (SELECT uuid from organizations where shortName='EF 1.3'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '1.3.C', 'Knowing when you run out of money', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 1.3'), (SELECT uuid from organizations where shortName='EF 1.3'));

INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, organizationUuid)
	VALUES (lower(newid()), 'EF 2', 'Transparency, Accountability, O (TAO)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from organizations where shortName='EF 2'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '2.A', 'This is the first Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 2'), (SELECT uuid from organizations where shortName='EF 2'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '2.B', 'This is the second Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 2'), (SELECT uuid from organizations where shortName='EF 2'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '2.C', 'This is the third Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 2'), (SELECT uuid from organizations where shortName='EF 2'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '2.D', 'Keep track of the petty cash drawer', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 2'), (SELECT uuid from organizations where shortName='EF 2'));

INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 3', 'Rule of Law', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '3.a', 'Get some Lawyers to read a book', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 3'), (SELECT uuid from organizations where shortName='EF 3'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '3.b', 'Get some Lawyers to wear a suit to court', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 3'), (SELECT uuid from organizations where shortName='EF 3'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '3.c', 'Get some Lawyers to cross-examine witnesses in a non-hostile fashion', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 3'), (SELECT uuid from organizations where shortName='EF 3'));

INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 4', 'Force Gen (Training)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.a', 'Get a website for people to apply on', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.b', 'Hire People', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.b.1', 'Get an HR team', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.b.2', 'Review resumes for hiring', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.b.3', 'Invite people to come interview', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.b.4', 'Interview candidates', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.b.5', 'Extend Job Offers to successful candidates', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt, customFieldRef1Uuid, organizationUuid)
	VALUES (lower(newid()), '4.c', 'Onboard new Employees', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from tasks where shortName = 'EF 4'), (SELECT uuid from organizations where shortName='EF 4'));
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF 5', 'Force Sustainment (Logistics)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF6', 'C2 Operations', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF7', 'Intelligence', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'EF8', 'Stratcom', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'Gender', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-N', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-S', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-E', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-W', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC-C', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (uuid, shortName, longName, category, createdAt, updatedAt)
	VALUES (lower(newid()), 'TAAC Air', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'St Johns Airport', 47.613442, -52.740936, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'Murray''s Hotel', 47.561517, -52.708760, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'Wishingwells Park', 47.560040, -52.736962, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'General Hospital', 47.571772, -52.741935, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'Portugal Cove Ferry Terminal', 47.626718, -52.857241, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'Cabot Tower', 47.570010, -52.681770, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'Fort Amherst', 47.563763, -52.680590, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'Harbour Grace Police Station', 47.705133, -53.214422, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, lat, lng, createdAt, updatedAt)
	VALUES (lower(newid()), 'Conception Bay South Police Station', 47.526784, -52.954739, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoD Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'President''s Palace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'Kabul Police Academy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'Police HQ Training Facility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'Kabul Hospital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoD Army Training Base 123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoD Location the Second', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Training Center', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Adminstrative Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Senior Executive Suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Coffee Shop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Herat Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Jalalabad Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Kandahar Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Mazar-i-Sharif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, name, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


INSERT INTO organizations (uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoD', 'Ministry of Defense', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations (uuid, shortName, longName, type, createdAt, updatedAt)
	VALUES (lower(newid()), 'MoI', 'Ministry of Interior', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO organizations (uuid, shortName, longName, type, parentOrgUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'MOD-F', 'Ministry of Defense Finances', 1,
	(SELECT uuid from organizations where shortName = 'MoD'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Minister of Defense', 'MOD-FO-00001', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Chief of Staff - MoD', 'MOD-FO-00002', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Executive Assistant to the MoD', 'MOD-FO-00003', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Planning Captain', 'MOD-FO-00004', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Director of Budgeting - MoD', 'MOD-Bud-00001', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Writer of Expenses - MoD', 'MOD-Bud-00002', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Cost Adder - MoD', 'MOD-Bud-00003', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (uuid, name, code, type, status, currentPersonUuid, organizationUuid, createdAt, updatedAt)
	VALUES (lower(newid()), 'Chief of Police', 'MOI-Pol-HQ-00001', 1, 0, NULL, (SELECT uuid FROM organizations WHERE longName LIKE 'Ministry of Interior'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Put Steve into a Tashkil and associate with the EF 1 Advisor Billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'Cost Adder - MoD'), (SELECT uuid from people where emailAddress = 'hunter+steve@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+steve@dds.mil') WHERE name = 'Cost Adder - MoD';
INSERT INTO positionRelationships (positionUuid_a, positionUuid_b, createdAt, updatedAt, deleted)
	VALUES ((SELECT uuid from positions WHERE name ='EF 1.1 Advisor A'),
	(SELECT uuid FROM positions WHERE name='Cost Adder - MoD'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- But Roger in a Tashkil and associate with the EF 2 advisor billet
INSERT INTO peoplePositions (positionUuid, personUuid, createdAt)
	VALUES ((SELECT uuid from positions where name = 'Chief of Police'), (SELECT uuid from people where emailAddress = 'hunter+roger@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonUuid = (SELECT uuid from people where emailAddress = 'hunter+roger@dds.mil') WHERE name = 'Chief of Police';
INSERT INTO positionRelationships (positionUuid_a, positionUuid_b, createdAt, updatedAt, deleted)
	VALUES ((SELECT uuid FROM positions WHERE name='EF 2.1 Advisor B'),
	(SELECT uuid from positions WHERE name ='Chief of Police'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- But Christopf in a Tashkil
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
	'keep on testing!','have reports in organizations', (SELECT uuid FROM people where domainUsername='arthur'), 2, CURRENT_TIMESTAMP, 0,
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
INSERT INTO approvalSteps (uuid, name, advisorOrganizationUuid)
	VALUES (lower(newid()), 'Default Approvers', (select uuid from organizations where shortName='ANET Administrators'));
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
    createdAt=cast(createdAt as datetime2(3))
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
