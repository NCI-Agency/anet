SET QUOTED_IDENTIFIER ON

--DROP TABLE approvers;
--DROP TABLE approvalActions;
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
--DROP TABLE DATABASECHANGELOG;
--DROP TABLE DATABASECHANGELOGLOCK;

TRUNCATE TABLE peoplePositions;
TRUNCATE TABLE approvers;
TRUNCATE TABLE approvalActions;
TRUNCATE TABLE positionRelationships;
TRUNCATE TABLE reportTasks;
TRUNCATE TABLE reportPeople;
TRUNCATE TABLE reportTags;
TRUNCATE TABLE comments;
TRUNCATE TABLE savedSearches;
TRUNCATE TABLE reportsSensitiveInformation;
TRUNCATE TABLE authorizationGroupPositions;
TRUNCATE TABLE reportAuthorizationGroups;
DELETE FROM positions;
DELETE FROM tasks WHERE customFieldRef1Id IS NOT NULL;
DELETE FROM tasks WHERE customFieldRef1Id IS NULL;
DELETE FROM reports;
DELETE FROM people;
DELETE FROM approvalSteps;
DELETE FROM locations;
DELETE FROM organizations;
DELETE FROM adminSettings;
DELETE FROM tags;
DELETE FROM authorizationGroups;

--Advisors
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES ('JACKSON, Jack', 0, 0, 'hunter+jack@dds.mil', '123-456-78960', 'OF-9', 'Jack is an advisor in EF 2.1', 'jack', 'Germany', 'MALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES ('ELIZAWELL, Elizabeth', 0, 0, 'hunter+liz@dds.mil', '+1-777-7777', 'Capt', 'Elizabeth is a test advisor we have in the database who is in EF 1.1', 'elizabeth', 'United States of America', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES ('ERINSON, Erin', 0, 0, 'hunter+erin@dds.mil', '+9-23-2323-2323', 'CIV', 'Erin is an Advisor in EF 2.2 who can release her own reports', 'erin', 'Australia', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES ('REINTON, Reina', 0, 0, 'hunter+reina@dds.mil', '+23-23-11222', 'CIV', 'Reina is an Advisor in EF 2.2', 'reina', 'Italy', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, gender, endOfTourDate, createdAt, updatedAt)
	VALUES ('DVISOR, A', 0, 0, 'hunter+aDvisor@dds.mil', '+444-44-4444', 'OF-2', 'A Divisor was born for this job', 'advisor', 'Canada', 'FEMALE', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Principals
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES ('STEVESON, Steve', 0, 1, 'hunter+steve@dds.mil', '+011-232-12324', 'LtCol', 'this is a sample person who could be a Principal!', 'Afghanistan', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES ('ROGWELL, Roger', 0, 1, 'hunter+roger@dds.mil', '+1-412-7324', 'Maj', 'Roger is another test person we have in the database', 'Afghanistan', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, country, gender, createdAt, updatedAt)
	VALUES ('TOPFERNESS, Christopf', 0, 1, 'hunter+christopf@dds.mil', '+1-422222222', 'CIV', 'Christopf works in the MoD Office', 'Afghanistan', 'MALE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Super Users
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, endOfTourDate, createdAt, updatedAt)
	VALUES ('BOBTOWN, Bob', 0, 0, 'hunter+bob@dds.mil', '+1-444-7324', 'CIV', 'Bob is a Super User in EF 1.1', 'bob', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, endOfTourDate, createdAt, updatedAt)
	VALUES ('HENDERSON, Henry', 0, 0, 'hunter+henry@dds.mil', '+2-456-7324', 'BGen', 'Henry is a Super User in EF 2.1', 'henry', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, endOfTourDate, createdAt, updatedAt)
	VALUES ('JACOBSON, Jacob', 0, 0, 'hunter+jacob@dds.mil', '+2-456-7324', 'CIV', 'Jacob is a Super User in EF 2.2', 'jacob', 'Italy', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, country, endOfTourDate, createdAt, updatedAt)
	VALUES ('BECCABON, Rebecca', 0, 0, 'hunter+rebecca@dds.mil', '+2-456-7324', 'CTR', 'Rebecca is a Super User in EF 2.2', 'rebecca', 'Germany', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, createdAt, endOfTourDate, updatedAt)
	VALUES ('ANDERSON, Andrew', 0, 0, 'hunter+andrew@dds.mil', '+1-412-7324', 'CIV', 'Andrew is the EF 1 Manager', 'andrew', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Administrator
INSERT INTO people (name, status, role, emailAddress, domainUsername, rank, country, biography, endOfTourDate, createdAt, updatedAt)
	VALUES ('DMIN, Arthur', '0', '0', 'hunter+arthur@dds.mil', 'arthur', 'CIV', 'Albania', 'An administrator', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

--People
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, createdAt, updatedAt)
	VALUES ('HUNTMAN, Hunter', 0, 1, 'hunter+hunter@dds.mil', '+1-412-9314', 'CIV', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, domainUsername, endOfTourDate, createdAt, updatedAt)
	VALUES ('NICHOLSON, Nick', 0, 0, 'hunter+nick@dds.mil', '+1-202-7324', 'CIV', '', 'nick', DATEADD(year, 1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO people (name, status, role, emailAddress, phoneNumber, rank, biography, createdAt, updatedAt)
	VALUES ('SHARTON, Shardul', 1, 1, 'hunter+shardul@dds.mil', '+99-9999-9999', 'CIV', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('ANET Administrator', 3, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1 Manager', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor A', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor B', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor C', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor D', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor E', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor F', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor for Agriculture', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Old Inactive Advisor', 0, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor for Mining', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor for Space Issues', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 Advisor for Interagency Advising', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 1.1 SuperUser', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.1 Advisor B', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.1 Advisor for Accounting', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.1 Advisor for Kites', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.1 SuperUser', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.2 Advisor C', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.2 Advisor D', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.2 Old and Inactive', 0, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.2 Advisor Sewing Facilities', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.2 Advisor Local Kebabs', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.2 Super User', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 2.2 Final Reviewer', 2, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 4.1 Advisor E', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 4.1 Advisor for Coffee', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 4.1 Advisor on Software Engineering', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 4.1 Advisor E', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 4.1 Advisor old - dont use', 0, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, type, status, currentPersonId, createdAt, updatedAt) VALUES ('EF 9 Advisor <empty>', 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- Put Andrew in the EF 1 Manager Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 1 Manager'), (SELECT id from people where emailAddress = 'hunter+andrew@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+andrew@dds.mil') WHERE name = 'EF 1 Manager';

-- Put Bob into the Super User Billet in EF 1
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 1.1 SuperUser'), (SELECT id from people where emailAddress = 'hunter+bob@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+bob@dds.mil') WHERE name = 'EF 1.1 SuperUser';

-- Put Henry into the Super User Billet in EF 2
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 2.1 SuperUser'), (SELECT id from people where emailAddress = 'hunter+henry@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+henry@dds.mil') WHERE name = 'EF 2.1 SuperUser';

-- Rotate an advisor through a billet ending up with Jack in the EF 2 Advisor Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 2.1 Advisor B'), (SELECT id from people where emailAddress = 'hunter+erin@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+erin@dds.mil') WHERE name = 'EF 2.1 Advisor B';
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 2.1 Advisor B'), (SELECT id from people where emailAddress = 'hunter+jack@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+jack@dds.mil') WHERE name = 'EF 2.1 Advisor B';

-- Put Elizabeth into the EF 1 Advisor Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 1.1 Advisor A'), (SELECT id from people where emailAddress = 'hunter+liz@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+liz@dds.mil') WHERE name = 'EF 1.1 Advisor A';

-- Put Reina into the EF 2.2 Advisor Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 2.2 Advisor C'), (SELECT id from people where emailAddress = 'hunter+reina@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+reina@dds.mil') WHERE name = 'EF 2.2 Advisor C';

-- Put Erin into the EF 2.2 Advisor Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 2.2 Advisor D'), (SELECT id from people where emailAddress = 'hunter+erin@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+erin@dds.mil') WHERE name = 'EF 2.2 Advisor D';

-- Put Jacob in the EF 2.2 Super User Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 2.2 Super User'), (SELECT id from people where emailAddress = 'hunter+jacob@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+jacob@dds.mil') WHERE name = 'EF 2.2 Super User';

-- Put Rebecca in the EF 2.2 Final Reviewer Position
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'EF 2.2 Final Reviewer'), (SELECT id from people where emailAddress = 'hunter+rebecca@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+rebecca@dds.mil') WHERE name = 'EF 2.2 Final Reviewer';

-- Put Arthur into the Admin Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'ANET Administrator'), (SELECT id from people where emailAddress = 'hunter+arthur@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+arthur@dds.mil') WHERE name = 'ANET Administrator';


INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('ANET Administrators','', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF 1', 'Planning Programming, Budgeting and Execution', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 1.1', '',0, (SELECT id from organizations WHERE shortName ='EF 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF 2', '',0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 2.1', '', 0, (SELECT id from organizations WHERE shortName ='EF 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 2.2', '', 0, (SELECT id from organizations WHERE shortName ='EF 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF 3', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF 4', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 4.1', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 4.2', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 4.3', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 4.4', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF 5', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 5.1', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 5.2', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 5.3', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 5.4', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF 6', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 6.1', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 6'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
	INSERT INTO organizations(shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('EF 6.2', '', 0 , (SELECT id FROM organizations WHERE shortName = 'EF 6'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF7', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF8', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('EF9', 'Gender', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('TAAC-N', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('TAAC-S', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('TAAC-W', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('TAAC-E', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('TAAC-C', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations(shortName, longName, type, createdAt, updatedAt) VALUES ('TAAC Air', '', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE positions SET organizationId = (SELECT id FROM organizations WHERE shortName ='EF 1') WHERE name LIKE 'EF 1 %';
UPDATE positions SET organizationId = (SELECT id FROM organizations WHERE shortName ='EF 1.1') WHERE name LIKE 'EF 1.1%';
UPDATE positions SET organizationId = (SELECT id FROM organizations WHERE shortName ='EF 2.1') WHERE name LIKE 'EF 2.1%';
UPDATE positions SET organizationId = (SELECT id FROM organizations WHERE shortName ='EF 2.2') WHERE name LIKE 'EF 2.2%';
UPDATE positions SET organizationId = (SELECT id FROM organizations WHERE shortName ='EF 3') WHERE name LIKE 'EF 3%';
UPDATE positions SET organizationId = (SELECT id FROM organizations WHERE shortName ='EF 4') WHERE name LIKE 'EF 4%';
UPDATE positions SET organizationId = (SELECT id FROM organizations WHERE shortName='ANET Administrators') where name = 'ANET Administrator';

-- Create the EF 1.1 approval process
INSERT INTO approvalSteps (advisorOrganizationId, name) VALUES
	((SELECT id from organizations where shortName='EF 1.1'), 'EF 1.1 Approvers');
INSERT INTO approvers (approvalStepId, positionId) VALUES
	((SELECT id from approvalSteps WHERE name='EF 1.1 Approvers'), (SELECT id from positions where name = 'EF 1.1 SuperUser'));

-- Create the EF 2.2 approval process
INSERT INTO approvalSteps (name, advisorOrganizationId) VALUES
	('EF 2.2 Secondary Reviewers', (SELECT id from organizations where shortName='EF 2.2'));
INSERT INTO approvalSteps (name, advisorOrganizationId, nextStepId) VALUES
	('EF 2.2 Initial Approvers', (SELECT id from organizations where shortName='EF 2.2'), (SELECT MAX(id) from approvalSteps));

INSERT INTO approvers (approvalStepId, positionId) VALUES
	((SELECT id from approvalSteps WHERE name='EF 2.2 Initial Approvers'), (SELECT id from positions where name = 'EF 2.2 Super User'));
INSERT INTO approvers (approvalStepId, positionId) VALUES
	((SELECT id from approvalSteps WHERE name='EF 2.2 Initial Approvers'), (SELECT id from positions where name = 'EF 2.2 Advisor D'));
INSERT INTO approvers (approvalStepId, positionId) VALUES
	((SELECT id from approvalSteps WHERE name='EF 2.2 Secondary Reviewers'), (SELECT id from positions where name = 'EF 2.2 Final Reviewer'));

INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt)	VALUES ('EF 1', 'Budget and Planning', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id)
	VALUES ('1.1', 'Budgeting in the MoD', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.1.A', 'Milestone the First in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.1'), (SELECT id from organizations where shortName='EF 1.1'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.1.B', 'Milestone the Second in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.1'), (SELECT id from organizations where shortName='EF 1.1'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.1.C', 'Milestone the Third in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.1'), (SELECT id from organizations where shortName='EF 1.1'));

INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('EF 1.2', 'Budgeting in the MoI', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1'), (SELECT id from organizations WHERE shortName='EF 1.2'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.2.A', 'Milestone the First in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.2'), (SELECT id from organizations where shortName='EF 1.2'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.2.B', 'Milestone the Second in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.2'), (SELECT id from organizations where shortName='EF 1.2'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.2.C', 'Milestone the Third in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.2'), (SELECT id from organizations where shortName='EF 1.2'));

INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('EF 1.3', 'Budgeting in the Police?', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1'), (SELECT id FROM organizations WHERE shortName='EF 1.3'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.3.A', 'Getting a budget in place', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.3'), (SELECT id from organizations where shortName='EF 1.3'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.3.B', 'Tracking your expenses', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.3'), (SELECT id from organizations where shortName='EF 1.3'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('1.3.C', 'Knowing when you run out of money', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 1.3'), (SELECT id from organizations where shortName='EF 1.3'));

INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, organizationId)
	VALUES ('EF 2', 'Transparency, Accountability, O (TAO)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from organizations where shortName='EF 2'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('2.A', 'This is the first Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 2'), (SELECT id from organizations where shortName='EF 2'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('2.B', 'This is the second Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 2'), (SELECT id from organizations where shortName='EF 2'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('2.C', 'This is the third Milestone in EF 2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 2'), (SELECT id from organizations where shortName='EF 2'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('2.D', 'Keep track of the petty cash drawer', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 2'), (SELECT id from organizations where shortName='EF 2'));

INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('EF 3', 'Rule of Law', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('3.a', 'Get some Lawyers to read a book', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 3'), (SELECT id from organizations where shortName='EF 3'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('3.b', 'Get some Lawyers to wear a suit to court', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 3'), (SELECT id from organizations where shortName='EF 3'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('3.c', 'Get some Lawyers to cross-examine witnesses in a non-hostile fashion', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 3'), (SELECT id from organizations where shortName='EF 3'));

INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('EF 4', 'Force Gen (Training)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.a', 'Get a website for people to apply on', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.b', 'Hire People', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.b.1', 'Get an HR team', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.b.2', 'Review resumes for hiring', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.b.3', 'Invite people to come interview', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.b.4', 'Interview candidates', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.b.5', 'Extend Job Offers to successful candidates', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt, customFieldRef1Id, organizationId)
	VALUES ('4.c', 'Onboard new Employees', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from tasks where shortName = 'EF 4'), (SELECT id from organizations where shortName='EF 4'));
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('EF 5', 'Force Sustainment (Logistics)', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('EF6', 'C2 Operations', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('EF7', 'Intelligence', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('EF8', 'Stratcom', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('Gender', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('TAAC-N', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('TAAC-S', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('TAAC-E', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('TAAC-W', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('TAAC-C', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO tasks (shortName, longName, category, createdAt, updatedAt) VALUES ('TAAC Air', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('St Johns Airport', 47.613442, -52.740936, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('Murray''s Hotel', 47.561517, -52.708760, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('Wishingwells Park', 47.560040, -52.736962, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('General Hospital', 47.571772, -52.741935, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('Portugal Cove Ferry Terminal', 47.626718, -52.857241, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('Cabot Tower', 47.570010, -52.681770, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('Fort Amherst', 47.563763, -52.680590, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('Harbour Grace Police Station', 47.705133, -53.214422, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, lat, lng, createdAt, updatedAt) VALUES('Conception Bay South Police Station', 47.526784, -52.954739, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoD Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('President''s Palace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('Kabul Police Academy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('Police HQ Training Facility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('Kabul Hospital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoD Army Training Base 123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoD Location the Second', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Training Center', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Adminstrative Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Senior Executive Suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Coffee Shop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Herat Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Jalalabad Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Kandahar Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Mazar-i-Sharif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (name, createdAt, updatedAt) VALUES ('MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


INSERT INTO organizations (shortName, longName, type, createdAt, updatedAt) VALUES ('MoD', 'Ministry of Defense', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO organizations (shortName, longName, type, createdAt, updatedAt) VALUES ('MoI', 'Ministry of Interior', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO organizations (shortName, longName, type, parentOrgId, createdAt, updatedAt) VALUES ('MOD-F', 'Ministry of Defense Finances', 1,
	(SELECT id from organizations where shortName = 'MoD'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Minister of Defense', 'MOD-FO-00001', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Chief of Staff - MoD', 'MOD-FO-00002', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Executive Assistant to the MoD', 'MOD-FO-00003', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Planning Captain', 'MOD-FO-00004', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Director of Budgeting - MoD', 'MOD-Bud-00001', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Writer of Expenses - MoD', 'MOD-Bud-00002', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Cost Adder - MoD', 'MOD-Bud-00003', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO positions (name, code, type, status, currentPersonId, organizationId, createdAt, updatedAt)
	VALUES ('Chief of Police', 'MOI-Pol-HQ-00001', 1, 0, NULL, (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Interior'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Put Steve into a Tashkil and associate with the EF 1 Advisor Billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'Cost Adder - MoD'), (SELECT id from people where emailAddress = 'hunter+steve@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+steve@dds.mil') WHERE name = 'Cost Adder - MoD';
INSERT INTO positionRelationships (positionId_a, positionId_b, createdAt, updatedAt, deleted) VALUES
	((SELECT id from positions WHERE name ='EF 1.1 Advisor A'),
	(SELECT id FROM positions WHERE name='Cost Adder - MoD'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- But Roger in a Tashkil and associate with the EF 2 advisor billet
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'Chief of Police'), (SELECT id from people where emailAddress = 'hunter+roger@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+roger@dds.mil') WHERE name = 'Chief of Police';
INSERT INTO positionRelationships (positionId_a, positionId_b, createdAt, updatedAt, deleted) VALUES
	((SELECT id FROM positions WHERE name='EF 2.1 Advisor B'),
	(SELECT id from positions WHERE name ='Chief of Police'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- But Christopf in a Tashkil
INSERT INTO peoplePositions (positionId, personId, createdAt) VALUES
	((SELECT id from positions where name = 'Planning Captain'), (SELECT id from people where emailAddress = 'hunter+christopf@dds.mil'), CURRENT_TIMESTAMP);
UPDATE positions SET currentPersonId = (SELECT id from people where emailAddress = 'hunter+christopf@dds.mil') WHERE name = 'Planning Captain';
INSERT INTO positionRelationships (positionId_a, positionId_b, createdAt, updatedAt, deleted) VALUES
	((SELECT id FROM positions WHERE name='EF 2.2 Advisor D'),
	(SELECT id from positions WHERE name ='Planning Captain'),
	CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);


UPDATE positions SET locationId = (SELECT id from LOCATIONS where name = 'Kabul Police Academy') WHERE name = 'Chief of Police';
UPDATE positions SET locationId = (SELECT id from LOCATIONS where name = 'MoD Headquarters Kabul') WHERE name = 'Cost Adder - MoD';

--Write a couple reports!
INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='General Hospital'), 'Discuss improvements in Annual Budgeting process',
	'Today I met with this dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
	'Meet with the dude again next week',
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), 2, '2016-05-25', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, keyOutcomes, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select id from locations where name='General Hospital'), 'Run through FY2016 Numbers on tool usage',
	'Today we discussed the fiscal details of how spreadsheets break down numbers into rows and columns and then text is used to fill up space on a web page, it was very interesting and other adjectives',
	'we read over the spreadsheets for the FY17 Budget',
	'meet with him again :(', (SELECT id FROM people where domainUsername='jack'), 2, '2016-06-01', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) from reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+roger@dds.mil'), (SELECT max(id) from reports), 0);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.A'), (SELECT max(id) from reports));
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.B'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, keyOutcomes, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select id from locations where name='Kabul Hospital'), 'Looked at Hospital usage of Drugs',
	'This report needs to fill up more space',
	'putting something in the database to take up space',
	'to be more creative next time', (SELECT id FROM people where domainUsername='jack'), 2, '2016-06-03', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) from reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.C'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, keyOutcomes, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select id from locations where name='Kabul Hospital'), 'discuss enagement of Doctors with Patients',
	'Met with Nobody in this engagement and discussed no tasks, what a waste of time',
	'None',
	'Head over to the MoD Headquarters buildling for the next engagement', (SELECT id FROM people where domainUsername='jack'), 2, '2016-06-10', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) from reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.A'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, authorId, state, releasedAt, engagementDate, atmosphere, atmosphereDetails, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select id from locations where name='MoD Headquarters Kabul'), 'Meet with Leadership regarding monthly status update',
	'This engagement was sooooo interesting',
	'Meet up with Roger next week to look at the numbers on the charts', (SELECT id FROM people where domainUsername='jack'), 2,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2, 'Guy was grumpy',
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) from reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+bob@dds.mil'), (SELECT max(id) from reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.B'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, keyOutcomes, nextSteps, authorId, state, releasedAt, engagementDate, atmosphere, atmosphereDetails, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select id from locations where name='Fort Amherst'), 'Inspect Ft Amherst Medical Budgeting Facility?',
	'Went over to the fort to look at the beds and the spreadsheets and the numbers and the whiteboards and the planning and all of the budgets. It was GREAT!',
	'Seeing the whiteboards firsthand',
	'head to Cabot Tower and inspect their whiteboards next week', (SELECT id FROM people where domainUsername='jack'), 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'Very good tea',
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+roger@dds.mil'), (SELECT max(id) from reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.A'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select id from locations where name='Cabot Tower'), 'Inspect Cabot Tower Budgeting Facility',
	'Looked over the places around Cabot Tower for all of the things that people do when they need to do math.  There were calculators, and slide rules, and paper, and computers',
	'keep writing fake reports to fill the database!!!', (SELECT id FROM people where domainUsername='jack'), 1, '2016-06-20', 1,
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) from reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.C'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='General Hospital'), 'Discuss discrepancies in monthly budgets',
	'Back to the hospital this week to test the recent locations feature of ANET, and also to look at math and numbers and budgets and things',
	'Meet with the dude again next week',(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), 1, '2016-06-25', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.A'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='St Johns Airport'), 'Inspect Air Operations Capabilities',
	'We went to the Aiport and looked at the planes, and the hangers, and the other things that airports have. ',
	'Go over to the Airport next week to look at the helicopters',(SELECT id FROM people where domainUsername='elizabeth'), 2, '2016-05-20', 0,
	(SELECT id FROM organizations where shortName = 'EF 1.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+roger@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+liz@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '2.A'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='St Johns Airport'), 'Inspect Helicopter Capabilities',
	'Today we looked at the helicopters at the aiport and talked in depth about how they were not in good condition and the AAF needed new equipment.  I expressed my concerns to the pilots and promised to see what we can do.',
	'Figure out what can be done about the helicopters',(SELECT id FROM people where domainUsername='elizabeth'), 2, '2016-05-22', 0,
	(SELECT id FROM organizations where shortName = 'EF 1.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+roger@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+liz@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '2.A'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, keyOutcomes, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='General Hospital'), 'Look for Budget Controls',
	'Goal of the meeting was to look for the word spreadsheet in a report and then return that in a search result about budget. Lets see what happens!!',
	'Searching for text', 'Test Cases are good', (SELECT id FROM people where domainUsername='erin'), 2, '2017-01-14', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.2'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+christopf@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+erin@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+reina@dds.mil'), (SELECT max(id) FROM reports), 0);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.B'), (SELECT max(id) from reports));
INSERT INTO reportsSensitiveInformation (createdAt, updatedAt, text, reportId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Need to know only', (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, keyOutcomes, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='General Hospital'), 'Look for Budget Controls Again',
	'The search for the spreadsheet was doomed to be successful, so we needed to generate more data in order to get a more full test of the system that really is going to have much much larger reports in it one day.',
	'Mocking up test cases','Better test data is always better', (SELECT id FROM people where domainUsername='erin'), 2, '2017-01-04', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.2'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+christopf@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+erin@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.B'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, keyOutcomes, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='General Hospital'), 'Talk to the Interior about things',
	'We know that we want to go to the house with the food and eat the food, but the words in the database need to be long enough to do something. What that is were not sure, but we know we cant use apostrophies or spell.  Wow, we really cant do much, right? It was decided that we would do more tomorrow.',
	'Mocking up test cases','Looking at the telescope with our eyes', (SELECT id FROM people where domainUsername='erin'), 2, '2017-01-04', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.2'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Interior'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+christopf@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+erin@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.B'), (SELECT max(id) from reports));

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, keyOutcomes, authorId, state, engagementDate, atmosphere, cancelledReason, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='General Hospital'), 'Weekly Checkin with MG Somebody',
	'Meeting got cancelled',
	'Reschedule Meeting','', (SELECT id FROM people where domainUsername='erin'), 4, CURRENT_TIMESTAMP, 0, 1, 
	(SELECT id FROM organizations where shortName = 'EF 2.2'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Interior'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+erin@dds.mil'), (SELECT max(id) FROM reports), 1);

INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, keyOutcomes, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id from locations where name='General Hospital'), 'A test report from Arthur', '',
	'keep on testing!','have reports in organizations', (SELECT id FROM people where domainUsername='arthur'), 2, CURRENT_TIMESTAMP, 0,
	(SELECT id FROM organizations where shortName = 'ANET Administrators'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Interior'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+arthur@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+shardul@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportTasks (taskId, reportId) VALUES ((SELECT id from tasks where shortName = '1.1.B'), (SELECT max(id) from reports));


-- Release all of the reports right now, so they show up in the rollup. 
UPDATE reports SET releasedAt = reports.createdAt WHERE state = 2 OR state = 4;

--Create the default Approval Step
INSERT INTO approvalSteps (name, advisorOrganizationId) VALUES ('Default Approvers', (select id from organizations where shortName='ANET Administrators'));
INSERT INTO approvers (approvalStepId, positionId) VALUES ((SELECT id from approvalSteps where name = 'Default Approvers'), (SELECT id from positions where name = 'ANET Administrator'));

-- Set approvalStepId's from organizations with default
UPDATE reports SET
approvalStepId = (SELECT id FROM approvalSteps WHERE name = 'Default Approvers')
WHERE reports.id IN
(SELECT reports.id FROM reports INNER JOIN (people INNER JOIN (organizations INNER JOIN positions ON positions.organizationId = organizations.id) ON people.id = positions.currentPersonId) ON reports.authorId = people.id WHERE approvalStepId IS NULL AND reports.state = 1);

--Set the Admin Settings
INSERT INTO adminSettings ([key], value) VALUES ('SECURITY_BANNER_TEXT', 'DEMO USE ONLY');
INSERT INTO adminSettings ([key], value) VALUES ('SECURITY_BANNER_COLOR', 'green');
INSERT INTO adminSettings ([key], value) VALUES ('DEFAULT_APPROVAL_ORGANIZATION', (select CAST(id AS varchar) from organizations where shortName='ANET Administrators'));
INSERT INTO adminSettings ([key], value) VALUES ('HELP_LINK_URL', 'http://google.com');
INSERT INTO adminSettings ([key], value) VALUES ('CONTACT_EMAIL', 'team-anet@dds.mil');
INSERT INTO adminSettings ([key], value) VALUES ('DAILY_ROLLUP_MAX_REPORT_AGE_DAYS', '14');
INSERT INTO adminSettings ([key], value) VALUES ('EXTERNAL_DOCUMENTATION_LINK_TEXT', '');
INSERT INTO adminSettings ([key], value) VALUES ('EXTERNAL_DOCUMENTATION_LINK_URL', '');
INSERT INTO adminSettings ([key], value) VALUES ('GENERAL_BANNER_TEXT', '');
INSERT INTO adminSettings ([key], value) VALUES ('GENERAL_BANNER_LEVEL', 'notice');
INSERT INTO adminSettings ([key], value) VALUES ('GENERAL_BANNER_VISIBILITY', '1');

-- Tags
INSERT INTO tags (name, description, createdAt, updatedAt) VALUES
  ('bribery', 'Giving/Promising money or something valuable to corrupt the behavior of a public official', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('clientelism', 'Exhange of goods or services for political support; involves quid-pro-quo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('collusion', 'A secret agreement that involves fraud', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('embezzlement', 'Steal or misappropriate money from the organization the person works for', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('extortion', 'Using force or threats to obtain money or a service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fraud', 'Criminal deception resulting in financial personal gain', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('grand corruption', 'Abuse of high level power that benefits a few people at the expense of many', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('nepotism', 'Leaders favoring relatives or friends usually by giving them jobs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('patronage', 'Leaders illegally appointing someone to a position', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('state capture', 'Private interests that significantly influence a decision-making process for private gain', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('petty corruption', 'Every day abuse of entrusted power by low- to mid-level public officials', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('facilitation payment', 'Payment made to a government official that acts as an incentive to complete an action quickly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Tag some reports
INSERT INTO reportTags (reportId, tagId)
  SELECT r.id, t.id
  FROM reports r, tags t
  WHERE r.id % 2 = 0
  AND t.name = 'bribery';

INSERT INTO reportTags (reportId, tagId)
  SELECT r.id, t.id
  FROM reports r, tags t
  WHERE r.id % 3 = 0
  AND t.name = 'embezzlement';

INSERT INTO reportTags (reportId, tagId)
  SELECT r.id, t.id
  FROM reports r, tags t
  WHERE r.id % 2 = 1
  AND t.name = 'patronage';

INSERT INTO reportTags (reportId, tagId)
  SELECT r.id, t.id
  FROM reports r, tags t
  WHERE r.id % 3 = 1
  AND t.name = 'facilitation payment';

-- Insert report with created at and updated at date for two days before current timestamp
INSERT INTO reports (createdAt, updatedAt, locationId, intent, text, nextSteps, authorId, state, engagementDate, atmosphere, advisorOrganizationId, principalOrganizationId) VALUES
	(DATEADD (day, -2, CURRENT_TIMESTAMP), DATEADD (day, -2, CURRENT_TIMESTAMP), (SELECT id from locations where name='General Hospital'), 'Discuss improvements in Annual Budgeting process',
	'Today I met with Edwin the dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
	'Meet with the dude again next week',
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), 2, '2016-05-25', 0,
	(SELECT id FROM organizations where shortName = 'EF 2.1'), (SELECT id FROM organizations WHERE longName LIKE 'Ministry of Defense'));
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+steve@dds.mil'), (SELECT max(id) FROM reports), 1);
INSERT INTO reportPeople (personId, reportId, isPrimary) VALUES (
	(SELECT id FROM people where emailAddress='hunter+jack@dds.mil'), (SELECT max(id) FROM reports), 1);

-- Authorization groups
INSERT INTO authorizationGroups (name, description, status, createdAt, updatedAt)
	VALUES ('EF 1.1 positions', 'All positions related to EF 1.1', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO authorizationGroups (name, description, status, createdAt, updatedAt)
	VALUES ('EF 2.1 positions', 'All positions related to EF 2.1', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO authorizationGroups (name, description, status, createdAt, updatedAt)
	VALUES ('EF 2.2 positions', 'All positions related to EF 2.2', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO authorizationGroups (name, description, status, createdAt, updatedAt)
	VALUES ('Inactive positions', 'Inactive positions', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Authorization group positions
INSERT INTO authorizationGroupPositions (authorizationGroupId, positionId)
  SELECT a.id, p.id
  FROM authorizationGroups a, positions p
  WHERE a.name LIKE 'EF 1.1%'
  AND p.name LIKE 'EF 1.1%';
INSERT INTO authorizationGroupPositions (authorizationGroupId, positionId)
  SELECT a.id, p.id
  FROM authorizationGroups a, positions p
  WHERE a.name LIKE 'EF 2.1%'
  AND p.name LIKE 'EF 2.1%';
INSERT INTO authorizationGroupPositions (authorizationGroupId, positionId)
  SELECT a.id, p.id
  FROM authorizationGroups a, positions p
  WHERE a.name LIKE 'EF 2.2%'
  AND p.name LIKE 'EF 2.2%';

-- Report authorization groups
INSERT INTO reportAuthorizationGroups (reportId, authorizationGroupId)
  SELECT DISTINCT rp.reportId, agp.authorizationGroupId
  FROM reportPeople rp
  JOIN people p ON p.id = rp.personId AND rp.isPrimary = 1
  JOIN peoplePositions pp on pp.personId = p.id,
  authorizationGroupPositions agp
  WHERE pp.positionId = agp.positionId
  AND NOT EXISTS (
    SELECT *
    FROM reportAuthorizationGroups rap
    WHERE rap.reportId = rp.reportId
    AND rap.authorizationGroupId = agp.authorizationGroupId
  );

-- LEAVE THIS AS LAST STATEMENT
-- Truncate all the dates on reports to dates that could have been generated by
-- Java (millisecond precision) rather than by the database itself (microsecond precision)
UPDATE reports
  SET createdAt=cast(createdAt as datetime2(3)),
    updatedAt=cast(updatedAt as datetime2(3)),
    engagementDate=cast(engagementDate as datetime2(0))
  ;
