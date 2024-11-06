-- Do a cascading TRUNCATE of all tables created for ANET
TRUNCATE TABLE "accessTokens" CASCADE;
TRUNCATE TABLE "adminSettings" CASCADE;
TRUNCATE TABLE "approvalSteps" CASCADE;
TRUNCATE TABLE "approvers" CASCADE;
TRUNCATE TABLE "attachments" CASCADE;
TRUNCATE TABLE "attachmentRelatedObjects" CASCADE;
TRUNCATE TABLE "authorizationGroupRelatedObjects" CASCADE;
TRUNCATE TABLE "authorizationGroups" CASCADE;
TRUNCATE TABLE "comments" CASCADE;
TRUNCATE TABLE "customSensitiveInformation" CASCADE;
TRUNCATE TABLE "emailAddresses" CASCADE;
TRUNCATE TABLE "entityAvatars" CASCADE;
TRUNCATE TABLE "jobHistory" CASCADE;
TRUNCATE TABLE "locationRelationships" CASCADE;
TRUNCATE TABLE "mergedEntities" CASCADE;
TRUNCATE TABLE "noteRelatedObjects" CASCADE;
TRUNCATE TABLE "notes" CASCADE;
TRUNCATE TABLE "organizationAdministrativePositions" CASCADE;
TRUNCATE TABLE "organizations" CASCADE;
TRUNCATE TABLE "pendingEmails" CASCADE;
TRUNCATE TABLE "people" CASCADE;
TRUNCATE TABLE "peoplePositions" CASCADE;
TRUNCATE TABLE "positionRelationships" CASCADE;
TRUNCATE TABLE "positions" CASCADE;
TRUNCATE TABLE "reportActions" CASCADE;
TRUNCATE TABLE "reportAuthorizationGroups" CASCADE;
TRUNCATE TABLE "reportPeople" CASCADE;
TRUNCATE TABLE "reportTasks" CASCADE;
TRUNCATE TABLE "reports" CASCADE;
TRUNCATE TABLE "reportsSensitiveInformation" CASCADE;
TRUNCATE TABLE "savedSearches" CASCADE;
TRUNCATE TABLE "subscriptionUpdates" CASCADE;
TRUNCATE TABLE "subscriptions" CASCADE;
TRUNCATE TABLE "taskResponsiblePositions" CASCADE;
TRUNCATE TABLE "taskTaskedOrganizations" CASCADE;
TRUNCATE TABLE "tasks" CASCADE;
TRUNCATE TABLE "userActivities" CASCADE;

-- Countries are inserted by the migrations!
DELETE FROM "locations" WHERE type != 'PAC';

-- Make sure everything is in UTC
SET time zone 'UTC';

-- Create people
INSERT INTO people (uuid, name, status, "phoneNumber", rank, biography, "user", "domainUsername", "openIdSubject", "countryUuid", gender, "endOfTourDate", "createdAt", "updatedAt") VALUES
-- Advisors
  ('b5d495af-44d5-4c35-851a-1039352a8307', 'Jackson, Jack', 0, '123-456-78960', 'OF-9', 'Jack is an advisor in EF 2.1', true, 'jack', '89003390-168e-4dc3-a582-5b38ae264bdd', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Germany'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a9d65d96-d107-45c3-bbaa-1133a354335b', 'Elizawell, Elizabeth', 0, '+1-777-7777', 'OF-2', 'Elizabeth is a test advisor we have in the database who is in EF 1.1', true, 'elizabeth', '06547ee2-dcc3-420c-96cb-5f3bb3793b4d', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00b19ebf-0d4d-4b0f-93c8-9023ccb59c49', 'Solenoid, Selena', 0, '+1-111-1111', 'CIV', 'Selena is a test advisor in EF 1.2', true, 'selena', 'ce1df48e-fd6e-4dc4-bc00-9bb65a0d6910', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 'Erinson, Erin', 0, '+9-23-2323-2323', 'CIV', 'Erin is an Advisor in EF 2.2 who can approve reports', true, 'erin', '04c29bab-7b20-4ff2-8583-8ad3dbcff4d6', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Australia'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1ad0c049-6ce8-4890-84f6-5e6a364764c4', 'Reinton, Reina', 0, '+23-23-11222', 'CIV', 'Reina is an Advisor in EF 2.2', true, 'reina', '5b585887-1c3d-4f47-bccb-cdfebfd6e919', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Italy'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('39d02d26-49eb-43b5-9cec-344777213a67', 'Dvisor, A', 0, '+444-44-4444', 'OF-2', 'A Dvisor was born for this job', true, 'advisor', 'd09a55cf-6aa4-4bbf-8bf3-055ddcb4d27c', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('31cba227-f6c6-49e9-9483-fce441bea624', 'Bratton, Creed', 0, '+444-44-4444', 'CIV', 'Let me first settle in.', true, 'creed', 'efad3f0d-3cd0-40fc-ac7e-90a1fa343e89', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d4e1ae87-e519-4ec6-b0a4-5c3b19a0183e', 'Malone, Kevin', 0, '+444-44-4444', 'CIV', 'Sometimes numbers just dont add up.', true, 'kevin', 'cf05120c-bb43-408f-93ac-609c996a9da5', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('02fdbd68-866f-457a-990c-fbd79bc9b96c', 'Guist, Lin', 0, '+444-44-4444', 'CIV', 'Lin can speak so many languages', true, 'lin', 'd8d9eb8f-acfd-40fa-91c7-1ddc4401b8da', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bcd9d5e4-bf6c-42de-9246-8116f2b23bdc', 'Preter, Inter', 0, '+444-44-4444', 'CIV', 'Inter is fluent in various languages', true, 'inter', '7a17af5d-7863-47b5-8034-4e2f79f3fa0b', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c71f707a-667f-4713-9552-8510d69a308b', 'Rogers, Ben', 0, '+99-9999-9999', 'CIV', NULL, true, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Italy'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c033862b-a4ef-4043-acd5-a2b399a10f00', 'Rivers, Kevin', 0, '+99-9999-9999', 'CIV', NULL, true, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Italy'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Advisors with no position for testing
  ('bdd91de7-09c7-4f09-97e4-d3325bb92dab', 'Noposition, Ihave', 0, '+444-44-4545', 'OF-2', 'I need a career change', true, 'nopos', 'e88f6157-61bf-4d43-96eb-f65a91d927c0', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('7914ceba-7f89-493b-bd03-eee7e19c60a8', 'Reportguy, Ima', 0, '+444-44-4545', 'CIV', 'I need a career change', true, 'reportguy', NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'France'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d9f3ee10-6e01-4d57-9916-67978608e9ba', 'Reportgirl, Ima', 0, '+444-44-4545', 'CIV', 'I need a career change', true, 'reportgirl', NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Mexico'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('7a15d0cc-520f-451c-80d8-399b4642c852', 'Beau, Yoshie', 0, '+1-202-7320', 'CIV', NULL, true, 'yoshie', 'b3f67185-77e7-42a0-a2eb-f0739077eab5', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f73f5cc9-69fd-4ceb-81b9-a0a840914bd8', 'Sharton, Shardul', 1, '+99-9999-9999', 'CIV', NULL, false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Italy'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Interlocutors
  ('90fa5784-9e63-4353-8119-357bcd88e287', 'Steveson, Steve', 0, '+011-232-12324', 'OF-4', 'this is a sample person who could be a Interlocutor!', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('6866ce4d-1f8c-4f78-bdc2-4767e9a859b0', 'Rogwell, Roger', 0, '+1-412-7324', 'OF-3', 'Roger is another test person we have in the database', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('237e8bf7-2ae4-4d49-b7c8-eca6a92d4767', 'Topferness, Christopf', 0, '+1-422222222', 'CIV', 'Christopf works in the MoD Office', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('5fa54ffd-cc90-493a-b4b1-73e9c4568177', 'Chrisville, Chris', 0, '+1-412-7324', 'OF-3', 'Chris is another test person we have in the database', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('0c5a8ba7-7436-47fd-bead-b8393246a300', 'Kyleson, Kyle', 0, '+1-412-7324', 'CIV', 'Kyle is another test person we have in the database', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cebeb179-2a64-4d0c-a06b-76e68f80b5e5', 'Bemerged, Myposwill', 0, '+1-412-7324', 'CIV', 'Myposwill is a test person whose position will be merged', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('3cb2076c-5317-47fe-86ad-76f298993917', 'Merged, Duplicate Winner', 0, '+1-234-5678', 'CIV', 'Winner is a test person who will be merged', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c725aef3-cdd1-4baf-ac72-f28219b234e9', 'Merged, Duplicate Loser', 0, NULL, 'CTR', 'Loser is a test person who will be merged', false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), 'FEMALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('7d90bf90-b3b1-4e99-84bf-5e50b9dcc9d6', 'Huntman, Hunter', 0, '+1-412-9314', 'CIV', NULL, false, NULL, NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('33f708e0-bf7c-47a0-baf1-730afa4f0c98', 'Nicholson, Nick', 0, '+1-202-7324', 'CIV', NULL, true, 'nick', '2a1e98bd-13dc-49c9-a1c5-7137eacc0e8f', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Superusers
  ('98fa4da5-ec99-457b-a4bc-2aa9064e2ca7', 'Bobtown, Bob', 0, '+1-444-7324', 'CIV', 'Bob is a Superuser in EF 1.1', true, 'bob', '505c6bd9-e2d1-4f9e-83b0-ecc9279c42c5', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ff0cec0b-8eca-48ee-82fe-addce6136f3b', 'Henderson, Henry', 0, '+2-456-7324', 'OF-6', 'Henry is a Superuser in EF 2.1', true, 'henry', '04fbbc19-3bd9-4075-8dd8-bc8c741d8c3c', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('19fe53bb-90f4-4482-abfc-d85b85deabd9', 'Jacobson, Jacob', 0, '+2-456-7324', 'CIV', 'Jacob is a Superuser in EF 2.2', true, 'jacob', '19fcef93-1b1a-472b-97f5-77f46cf6f3fd', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Italy'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f683335a-91e3-4788-aa3f-9eed384f4ac1', 'Beccabon, Rebecca', 0, '+2-456-7324', 'CTR', 'Rebecca is a Superuser in EF 2.2', true, 'rebecca', '9eb4b898-6fe4-40f8-abca-e893424d75d1', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Germany'), 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('1a557db0-5af5-4ea3-b926-28b5f2e88bf7', 'Anderson, Andrew', 0, '+1-412-7324', 'CIV', 'Andrew is the EF 1 Manager', true, 'andrew', '3276c85a-bf03-4591-a74b-56d70ac8eec0', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ad442c97-ca89-4c63-9a4d-336f17ca856b', 'Schrute, Dwight', 0, '+1-412-7324', 'CIV', 'Beets & Battlestar Galactica.', true, 'dwight', 'cb23f6a5-1321-4330-b972-22d98bff12af', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b6754f19-b67e-4603-bfe6-af8c61760eef', 'Halpert, Jim', 0, '+1-412-7324', 'CIV', 'Lets prank dwight.', true, 'jim', 'e8c81377-eaac-4ace-8aa6-7b255b53494c', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Administrators
  ('87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'Dmin, Arthur', '0', NULL, 'CIV', 'An administrator', true, 'arthur', 'abc72322-1452-4222-bb71-a0b3db435175', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Albania'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('46ba6a73-0cd7-4efb-8e99-215e98cc5987', 'Scott, Michael', '0', NULL, 'CIV', 'Worlds best boss.', true, 'michael', 'bd482701-2342-4a50-ba92-d956007a8828', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'United States'), 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE people
SET "customFields"='{"invisibleCustomFields":["formCustomFields.textareaFieldName","formCustomFields.numberFieldName"],"arrayFieldName":[],"nlt_dt":null,"nlt":null,"colourOptions":"","inputFieldName":"Lorem ipsum dolor sit amet","multipleButtons":[],"placeOfResidence":null,"placeOfBirth":null}'
WHERE name='Dmin, Arthur';

UPDATE people
SET "customFields"='{"invisibleCustomFields":["formCustomFields.textareaFieldName"],"arrayFieldName":[],"nlt_dt":null,"nlt":null,"numberFieldName":"5","colourOptions":"RED","inputFieldName":"","multipleButtons":[],"placeOfResidence":null,"placeOfBirth":null}'
WHERE name='Merged, Duplicate Winner';

UPDATE people
SET "customFields"='{"invisibleCustomFields":["formCustomFields.textareaFieldName"],"arrayFieldName":[],"nlt_dt":null,"nlt":null,"numberFieldName":"6","colourOptions":"RED","inputFieldName":"","multipleButtons":[],"placeOfResidence":null,"placeOfBirth":null}'
WHERE name='Merged, Duplicate Loser';

-- Email addresses for people
INSERT INTO "emailAddresses" (network, address, "relatedObjectType", "relatedObjectUuid") VALUES
-- Advisors
  ('Internet', 'jack@example.com', 'people', 'b5d495af-44d5-4c35-851a-1039352a8307'),
  ('NS', 'jack@example.ns', 'people', 'b5d495af-44d5-4c35-851a-1039352a8307'),
  ('Internet', 'liz@example.com', 'people', 'a9d65d96-d107-45c3-bbaa-1133a354335b'),
  ('NS', 'liz@example.ns', 'people', 'a9d65d96-d107-45c3-bbaa-1133a354335b'),
  ('Internet', 'selena@example.com', 'people', '00b19ebf-0d4d-4b0f-93c8-9023ccb59c49'),
  ('NS', 'selena@example.ns', 'people', '00b19ebf-0d4d-4b0f-93c8-9023ccb59c49'),
  ('Internet', 'erin@example.com', 'people', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9'),
  ('NS', 'erin@example.ns', 'people', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9'),
  ('Internet', 'reina@example.com', 'people', '1ad0c049-6ce8-4890-84f6-5e6a364764c4'),
  ('NS', 'reina@example.ns', 'people', '1ad0c049-6ce8-4890-84f6-5e6a364764c4'),
  ('Internet', 'advisor@example.com', 'people', '39d02d26-49eb-43b5-9cec-344777213a67'),
  ('NS', 'advisor@example.ns', 'people', '39d02d26-49eb-43b5-9cec-344777213a67'),
  ('Internet', 'creed.bratton@example.com', 'people', '31cba227-f6c6-49e9-9483-fce441bea624'),
  ('NS', 'creed.bratton@example.ns', 'people', '31cba227-f6c6-49e9-9483-fce441bea624'),
  ('Internet', 'kevin.malone@example.com', 'people', 'd4e1ae87-e519-4ec6-b0a4-5c3b19a0183e'),
  ('NS', 'kevin.malone@example.ns', 'people', 'd4e1ae87-e519-4ec6-b0a4-5c3b19a0183e'),
  ('Internet', 'lin.guist@example.com', 'people', '02fdbd68-866f-457a-990c-fbd79bc9b96c'),
  ('NS', 'lin.guist@example.ns', 'people', '02fdbd68-866f-457a-990c-fbd79bc9b96c'),
  ('Internet', 'inter.preter@example.com', 'people', 'bcd9d5e4-bf6c-42de-9246-8116f2b23bdc'),
  ('NS', 'inter.preter@example.ns', 'people', 'bcd9d5e4-bf6c-42de-9246-8116f2b23bdc'),
  ('Internet', 'yoshie@example.com', 'people', '7a15d0cc-520f-451c-80d8-399b4642c852'),
  ('NS', 'yoshie@example.ns', 'people', '7a15d0cc-520f-451c-80d8-399b4642c852'),
  ('Internet', 'shardul@example.com', 'people', 'f73f5cc9-69fd-4ceb-81b9-a0a840914bd8'),
  ('NS', 'shardul@example.ns', 'people', 'f73f5cc9-69fd-4ceb-81b9-a0a840914bd8'),
  ('Internet', 'ben+rogers@example.com', 'people', 'c71f707a-667f-4713-9552-8510d69a308b'),
  ('NS', 'ben+rogers@example.ns', 'people', 'c71f707a-667f-4713-9552-8510d69a308b'),
  ('Internet', 'kevin+rivers@example.com', 'people', 'c033862b-a4ef-4043-acd5-a2b399a10f00'),
  ('NS', 'kevin+rivers@example.ns', 'people', 'c033862b-a4ef-4043-acd5-a2b399a10f00'),
-- Advisors with no position for testing
  ('Internet', 'ima.reportguy@example.com', 'people', '7914ceba-7f89-493b-bd03-eee7e19c60a8'),
  ('NS', 'ima.reportguy@example.ns', 'people', '7914ceba-7f89-493b-bd03-eee7e19c60a8'),
  ('Internet', 'ima.reportgirl@example.com', 'people', 'd9f3ee10-6e01-4d57-9916-67978608e9ba'),
  ('NS', 'ima.reportgirl@example.ns', 'people', 'd9f3ee10-6e01-4d57-9916-67978608e9ba'),
-- Interlocutors
  ('Internet', 'steve@example.com', 'people', '90fa5784-9e63-4353-8119-357bcd88e287'),
  ('Internet', 'roger@example.com', 'people', '6866ce4d-1f8c-4f78-bdc2-4767e9a859b0'),
  ('Internet', 'christopf@example.com', 'people', '237e8bf7-2ae4-4d49-b7c8-eca6a92d4767'),
  ('Internet', 'chrisville.chris@example.com', 'people', '5fa54ffd-cc90-493a-b4b1-73e9c4568177'),
  ('Internet', 'kyleson.kyle@example.com', 'people', '0c5a8ba7-7436-47fd-bead-b8393246a300'),
  ('Internet', 'bemerged.myposwill@example.com', 'people', 'cebeb179-2a64-4d0c-a06b-76e68f80b5e5'),
  ('Internet', 'merged.winner@example.com', 'people', '3cb2076c-5317-47fe-86ad-76f298993917'),
  ('Internet', 'hunter@example.com', 'people', '7d90bf90-b3b1-4e99-84bf-5e50b9dcc9d6'),
  ('Internet', 'nick@example.com', 'people', '33f708e0-bf7c-47a0-baf1-730afa4f0c98'),
-- Superusers
  ('Internet', 'bob@example.com', 'people', '98fa4da5-ec99-457b-a4bc-2aa9064e2ca7'),
  ('NS', 'bob@example.ns', 'people', '98fa4da5-ec99-457b-a4bc-2aa9064e2ca7'),
  ('Internet', 'henry@example.com', 'people', 'ff0cec0b-8eca-48ee-82fe-addce6136f3b'),
  ('NS', 'henry@example.ns', 'people', 'ff0cec0b-8eca-48ee-82fe-addce6136f3b'),
  ('Internet', 'jacob@example.com', 'people', '19fe53bb-90f4-4482-abfc-d85b85deabd9'),
  ('NS', 'jacob@example.ns', 'people', '19fe53bb-90f4-4482-abfc-d85b85deabd9'),
  ('Internet', 'rebecca@example.com', 'people', 'f683335a-91e3-4788-aa3f-9eed384f4ac1'),
  ('NS', 'rebecca@example.ns', 'people', 'f683335a-91e3-4788-aa3f-9eed384f4ac1'),
  ('Internet', 'andrew@example.com', 'people', '1a557db0-5af5-4ea3-b926-28b5f2e88bf7'),
  ('NS', 'andrew@example.ns', 'people', '1a557db0-5af5-4ea3-b926-28b5f2e88bf7'),
  ('Internet', 'dwight.schrute@example.com', 'people', 'ad442c97-ca89-4c63-9a4d-336f17ca856b'),
  ('NS', 'dwight.schrute@example.ns', 'people', 'ad442c97-ca89-4c63-9a4d-336f17ca856b'),
  ('Internet', 'jim.halpert@example.com', 'people', 'b6754f19-b67e-4603-bfe6-af8c61760eef'),
  ('NS', 'jim.halpert@example.ns', 'people', 'b6754f19-b67e-4603-bfe6-af8c61760eef'),
-- Administrators
  ('Internet', 'arthur@example.com', 'people', '87fdbc6a-3109-4e11-9702-a894d6ca31ef'),
  ('NS', 'arthur@example.ns', 'people', '87fdbc6a-3109-4e11-9702-a894d6ca31ef'),
  ('Internet', 'michael.scott@example.com', 'people', '46ba6a73-0cd7-4efb-8e99-215e98cc5987'),
  ('NS', 'michael.scott@example.ns', 'people', '46ba6a73-0cd7-4efb-8e99-215e98cc5987');

-- Create locations
INSERT INTO locations (uuid, type, name, lat, lng, "createdAt", "updatedAt") VALUES
  ('64795e03-ba83-4bc3-b647-d37fcb1c0694', 'PP', 'Merge Location Winner', 38.58809, -28.71611, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('4694bb3c-275a-4e74-9197-033e8e9c53ed', 'PP', 'Merge Location Loser', -46.4035948, 51.69093, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e5b3a4b9-acf7-4c79-8224-f248b9a7215d', 'PA', 'Antarctica', -90, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', 'PP', 'St Johns Airport', 47.613442, -52.740936, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('8c138750-91ce-41bf-9b4c-9f0ddc73608b', 'PP', 'Murray''s Hotel', 47.561517, -52.708760, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('9c982685-5946-4dad-a7ee-0f5a12f5e170', 'PP', 'Wishingwells Park', 47.560040, -52.736962, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('0855fb0a-995e-4a79-a132-4024ee2983ff', 'PP', 'General Hospital', 47.571772, -52.741935, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('95446f93-249b-4aa9-b98a-7bd2c4680718', 'PP', 'Portugal Cove Ferry Terminal', 47.626718, -52.857241, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c8fdb53f-6f93-46fc-b0fa-f005c7b49667', 'PP', 'Cabot Tower', 47.570010, -52.681770, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c7a9f420-457a-490c-a810-b504c022cf1e', 'PP', 'Fort Amherst', 47.563763, -52.680590, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('7339f9e3-99d1-497a-9e3b-1269c4c287fe', 'PP', 'Harbour Grace Police Station', 47.705133, -53.214422, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f2207d9b-204b-4cb5-874d-3fe6bc6f8acd', 'PP', 'Conception Bay South Police Station', 47.526784, -52.954739, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, type, name, "createdAt", "updatedAt") VALUES
  ('283797ec-7077-49b2-87b8-9afd5499b6f3', 'V', 'VTC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e0ff0d6c-e663-4639-a44d-b075bf1e690d', 'PP', 'MoD Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('5046a870-6c2a-40a7-9681-61a1d6eeaa07', 'PP', 'MoI Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c15eb29e-2965-401e-9f36-6ac8b9cc3842', 'PP', 'President''s Palace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('0585f158-5121-46a2-b099-799fe980aa9c', 'PP', 'Kabul Police Academy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('053ab2ad-132a-4a62-8cbb-20827f50ec34', 'PP', 'Police HQ Training Facility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e87f145b-32e9-47ec-a0f4-e0dcf18e8a8c', 'PP', 'Kabul Hospital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('6465dd40-9fec-41db-a3b9-652fa52c7d21', 'PP', 'MoD Army Training Base 123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('2a59dd78-0c29-4b3f-bc94-7c98ff80b197', 'PP', 'MoD Location the Second', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('18c9be38-bf68-40e2-80d8-aac47f5ff7cf', 'PP', 'MoD Office Building', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('8a34768c-aa15-41e4-ab79-6cf2740d555e', 'PP', 'MoI Training Center', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('9f364c59-953e-4c17-919c-648ea3a74e36', 'PP', 'MoI Adminstrative Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dfc3918d-c2e3-4308-b161-2445cde77b3f', 'PP', 'MoI Senior Executive Suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('3652e114-ad16-43f0-b179-cc1bce6958d5', 'PP', 'MoI Coffee Shop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('5ac4078d-d445-416a-a93e-5941562359bb', 'PP', 'MoI Herat Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22b0137c-4d89-43eb-ac95-a9f68aba884f', 'PP', 'MoI Jalalabad Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60f4084f-3304-4cd5-89df-353edef07d18', 'PP', 'MoI Kandahar Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c136bf89-cc24-43a5-8f51-0f41dfc9ab77', 'PP', 'MoI Mazar-i-Sharif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b0979678-0ed0-4b42-9b26-9976fcfa1b81', 'PP', 'MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Set up locationRelationships
INSERT INTO "locationRelationships" ("childLocationUuid", "parentLocationUuid") VALUES
  ('64795e03-ba83-4bc3-b647-d37fcb1c0694', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Portugal')),
  ('4694bb3c-275a-4e74-9197-033e8e9c53ed', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'French Southern Territories')),
  ('e5b3a4b9-acf7-4c79-8224-f248b9a7215d', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Antarctica')),
  ('cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('8c138750-91ce-41bf-9b4c-9f0ddc73608b', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('9c982685-5946-4dad-a7ee-0f5a12f5e170', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('0855fb0a-995e-4a79-a132-4024ee2983ff', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('95446f93-249b-4aa9-b98a-7bd2c4680718', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('c8fdb53f-6f93-46fc-b0fa-f005c7b49667', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('c7a9f420-457a-490c-a810-b504c022cf1e', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('7339f9e3-99d1-497a-9e3b-1269c4c287fe', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('f2207d9b-204b-4cb5-874d-3fe6bc6f8acd', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Canada')),
  ('e0ff0d6c-e663-4639-a44d-b075bf1e690d', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('5046a870-6c2a-40a7-9681-61a1d6eeaa07', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('c15eb29e-2965-401e-9f36-6ac8b9cc3842', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('0585f158-5121-46a2-b099-799fe980aa9c', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('053ab2ad-132a-4a62-8cbb-20827f50ec34', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('e87f145b-32e9-47ec-a0f4-e0dcf18e8a8c', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('6465dd40-9fec-41db-a3b9-652fa52c7d21', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('2a59dd78-0c29-4b3f-bc94-7c98ff80b197', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('18c9be38-bf68-40e2-80d8-aac47f5ff7cf', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('8a34768c-aa15-41e4-ab79-6cf2740d555e', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('9f364c59-953e-4c17-919c-648ea3a74e36', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('dfc3918d-c2e3-4308-b161-2445cde77b3f', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('3652e114-ad16-43f0-b179-cc1bce6958d5', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('5ac4078d-d445-416a-a93e-5941562359bb', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('22b0137c-4d89-43eb-ac95-a9f68aba884f', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('60f4084f-3304-4cd5-89df-353edef07d18', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('c136bf89-cc24-43a5-8f51-0f41dfc9ab77', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan')),
  ('b0979678-0ed0-4b42-9b26-9976fcfa1b81', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'));

UPDATE locations
SET "customFields"='{"invisibleCustomFields":["formCustomFields.textareaFieldName","formCustomFields.numberFieldName"],"arrayFieldName":[],"nlt_dt":null,"nlt":null,"colourOptions":"","inputFieldName":"consectetur adipisici elit","multipleButtons":[]}'
WHERE name='MoI Coffee Shop';

-- Create advisor positions
INSERT INTO positions (uuid, name, type, role, status, "currentPersonUuid", "locationUuid", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'ANET Administrator', 3, 0, 0, NULL, 'c8fdb53f-6f93-46fc-b0fa-f005c7b49667', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1 Manager', 2, 2, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor A', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor B', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor C', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor D', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor E', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor F', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('888d6c4b-deaa-4218-b8fd-abfb7c81a4c6', 'EF 1.1 Advisor G', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor for Agriculture', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Old Inactive Advisor', 0, 0, 1, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor for Mining', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor for Space Issues', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Advisor for Interagency Advising', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.1 Superuser', 2, 1, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('525d6c4b-deaa-4218-b8fd-abfb7c81a4c2', 'EF 1.2 Advisor', 0, 0, 0, NULL, 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.1 Advisor B', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.1 Advisor for Accounting', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.1 Advisor for Kites', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.1 Superuser', 2, 1, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.2 Advisor C', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.2 Advisor D', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.2 Old and Inactive', 0, 0, 1, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('2b7d86a9-3ed4-4843-ab4e-136c3ab109bf', 'EF 2.2 Advisor Sewing Facilities', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.2 Advisor Local Kebabs', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.2 Superuser', 2, 1, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.2 Final Reviewer', 2, 2, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.1 Advisor A', 0, 0, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.1 Advisor for Coffee', 0, 0, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.1 Advisor on Software Engineering', 0, 0, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.1 Advisor E', 0, 0, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.1 Advisor old - dont use', 0, 0, 1, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5 Admin', 3, 2, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'05c42ce0-34a0-4391-8b2f-c4cd85ee6b47', 'EF 5.1 Advisor Quality Assurance', 0, 0, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5.1 Advisor Accounting', 0, 0, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5.1 Superuser Sales 1', 2, 1, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5.1 Superuser Sales 2', 2, 1, 0, NULL, 'c7a9f420-457a-490c-a810-b504c022cf1e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 6 Approver', 0, 0, 0, NULL, '7339f9e3-99d1-497a-9e3b-1269c4c287fe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 6.1 Advisor', 0, 0, 0, NULL, '7339f9e3-99d1-497a-9e3b-1269c4c287fe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 9 Advisor', 0, 0, 0, NULL, '7339f9e3-99d1-497a-9e3b-1269c4c287fe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 9 Approver', 0, 0, 0, NULL, '7339f9e3-99d1-497a-9e3b-1269c4c287fe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'LNG Advisor A', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'LNG Advisor B', 0, 0, 0, NULL, '8c138750-91ce-41bf-9b4c-9f0ddc73608b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE positions
SET "customFields"='{"invisibleCustomFields":["formCustomFields.textareaFieldName","formCustomFields.numberFieldName"],"arrayFieldName":[],"nlt_dt":null,"nlt":null,"colourOptions":"","inputFieldName":"sed eiusmod tempor incidunt ut labore et dolore magna aliqua","multipleButtons":[]}'
WHERE name='EF 5.1 Advisor Quality Assurance';

-- Email addresses for advisor positions
INSERT INTO "emailAddresses" (network, address, "relatedObjectType", "relatedObjectUuid") VALUES
  ('Internet', 'ef11advisorG@example.com', 'positions', '888d6c4b-deaa-4218-b8fd-abfb7c81a4c6'),
  ('NS', 'ef11advisorG@example.ns', 'positions', '888d6c4b-deaa-4218-b8fd-abfb7c81a4c6'),
  ('Internet', 'ef12advisor@example.com', 'positions', '525d6c4b-deaa-4218-b8fd-abfb7c81a4c2'),
  ('NS', 'ef12advisor@example.ns', 'positions', '525d6c4b-deaa-4218-b8fd-abfb7c81a4c2'),
  ('Internet', 'ef22advisorSewingFacilities@example.com', 'positions', '2b7d86a9-3ed4-4843-ab4e-136c3ab109bf'),
  ('NS', 'ef22advisorSewingFacilities@example.ns', 'positions', '2b7d86a9-3ed4-4843-ab4e-136c3ab109bf'),
  ('Internet', 'ef51advisorQualityAssurance@example.com', 'positions', '05c42ce0-34a0-4391-8b2f-c4cd85ee6b47'),
  ('NS', 'ef51advisorQualityAssurance@example.ns', 'positions', '05c42ce0-34a0-4391-8b2f-c4cd85ee6b47');

-- Put Andrew in the EF 1 Manager Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1 Manager'), (SELECT uuid from people where "domainUsername" = 'andrew'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'andrew') WHERE name = 'EF 1 Manager';

-- Put Bob into the Superuser Billet in EF 1.1
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.1 Superuser'), (SELECT uuid from people where "domainUsername" = 'bob'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'bob') WHERE name = 'EF 1.1 Superuser';

-- Put Henry into the Superuser Billet in EF 2.1
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.1 Superuser'), (SELECT uuid from people where "domainUsername" = 'henry'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'henry') WHERE name = 'EF 2.1 Superuser';

-- Rotate an advisor through a billet ending up with Jack in the EF 2.1 Advisor B Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where "domainUsername" = 'erin'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'erin') WHERE name = 'EF 2.1 Advisor B';
UPDATE "peoplePositions" SET "endedAt" = '2021-01-01' WHERE "positionUuid" = (SELECT uuid from positions where name = 'EF 2.1 Advisor B');
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where "domainUsername" = 'jack'), '2021-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'jack') WHERE name = 'EF 2.1 Advisor B';

-- Rotate advisors through billets ending up with Dvisor in the EF 2.2 Advisor Sewing Facilities Billet and Selena in the EF 1.2 Advisor Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.2 Advisor'), (SELECT uuid from people where "domainUsername" = 'advisor'), '2020-01-01');
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor Sewing Facilities'), (SELECT uuid from people where "domainUsername" = 'selena'), '2020-01-01');

UPDATE "peoplePositions" SET "endedAt" = '2021-01-01' WHERE "positionUuid" = (SELECT uuid from positions where name = 'EF 1.2 Advisor');
UPDATE "peoplePositions" SET "endedAt" = '2021-01-01' WHERE "positionUuid" = (SELECT uuid from positions where name = 'EF 2.2 Advisor Sewing Facilities');

INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor Sewing Facilities'), (SELECT uuid from people where "domainUsername" = 'advisor'), '2021-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'advisor') WHERE name = 'EF 2.2 Advisor Sewing Facilities';
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.2 Advisor'), (SELECT uuid from people where "domainUsername" = 'selena'), '2021-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'selena') WHERE name = 'EF 1.2 Advisor';

-- Put Elizabeth into the EF 1.1 Advisor A Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.1 Advisor A'), (SELECT uuid from people where "domainUsername" = 'elizabeth'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'elizabeth') WHERE name = 'EF 1.1 Advisor A';

-- Put Reina into the EF 2.2 Advisor C Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor C'), (SELECT uuid from people where "domainUsername" = 'reina'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'reina') WHERE name = 'EF 2.2 Advisor C';

-- Put Erin into the EF 2.2 Advisor D Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor D'), (SELECT uuid from people where "domainUsername" = 'erin'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'erin') WHERE name = 'EF 2.2 Advisor D';

-- Put Jacob in the EF 2.2 Superuser Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Superuser'), (SELECT uuid from people where "domainUsername" = 'jacob'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'jacob') WHERE name = 'EF 2.2 Superuser';

-- Put Rebecca in the EF 2.2 Final Reviewer Position
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Final Reviewer'), (SELECT uuid from people where "domainUsername" = 'rebecca'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'rebecca') WHERE name = 'EF 2.2 Final Reviewer';

-- Put Arthur into the Admin Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'ANET Administrator'), (SELECT uuid from people where "domainUsername" = 'arthur'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'arthur') WHERE name = 'ANET Administrator';

-- Put Creed into the EF 5.1 Quality Ensurance
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Advisor Quality Assurance'), (SELECT uuid from people where "domainUsername" = 'creed'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'creed') WHERE name = 'EF 5.1 Advisor Quality Assurance';

-- Put Kevin into the EF 5.1 Accounting
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Advisor Accounting'), (SELECT uuid from people where "domainUsername" = 'kevin'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'kevin') WHERE name = 'EF 5.1 Advisor Accounting';

-- Put Jim into the EF 5.1 Sales 1
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Superuser Sales 1'), (SELECT uuid from people where "domainUsername" = 'jim'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'jim') WHERE name = 'EF 5.1 Superuser Sales 1';

-- Put Dwight into the EF 5.1 Sales 2
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Superuser Sales 2'), (SELECT uuid from people where "domainUsername" = 'dwight'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'dwight') WHERE name = 'EF 5.1 Superuser Sales 2';

-- Put Michael into the EF 5 Admin
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5 Admin'), (SELECT uuid from people where "domainUsername" = 'michael'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'michael') WHERE name = 'EF 5 Admin';

-- Put Kevin Rivers into the EF 6 Approver
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 6 Approver'), (SELECT uuid from people where name = 'Rivers, Kevin'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Rivers, Kevin') WHERE name = 'EF 6 Approver';

-- Put Ben Rogers into the EF 6.1 Advisor
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 6.1 Advisor'), (SELECT uuid from people where name = 'Rogers, Ben'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Rogers, Ben') WHERE name = 'EF 6.1 Advisor';

-- Put Nick into the EF 9 Advisor
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 9 Advisor'), (SELECT uuid from people where "domainUsername" = 'nick'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'nick') WHERE name = 'EF 9 Advisor';

-- Put Yoshie Beau into the EF 9 Approver
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 9 Approver'), (SELECT uuid from people where "domainUsername" = 'yoshie'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'yoshie') WHERE name = 'EF 9 Approver';

-- Put Lin into the LNG Advisor A
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'LNG Advisor A'), (SELECT uuid from people where "domainUsername" = 'lin'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'lin') WHERE name = 'LNG Advisor A';

-- Put Inter into the LNG Advisor B
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'LNG Advisor B'), (SELECT uuid from people where "domainUsername" = 'inter'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "domainUsername" = 'inter') WHERE name = 'LNG Advisor B';

-- Top-level organizations
INSERT INTO organizations(uuid, "shortName", "longName", app6context, "app6standardIdentity", "app6symbolSet", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'ANET Administrators','', '0', '3', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('70193ee9-05b4-4aac-80b5-75609825db9f', 'LNG', 'Linguistic', '0', '3', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('9a35caa7-a095-4963-ac7b-b784fde4d583', 'EF 1', 'Planning Programming, Budgeting and Execution', '0', '3', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('291abe56-e2c2-4a3a-8419-1661e5c5ac17', 'EF 2', '', '0', '3', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 3', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4', '', '0', '4', '11', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5', '', '0', '3', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 6', '', '0', '3', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF7', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF8', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 9', 'Gender', '0', '3', '10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-N', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-S', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-W', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-E', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-C', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC Air', '', '0', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub-organizations
INSERT INTO organizations(uuid, "shortName", "longName", "parentOrgUuid", "createdAt", "updatedAt") VALUES
  ('04614b0f-7e8e-4bf1-8bc5-13abaffeab8a', 'EF 1.1', '', (SELECT uuid from organizations WHERE "shortName" ='EF 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1.2', '', (SELECT uuid from organizations WHERE "shortName" ='EF 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2.1', '', (SELECT uuid from organizations WHERE "shortName" ='EF 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ccbee4bb-08b8-42df-8cb5-65e8172f657b', 'EF 2.2', '', (SELECT uuid from organizations WHERE "shortName" ='EF 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.1', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.2', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.3', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4.4', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 4'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf', 'EF 5.1', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5.2', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5.3', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5.4', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 5'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 6.1', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 6'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 6.2', '', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 6'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE organizations
SET "locationUuid"='9c982685-5946-4dad-a7ee-0f5a12f5e170'
WHERE "shortName" LIKE 'EF 4%';

UPDATE organizations
SET "customFields"='{"invisibleCustomFields":["formCustomFields.textareaFieldName","formCustomFields.numberFieldName"],"arrayFieldName":[],"nlt_dt":null,"nlt":null,"colourOptions":"","inputFieldName":"quis nostrud exercitation ullamco laboris","multipleButtons":[]}'
WHERE "shortName"='LNG';

-- Email addresses for organizations
INSERT INTO "emailAddresses" (network, address, "relatedObjectType", "relatedObjectUuid") VALUES
  ('Internet', 'lng@example.com', 'organizations', '70193ee9-05b4-4aac-80b5-75609825db9f'),
  ('NS', 'lng@example.ns', 'organizations', '70193ee9-05b4-4aac-80b5-75609825db9f'),
  ('Internet', 'ef11@example.com', 'organizations', '04614b0f-7e8e-4bf1-8bc5-13abaffeab8a'),
  ('NS', 'ef11@example.ns', 'organizations', '04614b0f-7e8e-4bf1-8bc5-13abaffeab8a'),
  ('Internet', 'ef22@example.com', 'organizations', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b'),
  ('NS', 'ef22@example.ns', 'organizations', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b'),
  ('Internet', 'ef51@example.com', 'organizations', '7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf'),
  ('NS', 'ef51@example.ns', 'organizations', '7f939a44-b9e4-48e0-98f5-7d0ea38a6ecf');

-- Add some positions to organizations
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 1') WHERE name LIKE 'EF 1 %';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 1.1') WHERE name LIKE 'EF 1.1%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 1.2') WHERE name LIKE 'EF 1.2%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 2.1') WHERE name LIKE 'EF 2.1%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 2.2') WHERE name LIKE 'EF 2.2%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 3') WHERE name LIKE 'EF 3%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 4') WHERE name LIKE 'EF 4%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 5') WHERE name LIKE 'EF 5%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 5.1') WHERE name LIKE 'EF 5.1%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 6') WHERE name LIKE 'EF 6%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 6.1') WHERE name LIKE 'EF 6.1%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='EF 9') WHERE name LIKE 'EF 9%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='LNG') WHERE name LIKE 'LNG%';
UPDATE positions SET "organizationUuid" = (SELECT uuid FROM organizations WHERE "shortName" ='ANET Administrators') where name = 'ANET Administrator';

-- Assign responsible positions for organizations
INSERT INTO "organizationAdministrativePositions" ("organizationUuid", "positionUuid") VALUES
  ((SELECT uuid FROM organizations WHERE "shortName" = 'EF 1'), (SELECT uuid FROM positions WHERE name = 'EF 1 Manager')),
  ((SELECT uuid FROM organizations WHERE "shortName" = 'EF 2.1'), (SELECT uuid FROM positions WHERE name = 'EF 2.1 Superuser')),
  ((SELECT uuid FROM organizations WHERE "shortName" = 'EF 2.2'), (SELECT uuid FROM positions WHERE name = 'EF 2.2 Superuser')),
  ((SELECT uuid FROM organizations WHERE "shortName" = 'EF 2.2'), (SELECT uuid FROM positions WHERE name = 'EF 2.2 Final Reviewer'));

-- Create the EF 1.1 approval process
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='EF 1.1'), 'EF 1.1 Approvers', 1);
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" WHERE name='EF 1.1 Approvers'), (SELECT uuid from positions where name = 'EF 1.1 Superuser'));

-- Create the EF 2.2 approval process
INSERT INTO "approvalSteps" (uuid, name, "relatedObjectUuid", "nextStepUuid", type) VALUES
  ('db93e123-0aae-46c7-bc87-1adac9519de4', 'EF 2.2 Secondary Reviewers', (SELECT uuid from organizations where "shortName"='EF 2.2'), NULL, 1),
  (uuid_generate_v4(), 'EF 2.2 Initial Approvers', (SELECT uuid from organizations where "shortName"='EF 2.2'), 'db93e123-0aae-46c7-bc87-1adac9519de4', 1);

INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Superuser')),
  ((SELECT uuid from "approvalSteps" WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Advisor D')),
  ((SELECT uuid from "approvalSteps" WHERE name='EF 2.2 Secondary Reviewers'), (SELECT uuid from positions where name = 'EF 2.2 Final Reviewer'));

-- Create the EF 6 approval process
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='EF 6'), 'EF 6 Approvers', 1);
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" WHERE name='EF 6 Approvers'), (SELECT uuid from positions where name = 'EF 6 Approver'));

-- Create the EF 9 approval process
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='EF 9'), 'EF 9 Approvers', 1);
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" WHERE name='EF 9 Approvers'), (SELECT uuid from positions where name = 'EF 9 Approver'));

-- Create some tasks
INSERT INTO tasks (uuid, "shortName", "longName", selectable, category, "createdAt", "updatedAt", "parentTaskUuid") VALUES
  (N'1145e584-4485-4ce0-89c4-2fa2e1fe846a', 'EF 1', 'Budget and Planning', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'fdf107e7-a88a-4dc4-b744-748e9aaffabc', '1.1', 'Budgeting in the MoD', TRUE, 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
  (N'7b2ad5c3-018b-48f5-b679-61fbbda21693', '1.1.A', 'Milestone the First in EF 1.1', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
  (N'1b5eb36b-456c-46b7-ae9e-1c89e9075292', '1.1.B', 'Milestone the Second in EF 1.1', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
  (N'7fdef880-1bf3-4e56-8476-79166324023f', '1.1.C', 'Milestone the Third in EF 1.1', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
  (N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0', 'EF 1.2', 'Budgeting in the MoI', TRUE, 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
  (N'ac466253-1456-4fc8-9b14-a3643746e5a6', 'EF 1.3', 'Budgeting in the Police?', TRUE, 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
  (N'953e0b0b-25e6-44b6-bc77-ef98251d046a', '1.2.A', 'Milestone the First in EF 1.2', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
  (N'9d3da7f4-8266-47af-b518-995f587250c9', '1.2.B', 'Milestone the Second in EF 1.2', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
  (N'6bbb1be9-4655-48d7-83f2-bc474781544a', '1.2.C', 'Milestone the Third in EF 1.2', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
  (N'076793eb-9950-4ea6-bbd5-2d8b8827828c', '1.3.A', 'Getting a budget in place', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'ac466253-1456-4fc8-9b14-a3643746e5a6'),
  (N'30bc5708-c12d-4a21-916c-5acd7f6f11da', '1.3.B', 'Tracking your expenses', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'ac466253-1456-4fc8-9b14-a3643746e5a6'),
  (N'df920c99-10ea-44e8-940f-cb1d1cbd22da', '1.3.C', 'Knowing when you run out of money', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'ac466253-1456-4fc8-9b14-a3643746e5a6'),
  (N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7', 'EF 2', 'Transparency, Accountability, O (TAO)', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'75d4009d-7c79-42e0-aa2f-d79d158ec8d6', '2.A', 'This is the first Milestone in EF 2', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
  (N'2200a820-c4c7-4c9c-946c-f0c9c9e045c5', '2.B', 'This is the second Milestone in EF 2', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
  (N'0701a964-5d79-4090-8f35-a40856556675', '2.C', 'This is the third Milestone in EF 2', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
  (N'42afd501-1a2c-4758-9da5-f996b2c97156', '2.D', 'Keep track of the petty cash drawer', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'cd35abe7-a5c9-4b3e-885b-4c72bf564ed7'),
  (N'44089923-7367-4e97-82c3-dfe6b270d493', 'EF 3', 'Rule of Law', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'39d0c437-720c-4d78-8768-7f3dee5b3cd0', '3.a', 'Get some Lawyers to read a book', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'44089923-7367-4e97-82c3-dfe6b270d493'),
  (N'a710a076-be5c-4982-b870-50dd5d340eb3', '3.b', 'Get some Lawyers to wear a suit to court', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'44089923-7367-4e97-82c3-dfe6b270d493'),
  (N'c00633c5-5479-41b2-b188-89d2a9922924', '3.c', 'Get some Lawyers to cross-examine witnesses in a non-hostile fashion', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'44089923-7367-4e97-82c3-dfe6b270d493'),
  (N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9', 'EF 4', 'Force Gen (Training)', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'c098a5b3-8d80-429d-ada2-fd57dc331e2a', '4.a', 'Get a website for people to apply on', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'eddf19f6-f6e1-44f5-9093-f3e2ade59428', '4.b', 'Hire People', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'0cb03167-2772-4d3e-8382-5870da58022a', '4.b.1', 'Get an HR team', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'df8fd269-b382-486e-9bc6-f3f4b77a03b0', '4.b.2', 'Review resumes for hiring', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'17f35bc6-a0f3-4f79-8813-2176a7d7ca2f', '4.b.3', 'Invite people to come interview', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'32788f96-b72c-4314-8286-7f59b683cba2', '4.b.4', 'Interview candidates', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'cca1678a-58d7-4213-9c67-f894879df776', '4.b.5', 'Extend Job Offers to successful candidates', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'98342fa0-9106-4ef1-bc47-e4af2f5da330', '4.c', 'Onboard new Employees', TRUE, 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'dbe26c4f-7f92-451a-a9b5-8e43fc9cd6c9'),
  (N'242efaa3-d5de-4970-996d-50ca90ef6480', 'EF 5', 'Force Sustainment (Logistics)', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'12b8dbcc-8f31-444a-9437-00fe00fc1f7b', 'EF6', 'C2 Operations', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'19364d81-3203-483d-a6bf-461d58888c76', 'EF7', 'Intelligence', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'9b9f4205-0721-4893-abf8-69e020d4db23', 'EF8', 'Stratcom', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'4831e09b-2bbb-4717-9bfa-91071e62260a', 'EF9', '', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'5173f34b-16f5-4e18-aa3d-def55c40e36d', 'Gender', '', TRUE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'4831e09b-2bbb-4717-9bfa-91071e62260a'),
  (uuid_generate_v4(), 'TAAC-N', '', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-S', '', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-E', '', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-W', '', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-C', '', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC Air', '', FALSE, 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);

UPDATE tasks
SET "customFields"='{"invisibleCustomFields":[],"projectStatus":"RED"}'
WHERE "shortName"='EF 3';

INSERT INTO "taskTaskedOrganizations" ("taskUuid", "organizationUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), (SELECT uuid from organizations where "shortName"='EF 1.1')),
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), (SELECT uuid from organizations where "shortName"='EF 1.1')),
  ((SELECT uuid from tasks where "shortName" = '1.1.C'), (SELECT uuid from organizations where "shortName"='EF 1.1')),
  ((SELECT uuid from tasks where "shortName" = 'EF 1.2'), (SELECT uuid from organizations WHERE "shortName"='EF 1.2')),
  ((SELECT uuid from tasks where "shortName" = '1.2.A'), (SELECT uuid from organizations where "shortName"='EF 1.2')),
  ((SELECT uuid from tasks where "shortName" = '1.2.B'), (SELECT uuid from organizations where "shortName"='EF 1.2')),
  ((SELECT uuid from tasks where "shortName" = '1.2.C'), (SELECT uuid from organizations where "shortName"='EF 1.2')),
  -- ((SELECT uuid from tasks where "shortName" = 'EF 1.3'), (SELECT uuid FROM organizations WHERE "shortName"='EF 1.3')),
  -- ((SELECT uuid from tasks where "shortName" = '1.3.A'), (SELECT uuid from organizations where "shortName"='EF 1.3')),
  -- ((SELECT uuid from tasks where "shortName" = '1.3.B'), (SELECT uuid from organizations where "shortName"='EF 1.3')),
  -- ((SELECT uuid from tasks where "shortName" = '1.3.C'), (SELECT uuid from organizations where "shortName"='EF 1.3')),
  ((SELECT uuid from tasks where "shortName" = '2.A'), (SELECT uuid from organizations where "shortName"='EF 2')),
  ((SELECT uuid from tasks where "shortName" = '2.B'), (SELECT uuid from organizations where "shortName"='EF 2')),
  ((SELECT uuid from tasks where "shortName" = '2.C'), (SELECT uuid from organizations where "shortName"='EF 2')),
  ((SELECT uuid from tasks where "shortName" = '2.D'), (SELECT uuid from organizations where "shortName"='EF 2')),
  ((SELECT uuid from tasks where "shortName" = '3.a'), (SELECT uuid from organizations where "shortName"='EF 3')),
  ((SELECT uuid from tasks where "shortName" = '3.b'), (SELECT uuid from organizations where "shortName"='EF 3')),
  ((SELECT uuid from tasks where "shortName" = '3.c'), (SELECT uuid from organizations where "shortName"='EF 3')),
  ((SELECT uuid from tasks where "shortName" = '4.a'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = '4.b'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = '4.b.1'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = '4.b.2'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = '4.b.3'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = '4.b.4'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = '4.b.5'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = '4.c'), (SELECT uuid from organizations where "shortName"='EF 4')),
  ((SELECT uuid from tasks where "shortName" = 'Gender'), (SELECT uuid from organizations where "shortName"='EF 9'));

-- Create a task approval process for some tasks
INSERT INTO "taskResponsiblePositions" ("taskUuid", "positionUuid") VALUES
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.1'), (SELECT uuid FROM positions WHERE name = 'EF 1.1 Superuser')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.1.A'), (SELECT uuid FROM positions WHERE name = 'EF 1 Manager')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.1.A'), (SELECT uuid FROM positions WHERE name = 'EF 1.1 Advisor A')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.1.B'), (SELECT uuid FROM positions WHERE name = 'EF 1.1 Advisor B')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.1.B'), (SELECT uuid FROM positions WHERE name = 'EF 1.1 Advisor for Interagency Advising')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.1.C'), (SELECT uuid FROM positions WHERE name = 'EF 1.1 Advisor C')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.1.C'), (SELECT uuid FROM positions WHERE name = 'EF 1.1 Advisor for Mining')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.2.A'), (SELECT uuid FROM positions WHERE name = 'EF 1 Manager')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '1.2.B'), (SELECT uuid FROM positions WHERE name = 'EF 1 Manager')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '2.A'), (SELECT uuid FROM positions WHERE name = 'EF 2.1 Superuser')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '2.B'), (SELECT uuid FROM positions WHERE name = 'EF 2.1 Advisor B')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '2.C'), (SELECT uuid FROM positions WHERE name = 'EF 2.1 Advisor for Accounting')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '2.D'), (SELECT uuid FROM positions WHERE name = 'EF 2.1 Advisor for Kites')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '4.a'), (SELECT uuid FROM positions WHERE name = 'EF 4.1 Advisor A')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '4.b'), (SELECT uuid FROM positions WHERE name = 'EF 4.1 Advisor for Coffee')),
  ((SELECT uuid FROM tasks WHERE "shortName" = '4.c'), (SELECT uuid FROM positions WHERE name = 'EF 4.1 Advisor on Software Engineering'));

INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
  SELECT uuid_generate_v4(), tasks.uuid, 'Task Owner approval', 1
  FROM tasks
  WHERE status = 0
  AND "parentTaskUuid" IS NOT NULL;

INSERT INTO approvers ("approvalStepUuid", "positionUuid")
  SELECT "approvalSteps".uuid, "taskResponsiblePositions"."positionUuid"
  FROM "taskResponsiblePositions"
  JOIN "approvalSteps" ON "relatedObjectUuid" = "taskUuid"
  WHERE "approvalSteps".name = 'Task Owner approval'
  AND "approvalSteps".type = 1;

-- Create a location approval process for some locations
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
  SELECT uuid_generate_v4(), (SELECT uuid FROM locations WHERE name = 'Portugal Cove Ferry Terminal'), 'Location approval', 1;
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" where name = 'Location approval'), (SELECT uuid from positions where name = 'ANET Administrator'));

INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
  SELECT uuid_generate_v4(), '64795e03-ba83-4bc3-b647-d37fcb1c0694', 'Location planning approval for merge winner', 0;
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" where name = 'Location planning approval for merge winner'), (SELECT uuid from positions where name = 'EF 1.1 Advisor A'));

INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
  SELECT uuid_generate_v4(), '64795e03-ba83-4bc3-b647-d37fcb1c0694', 'Location publication approval for merge winner', 1;
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" where name = 'Location publication approval for merge winner'), (SELECT uuid from positions where name = 'EF 1.1 Advisor B'));

INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
  SELECT uuid_generate_v4(), '4694bb3c-275a-4e74-9197-033e8e9c53ed', 'Location planning approval for merge loser', 0;
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" where name = 'Location planning approval for merge loser'), (SELECT uuid from positions where name = 'EF 2.2 Advisor C'));

INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
  SELECT uuid_generate_v4(), '4694bb3c-275a-4e74-9197-033e8e9c53ed', 'Location publication approval for merge loser', 1;
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" where name = 'Location publication approval for merge loser'), (SELECT uuid from positions where name = 'EF 2.2 Advisor D'));

-- Top-level organizations
INSERT INTO organizations (uuid, "shortName", "longName", "identificationCode", "locationUuid", app6context, "app6standardIdentity", "app6symbolSet", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'MoD', 'Ministry of Defense', 'Z12345', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), '0', '4', '11', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'MoI', 'Ministry of Interior', 'P12345', (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), '0', '4', '11', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub-organizations
INSERT INTO organizations (uuid, "shortName", "longName", "parentOrgUuid", "identificationCode", "locationUuid", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'MOD-F', 'Ministry of Defense Finances', (SELECT uuid from organizations where "shortName" = 'MoD'), NULL, (SELECT uuid FROM locations WHERE type = 'PAC' AND name = 'Afghanistan'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Test for Merging
INSERT INTO organizations (uuid, "shortName", "longName", "identificationCode", "parentOrgUuid", "locationUuid", app6context, "app6standardIdentity", "app6symbolSet", "app6hq", "app6amplifier", "createdAt", "updatedAt") VALUES
  ('381d5435-8852-45d2-91b1-530560ca9d8c', 'Merge Org 1', 'Long Merge 1 Name', 'Mg1', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 1'), 'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', '0', '4', '20', '2', '14', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e706f443-7d4d-4356-82bc-1456f55e3d75', 'Merge Org 2', 'Long Merge 2 Name', 'Mg2', (SELECT uuid FROM organizations WHERE "shortName" = 'EF 1'), '95446f93-249b-4aa9-b98a-7bd2c4680718', '2', '2', '10', '5', '18', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='Merge Org 1'), 'Merge Org 1 Approvers', 1);
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='Merge Org 2'), 'Merge Org 2 Approvers', 1);
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='Merge Org 1'), 'Merge Org 1 Planning Approvers', 2);
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='Merge Org 2'), 'Merge Org 2 Planning Approvers', 2);
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
    ((SELECT uuid from "approvalSteps" WHERE name='Merge Org 1 Approvers'), (SELECT uuid from positions where name = 'EF 1.1 Superuser'));
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
    ((SELECT uuid from "approvalSteps" WHERE name='Merge Org 2 Approvers'), (SELECT uuid from positions where name = 'EF 2.1 Superuser'));
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
    ((SELECT uuid from "approvalSteps" WHERE name='Merge Org 1 Planning Approvers'), (SELECT uuid from positions where name = 'EF 1.1 Superuser'));
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
    ((SELECT uuid from "approvalSteps" WHERE name='Merge Org 2 Planning Approvers'), (SELECT uuid from positions where name = 'EF 2.1 Superuser'));

-- Assign responsible positions for organizations
INSERT INTO "organizationAdministrativePositions" ("organizationUuid", "positionUuid") VALUES
  ((SELECT uuid FROM organizations WHERE "shortName" = 'MoD'), (SELECT uuid FROM positions WHERE name = 'EF 1.1 Superuser')),
  ((SELECT uuid FROM organizations WHERE "shortName" = 'MoD'), (SELECT uuid FROM positions WHERE name = 'EF 2.1 Superuser')),
  ((SELECT uuid FROM organizations WHERE "shortName" = 'MoI'), (SELECT uuid FROM positions WHERE name = 'EF 2.2 Final Reviewer'));

-- Create interlocutor positions
INSERT INTO positions (uuid, name, code, type, role, status, "currentPersonUuid", "organizationUuid", "createdAt", "updatedAt") VALUES
  (N'879121d2-d265-4d26-8a2b-bd073caa474e', 'Minister of Defense', 'MOD-FO-00001', 0, 2, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'1a45ccd6-40e3-4c51-baf5-15e7e9b8f03d', 'Chief of Staff - MoD', 'MOD-FO-00002', 0, 2, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'4be6baa5-c611-4c70-a2a8-c01bf9b7d2bc', 'Executive Assistant to the MoD', 'MOD-FO-00003', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'a9ab507e-cda9-469b-8d9e-b47445852af4', 'Planning Captain', 'MOD-FO-00004', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'61371573-eefc-4b85-81a0-27d6c0b78c58', 'Director of Budgeting - MoD', 'MOD-Bud-00001', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'c2e3fdff-2b36-4ef9-9790-afbca0c53f57', 'Writer of Expenses - MoD', 'MOD-Bud-00002', 0, 0, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'c065c2b6-a04a-4ead-a3a2-5aabf921446d', 'Cost Adder - MoD', 'MOD-Bud-00003', 0, 0, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'731ee4f9-f21b-4166-b03d-d7ba5e7f735c', 'Chief of Police', 'MOI-Pol-HQ-00001', 0, 2, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'18f42d92-ada7-11eb-8529-0242ac130003', 'Chief of Tests', 'MOI-TST-HQ-00001', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'338e4d54-ada7-11eb-8529-0242ac130003', 'Director of Tests', 'MOD-TST-HQ-00001', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'25fe500c-3503-4ba8-a9a4-09b29b50c1f1', 'Merge One', 'MOD-M1-HQ-00001', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'e87f0f60-ad13-4c1c-96f7-672c595b81c7', 'Merge Two', 'MOD-M2-HQ-00001', 0, 2, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'885dd6bf-4647-4ef7-9bc4-4dd2826064bb', 'Chief of Merge People Test 1', 'MOI-MPT1-HQ-00001', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'4dc40a27-19ae-4e03-a4f3-55b2c768725f', 'Chief of Merge People Test 2', 'MOI-MPT2-HQ-00001', 0, 1, 0, NULL, (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Email addresses for interlocutor positions
INSERT INTO "emailAddresses" (network, address, "relatedObjectType", "relatedObjectUuid") VALUES
  ('Internet', 'minister@mod.example.com', 'positions', '879121d2-d265-4d26-8a2b-bd073caa474e'),
  ('Internet', 'chiefOfStaff@mod.example.com', 'positions', '1a45ccd6-40e3-4c51-baf5-15e7e9b8f03d'),
  ('Internet', 'executiveAssistant@mod.example.com', 'positions', '4be6baa5-c611-4c70-a2a8-c01bf9b7d2bc'),
  ('Internet', 'planningCaptain@mod.example.com', 'positions', 'a9ab507e-cda9-469b-8d9e-b47445852af4'),
  ('Internet', 'directorOfBudgeting@mod.example.com', 'positions', '61371573-eefc-4b85-81a0-27d6c0b78c58'),
  ('Internet', 'writerOfExpenses@mod.example.com', 'positions', 'c2e3fdff-2b36-4ef9-9790-afbca0c53f57'),
  ('Internet', 'costAdder@mod.example.com', 'positions', 'c065c2b6-a04a-4ead-a3a2-5aabf921446d'),
  ('Internet', 'chiefOfPolice@moi.example.com', 'positions', '731ee4f9-f21b-4166-b03d-d7ba5e7f735c'),
  ('Internet', 'chiefOfTests@moi.example.com', 'positions', '18f42d92-ada7-11eb-8529-0242ac130003'),
  ('Internet', 'directorOfTests@mod.example.com', 'positions', '338e4d54-ada7-11eb-8529-0242ac130003'),
  ('Internet', 'mergeOne@mod.example.com', 'positions', '25fe500c-3503-4ba8-a9a4-09b29b50c1f1'),
  ('Internet', 'chiefOfMergePeopleTest1@moi.example.com', 'positions', '885dd6bf-4647-4ef7-9bc4-4dd2826064bb'),
  ('Internet', 'chiefOfMergePeopleTest2@moi.example.com', 'positions', '4dc40a27-19ae-4e03-a4f3-55b2c768725f');

-- Put Steve into a Tashkil and associate with the EF 1.1 Advisor A Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Cost Adder - MoD'), (SELECT uuid from people where name = 'Steveson, Steve'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Steveson, Steve') WHERE name = 'Cost Adder - MoD';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid from positions WHERE name ='EF 1.1 Advisor A'),
  (SELECT uuid FROM positions WHERE name='Cost Adder - MoD'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Roger in a Tashkil and associate with the EF 2.1 Advisor B Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Police'), (SELECT uuid from people where name = 'Rogwell, Roger'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Rogwell, Roger') WHERE name = 'Chief of Police';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 2.1 Advisor B'),
  (SELECT uuid from positions WHERE name ='Chief of Police'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Christopf in a Tashkil and associate with the EF 2.2 Advisor D Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Planning Captain'), (SELECT uuid from people where name = 'Topferness, Christopf'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Topferness, Christopf') WHERE name = 'Planning Captain';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 2.2 Advisor D'),
  (SELECT uuid from positions WHERE name ='Planning Captain'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Chris in a Tashkil and associate with the EF 5.1 Advisor Accounting
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Tests'), (SELECT uuid from people where name = 'Chrisville, Chris'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Chrisville, Chris') WHERE name = 'Chief of Tests';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 5.1 Advisor Accounting'),
  (SELECT uuid from positions WHERE name ='Chief of Tests'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Kyle in a Tashkil and associate with the EF 5.1 Advisor Quality Assurance
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Director of Tests'), (SELECT uuid from people where name = 'Kyleson, Kyle'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Kyleson, Kyle') WHERE name = 'Director of Tests';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 5.1 Advisor Quality Assurance'),
  (SELECT uuid from positions WHERE name ='Director of Tests'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Myposwill in a Tashkil
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Merge One'), (SELECT uuid from people where name = 'Bemerged, Myposwill'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Bemerged, Myposwill') WHERE name = 'Merge One';
-- Associate Merge One and Merge Two positions with some advisor positions to test merging
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor B'), (SELECT uuid from positions WHERE name ='Merge One'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor C'), (SELECT uuid from positions WHERE name ='Merge One'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor C'), (SELECT uuid from positions WHERE name ='Merge Two'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor D'), (SELECT uuid from positions WHERE name ='Merge Two'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Winner Duplicate in a Tashkil
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Merge People Test 1'), (SELECT uuid from people where name = 'Merged, Duplicate Winner'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Merged, Duplicate Winner') WHERE name = 'Chief of Merge People Test 1';
-- Put Loser Duplicate in a Tashkil
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Merge People Test 2'), (SELECT uuid from people where name = 'Merged, Duplicate Loser'), '2020-01-01');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where name = 'Merged, Duplicate Loser') WHERE name = 'Chief of Merge People Test 2';

UPDATE positions SET "locationUuid" = (SELECT uuid from LOCATIONS where name = 'Kabul Police Academy') WHERE name = 'Chief of Police';
UPDATE positions SET "locationUuid" = (SELECT uuid from LOCATIONS where name = 'MoD Headquarters Kabul') WHERE name = 'Cost Adder - MoD';

-- Write a couple of reports!

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Discuss improvements in Annual Budgeting process',
  'Today I met with this dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
  'Meet with the dude again next week', 2, '2020-05-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), '9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5', TRUE, TRUE, FALSE);

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('86e4cf7e-c0ae-4bd9-b1ad-f2c65ca0f600', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='General Hospital'), 'Run through FY2016 Numbers on tool usage',
  'Today we discussed the fiscal details of how spreadsheets break down numbers into rows and columns and then text is used to fill up space on a web page, it was very interesting and other adjectives',
  'we read over the spreadsheets for the FY17 Budget',
  'meet with him again :(', 2, '2020-06-01', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), '86e4cf7e-c0ae-4bd9-b1ad-f2c65ca0f600', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where name = 'Rogwell, Roger'), '86e4cf7e-c0ae-4bd9-b1ad-f2c65ca0f600', FALSE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '86e4cf7e-c0ae-4bd9-b1ad-f2c65ca0f600', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), '86e4cf7e-c0ae-4bd9-b1ad-f2c65ca0f600'),
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), '86e4cf7e-c0ae-4bd9-b1ad-f2c65ca0f600');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('3e717721-d675-4ff3-b687-533b50978f9e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Kabul Hospital'), 'Looked at Hospital usage of Drugs',
  'This report needs to fill up more space',
  'putting something in the database to take up space',
  'to be more creative next time', 2, '2020-06-03', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), '3e717721-d675-4ff3-b687-533b50978f9e', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '3e717721-d675-4ff3-b687-533b50978f9e', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.C'), '3e717721-d675-4ff3-b687-533b50978f9e');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('5d11abd0-242b-41ef-8420-a931d19ee513', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Kabul Hospital'), 'discuss enagement of Doctors with Patients',
  'Met with Nobody in this engagement and discussed no tasks, what a waste of time',
  'None',
  'Head over to the MoD Headquarters buildling for the next engagement', 2, '2020-06-10', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), '5d11abd0-242b-41ef-8420-a931d19ee513', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '5d11abd0-242b-41ef-8420-a931d19ee513', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), '5d11abd0-242b-41ef-8420-a931d19ee513');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "releasedAt", "engagementDate", atmosphere, "atmosphereDetails", "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('ee0fc732-e6ed-4c53-9d74-a8ac1d8f3ccd', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='MoD Headquarters Kabul'), 'Meet with Leadership regarding monthly status update',
  'This engagement was sooooo interesting',
  'Meet up with Roger next week to look at the numbers on the charts', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2, 'Guy was grumpy',
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), 'ee0fc732-e6ed-4c53-9d74-a8ac1d8f3ccd', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'bob'), 'ee0fc732-e6ed-4c53-9d74-a8ac1d8f3ccd', TRUE, FALSE, FALSE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), 'ee0fc732-e6ed-4c53-9d74-a8ac1d8f3ccd', FALSE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), 'ee0fc732-e6ed-4c53-9d74-a8ac1d8f3ccd');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "releasedAt", "engagementDate", atmosphere, "atmosphereDetails", "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('c9884c73-31c5-441e-ad6b-350513e28b84', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Fort Amherst'), 'Inspect Ft Amherst Medical Budgeting Facility?',
  'Went over to the fort to look at the beds and the spreadsheets and the numbers and the whiteboards and the planning and all of the budgets. It was GREAT!',
  'Seeing the whiteboards firsthand',
  'head to Cabot Tower and inspect their whiteboards next week', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'Very good tea',
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Rogwell, Roger'), 'c9884c73-31c5-441e-ad6b-350513e28b84', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), 'c9884c73-31c5-441e-ad6b-350513e28b84', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), 'c9884c73-31c5-441e-ad6b-350513e28b84');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('5f681376-6eac-464d-8d46-02ff89d45071', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Cabot Tower'), 'Inspect Cabot Tower Budgeting Facility',
  'Looked over the places around Cabot Tower for all of the things that people do when they need to do math.  There were calculators, and slide rules, and paper, and computers',
  'keep writing fake reports to fill the database!!!', 1, '2020-06-20', 1,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), '5f681376-6eac-464d-8d46-02ff89d45071', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '5f681376-6eac-464d-8d46-02ff89d45071', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.C'), '5f681376-6eac-464d-8d46-02ff89d45071');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('5367a91a-9f70-469d-b0a4-69990ea8ac82', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Discuss discrepancies in monthly budgets',
  'Back to the hospital this week to test the recent locations feature of ANET, and also to look at math and numbers and budgets and things',
  'Meet with the dude again next week', 1, '2020-06-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), '5367a91a-9f70-469d-b0a4-69990ea8ac82', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '5367a91a-9f70-469d-b0a4-69990ea8ac82', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), '5367a91a-9f70-469d-b0a4-69990ea8ac82');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('3e0ef6c9-68ed-43cf-8beb-d24c1c59c7a5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='St Johns Airport'), 'Inspect Air Operations Capabilities',
  'We went to the Aiport and looked at the planes, and the hangers, and the other things that airports have. ',
  'Go over to the Airport next week to look at the helicopters', 2, '2020-05-20', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 1.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Rogwell, Roger'), '3e0ef6c9-68ed-43cf-8beb-d24c1c59c7a5', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'elizabeth'), '3e0ef6c9-68ed-43cf-8beb-d24c1c59c7a5', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '2.A'), '3e0ef6c9-68ed-43cf-8beb-d24c1c59c7a5');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('e5319bc4-91f2-473b-92c7-e796bc84b169', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='St Johns Airport'), 'Inspect Helicopter Capabilities',
  'Today we looked at the helicopters at the aiport and talked in depth about how they were not in good condition and the AAF needed new equipment.  I expressed my concerns to the pilots and promised to see what we can do.',
  'Figure out what can be done about the helicopters', 2, '2020-05-22', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 1.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Rogwell, Roger'), 'e5319bc4-91f2-473b-92c7-e796bc84b169', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'elizabeth'), 'e5319bc4-91f2-473b-92c7-e796bc84b169', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '2.A'), 'e5319bc4-91f2-473b-92c7-e796bc84b169');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('a766b3f1-4705-43c1-b62a-ca4e3bb4dce3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Look for Budget Controls',
  'Goal of the meeting was to look for the word spreadsheet in a report and then return that in a search result about budget. Lets see what happens!!',
  'Searching for text', 'Test Cases are good', 2, '2021-01-14', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Topferness, Christopf'), 'a766b3f1-4705-43c1-b62a-ca4e3bb4dce3', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'erin'), 'a766b3f1-4705-43c1-b62a-ca4e3bb4dce3', TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where "domainUsername" = 'reina'), 'a766b3f1-4705-43c1-b62a-ca4e3bb4dce3', FALSE, FALSE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), 'a766b3f1-4705-43c1-b62a-ca4e3bb4dce3');
INSERT INTO "reportsSensitiveInformation" (uuid, "createdAt", "updatedAt", text, "reportUuid") VALUES
  (uuid_generate_v4(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Need to know only', 'a766b3f1-4705-43c1-b62a-ca4e3bb4dce3');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('91cac8ff-dca5-4cf5-bf2c-dd72aa3685f8', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Look for Budget Controls Again',
  'The search for the spreadsheet was doomed to be successful, so we needed to generate more data in order to get a more full test of the system that really is going to have much much larger reports in it one day.',
  'Mocking up test cases','Better test data is always better', 2, '2021-01-04', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Topferness, Christopf'), '91cac8ff-dca5-4cf5-bf2c-dd72aa3685f8', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'erin'), '91cac8ff-dca5-4cf5-bf2c-dd72aa3685f8', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), '91cac8ff-dca5-4cf5-bf2c-dd72aa3685f8');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('3fa48376-0519-48ba-8d91-2fa18c7a040f', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Talk to the Interior about things',
  'We know that we want to go to the house with the food and eat the food, but the words in the database need to be long enough to do something. What that is were not sure, but we know we cant use apostrophies or spell.  Wow, we really cant do much, right? It was decided that we would do more tomorrow.',
  'Mocking up test cases','Looking at the telescope with our eyes', 2, '2021-01-04', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Topferness, Christopf'), '3fa48376-0519-48ba-8d91-2fa18c7a040f', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'erin'), '3fa48376-0519-48ba-8d91-2fa18c7a040f', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), '3fa48376-0519-48ba-8d91-2fa18c7a040f');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "cancelledReason", "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('a485a567-3e21-4219-9de7-2704c20a6f71', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Weekly Checkin with MG Somebody',
  'Meeting got cancelled',
  'Reschedule Meeting','', 4, CURRENT_TIMESTAMP, 0, 1,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "domainUsername" = 'erin'), 'a485a567-3e21-4219-9de7-2704c20a6f71', TRUE, TRUE, FALSE);

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid","customFields") VALUES
  ('59be259b-30b9-4d04-9e21-e8ceb58cbe9c', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'A test report from Arthur', '',
  'keep on testing!','have reports in organizations', 2, CURRENT_TIMESTAMP + INTERVAL '1 minute', 0,
  (SELECT uuid FROM organizations where "shortName" = 'ANET Administrators'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'),
   '{"invisibleCustomFields":["formCustomFields.trainingEvent","formCustomFields.numberTrained","formCustomFields.levelTrained","formCustomFields.trainingDate","formCustomFields.assetsUsed"],"itemsAgreed":[],"echelons":"Ut enim ad minim veniam","systemProcess":"","multipleButtons":["advise"],"additionalEngagementNeeded":[],"relatedObject":null,"relatedReport":null}');
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "domainUsername" = 'arthur'), '59be259b-30b9-4d04-9e21-e8ceb58cbe9c', TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where name = 'Sharton, Shardul'), '59be259b-30b9-4d04-9e21-e8ceb58cbe9c', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'lin'), '59be259b-30b9-4d04-9e21-e8ceb58cbe9c', FALSE, FALSE, FALSE),
  ((SELECT uuid FROM people where name = 'Kyleson, Kyle'), '59be259b-30b9-4d04-9e21-e8ceb58cbe9c', FALSE, FALSE, TRUE),
  ((SELECT uuid FROM people where name = 'Chrisville, Chris'), '59be259b-30b9-4d04-9e21-e8ceb58cbe9c', FALSE, FALSE, TRUE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.2.A'), '59be259b-30b9-4d04-9e21-e8ceb58cbe9c'),
  ((SELECT uuid from tasks where "shortName" = '1.2.B'), '59be259b-30b9-4d04-9e21-e8ceb58cbe9c');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid", "classification") VALUES
  ('c3008f90-6a27-4343-b278-827a0a0dc6bf', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'A classified report from Arthur', '',
  'keep on testing!', 'check the classification', 0, CURRENT_TIMESTAMP + INTERVAL '1 minute', 0,
  (SELECT uuid FROM organizations where "shortName" = 'ANET Administrators'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'), 'NU');
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "domainUsername" = 'arthur'), 'c3008f90-6a27-4343-b278-827a0a0dc6bf', TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where name = 'Sharton, Shardul'), 'c3008f90-6a27-4343-b278-827a0a0dc6bf', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'lin'), 'c3008f90-6a27-4343-b278-827a0a0dc6bf', FALSE, FALSE, FALSE),
  ((SELECT uuid FROM people where name = 'Kyleson, Kyle'), 'c3008f90-6a27-4343-b278-827a0a0dc6bf', FALSE, FALSE, TRUE),
  ((SELECT uuid FROM people where name = 'Chrisville, Chris'), 'c3008f90-6a27-4343-b278-827a0a0dc6bf', FALSE, FALSE, TRUE);

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('bb9dad1a-1c6c-45de-91e8-aecda261d21e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'A test report to be unpublished from Arthur', '',
  'I need to edit this report so unpublish it please','have reports in organizations', 2, CURRENT_TIMESTAMP + INTERVAL '1 minute', 0,
  (SELECT uuid FROM organizations where "shortName" = 'ANET Administrators'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "domainUsername" = 'arthur'), 'bb9dad1a-1c6c-45de-91e8-aecda261d21e', TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where name = 'Sharton, Shardul'), 'bb9dad1a-1c6c-45de-91e8-aecda261d21e', TRUE, FALSE, TRUE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.2.A'), 'bb9dad1a-1c6c-45de-91e8-aecda261d21e'),
  ((SELECT uuid from tasks where "shortName" = '1.2.B'), 'bb9dad1a-1c6c-45de-91e8-aecda261d21e');

INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('34265a98-7f82-4f16-b132-abcb60d307ad', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Test report with rich text',
  '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>Handle text without tags. <p>Handle the white space below</p> <p>'||chr(10)||'</p> <blockquote>Blockquote</blockquote><b>Bold</b> <i>Italic</i> <u>Underline</u> <strike>Strike</strike> <strike><b>BoldStrike</b></strike> <i><b>BoldItalic</b></i><ol><li>numbered list 1</li><li><p><b>numbered</b> list 2<p></li></ol><ul><li>bulleted list 1</li><li>bulleted list 2</li></ul>',
  'Keep testing', 0, '2022-08-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "domainUsername" = 'arthur'), '34265a98-7f82-4f16-b132-abcb60d307ad', TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '34265a98-7f82-4f16-b132-abcb60d307ad', FALSE, FALSE, FALSE);

-- Erin's Draft report
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid", "customFields") VALUES
  ('530b735e-1134-4daa-9e87-4491c888a4f7', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Erin''s Draft report, ready for submission',
  'This is just a draft.', 'This is just a draft.', 'This is just a draft.', 0, '2023-05-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'),
  '{"invisibleCustomFields":["formCustomFields.trainingEvent","formCustomFields.numberTrained","formCustomFields.levelTrained","formCustomFields.trainingDate","formCustomFields.systemProcess","formCustomFields.echelons","formCustomFields.itemsAgreed","formCustomFields.assetsUsed"],"multipleButtons":[],"additionalEngagementNeeded":[],"relatedObject":null,"relatedReport":null}');
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Topferness, Christopf'), '530b735e-1134-4daa-9e87-4491c888a4f7', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'erin'), '530b735e-1134-4daa-9e87-4491c888a4f7', TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '2.A'), '530b735e-1134-4daa-9e87-4491c888a4f7');

-- Release all of the reports right now, so they show up in the rollup.
UPDATE reports SET "releasedAt" = reports."createdAt" WHERE state = 2 OR state = 4;

--Create the default Approval Step
INSERT INTO "approvalSteps" (uuid, name, "relatedObjectUuid", type) VALUES
  (uuid_generate_v4(), 'Default Approvers', (select uuid from organizations where "shortName"='ANET Administrators'), 1);
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" where name = 'Default Approvers'), (SELECT uuid from positions where name = 'ANET Administrator'));

-- Set "approvalStepUuids" from organizations with default
UPDATE reports SET
"approvalStepUuid" = (SELECT uuid FROM "approvalSteps" WHERE name = 'Default Approvers')
WHERE reports.uuid IN
(SELECT reports.uuid FROM reports
INNER JOIN "reportPeople" ON reports.uuid = "reportPeople"."reportUuid" AND "reportPeople"."isAuthor"= TRUE
INNER JOIN people ON "reportPeople"."personUuid" = people.uuid
INNER JOIN positions ON people.uuid = positions."currentPersonUuid"
INNER JOIN organizations ON positions."organizationUuid" = organizations.uuid
WHERE "approvalStepUuid" IS NULL AND reports.state = 1);

--Set the Admin Settings
INSERT INTO "adminSettings" (key, value) VALUES
  ('DEFAULT_APPROVAL_ORGANIZATION', (select uuid from organizations where "shortName"='ANET Administrators')),
  ('HELP_LINK_URL', 'http://google.com'),
  ('CONTACT_EMAIL', 'team-anet@example.com'),
  ('DAILY_ROLLUP_MAX_REPORT_AGE_DAYS', '14'),
  ('EXTERNAL_DOCUMENTATION_LINK_TEXT', ''),
  ('EXTERNAL_DOCUMENTATION_LINK_URL', ''),
  ('GENERAL_BANNER_TEXT', ''),
  ('GENERAL_BANNER_LEVEL', 'notice'),
  ('GENERAL_BANNER_VISIBILITY', '1'),
  ('UNLIMITED_EXPORTS_AUTHORIZATION_GROUP', '89d8d60a-f3ff-4fa6-8246-805fd74d14fd');

-- System user, used when importing data that can't be linked to any specific user
INSERT INTO PEOPLE (uuid, name, status, "createdAt", "updatedAt")
  SELECT 'a163cd6f-98ac-4a61-896c-9444dd1293af', 'ANET Importer', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  WHERE NOT EXISTS (SELECT uuid FROM people WHERE name = 'ANET Importer');

-- Tag some reports
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('0daa2cc7-29a3-4884-bb3a-1659d8a3962d', 'a163cd6f-98ac-4a61-896c-9444dd1293af', 0,
    'Previously tagged as bribery - Giving/Promising money or something valuable to corrupt the behavior of a public official',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '0daa2cc7-29a3-4884-bb3a-1659d8a3962d', 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('0', '2', '4', '6', '8', 'a', 'c', 'e')
  AND r.state != 0;

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('7adbc0d1-780d-4aeb-810e-6439d55373b3', 'a163cd6f-98ac-4a61-896c-9444dd1293af', 0,
    'Previously tagged as embezzlement - Steal or misappropriate money from the organization the person works for',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '7adbc0d1-780d-4aeb-810e-6439d55373b3', 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('0', '3', '6', '9', 'c', 'f')
  AND r.state != 0;

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('01463629-8670-475f-9e0a-a1bf594f9eda', 'a163cd6f-98ac-4a61-896c-9444dd1293af', 0,
    'Previously tagged as patronage - Leaders illegally appointing someone to a position',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '01463629-8670-475f-9e0a-a1bf594f9eda', 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('1', '3', '5', '7', '9', 'b', 'd', 'f')
  AND r.state != 0;

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('a6074894-4ad7-4aa4-ab0c-f9b4b2701a1a', 'a163cd6f-98ac-4a61-896c-9444dd1293af', 0,
    'Previously tagged as facilitation payment - Payment made to a government official that acts as an incentive to complete an action quickly',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'a6074894-4ad7-4aa4-ab0c-f9b4b2701a1a', 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('1', '4', '7', 'a', 'd')
  AND r.state != 0;

-- Insert report with created at and updated at date for two days before current timestamp
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  ('8655bf58-4452-4ac0-9221-70b035d8eb7e', CURRENT_TIMESTAMP + INTERVAL '-2 day', CURRENT_TIMESTAMP + INTERVAL '-2 day', (SELECT uuid from locations where name='General Hospital'), 'Discuss further improvements in Annual Budgeting process',
  'Today I met with Edwin the dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
  'Meet with the dude again next week', 2, '2020-05-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where name = 'Steveson, Steve'), '8655bf58-4452-4ac0-9221-70b035d8eb7e', TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "domainUsername" = 'jack'), '8655bf58-4452-4ac0-9221-70b035d8eb7e', TRUE, TRUE, FALSE);

-- Authorization groups
INSERT INTO "authorizationGroups" (uuid, name, description, status, "createdAt", "updatedAt") VALUES
  ('1050c9e3-e679-4c60-8bdc-5139fbc1c10b', 'EF 1.1', 'The complete EF 1.1 organisation', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('39a78d51-c351-452c-9206-4305ec8dd76d', 'EF 2.1', 'The complete EF 2.1 organisation', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c21e7321-7ec5-4837-8805-a302f9575754', 'EF 2.2', 'The complete EF 2.2 organisation', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ab1a7d99-4529-44b1-a118-bdee3ca8296b', 'EF 5', 'The complete EF 5 organization', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('89d8d60a-f3ff-4fa6-8246-805fd74d14fd', 'Unlimited exporters', 'Unlimited exporters', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('90a5196d-acf3-4a81-8ff9-3a8c7acabdf3', 'Inactive positions', 'Inactive positions', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Authorization group members
INSERT INTO "authorizationGroupRelatedObjects" ("authorizationGroupUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '1050c9e3-e679-4c60-8bdc-5139fbc1c10b', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" = 'EF 1.1';
INSERT INTO "authorizationGroupRelatedObjects" ("authorizationGroupUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '39a78d51-c351-452c-9206-4305ec8dd76d', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" = 'EF 2.1';
INSERT INTO "authorizationGroupRelatedObjects" ("authorizationGroupUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'c21e7321-7ec5-4837-8805-a302f9575754', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" = 'EF 2.2';
INSERT INTO "authorizationGroupRelatedObjects" ("authorizationGroupUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'ab1a7d99-4529-44b1-a118-bdee3ca8296b', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" = 'EF 5';
INSERT INTO "authorizationGroupRelatedObjects" ("authorizationGroupUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '90a5196d-acf3-4a81-8ff9-3a8c7acabdf3', 'positions', p.uuid
  FROM positions p
  WHERE p.status = 1;

-- Report authorization groups for reports with sensitive information
INSERT INTO "reportAuthorizationGroups" ("reportUuid", "authorizationGroupUuid")
  SELECT DISTINCT rp."reportUuid", agro."authorizationGroupUuid"
  FROM "reportPeople" rp
  JOIN people p ON p.uuid = rp."personUuid" AND rp."isPrimary"= TRUE
  JOIN "peoplePositions" pp on pp."personUuid" = p.uuid
  JOIN positions pos on pp."positionUuid" = pos.uuid,
  "authorizationGroupRelatedObjects" agro
  WHERE EXISTS (
    SELECT *
    FROM "reportsSensitiveInformation" rsi
    WHERE rsi."reportUuid" = rp."reportUuid"
  )
  AND agro."relatedObjectType" = 'organizations'
  AND pos."organizationUuid" = agro."relatedObjectUuid"
  AND NOT EXISTS (
    SELECT *
    FROM "reportAuthorizationGroups" rap
    WHERE rap."reportUuid" = rp."reportUuid"
    AND rap."authorizationGroupUuid" = agro."authorizationGroupUuid"
  );

-- Create "customSensitiveInformation" for some interlocutors
INSERT INTO "customSensitiveInformation" (uuid, "customFieldName", "customFieldValue", "relatedObjectType", "relatedObjectUuid", "createdAt", "updatedAt") VALUES
  -- Steve
  ('4263793a-18bc-4cef-a535-0116615301e1', 'birthday', '{"birthday":"1999-09-09T00:00:00.000Z"}', 'people', '90fa5784-9e63-4353-8119-357bcd88e287', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c9ca5fd9-699e-4643-8025-91a2f2e0cd77', 'politicalPosition', '{"politicalPosition":"LEFT"}', 'people', '90fa5784-9e63-4353-8119-357bcd88e287', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  -- Roger
  ('84b46418-4350-4b52-8789-2b292fc0ab60', 'birthday', '{"birthday":"2001-01-01T00:00:00.000Z"}', 'people', '6866ce4d-1f8c-4f78-bdc2-4767e9a859b0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('810cf44b-91f6-474a-b522-5ba822ccfc1c', 'politicalPosition', '{"politicalPosition":"RIGHT"}', 'people', '6866ce4d-1f8c-4f78-bdc2-4767e9a859b0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  -- Merged, Duplicate Winner
  ('efae3b21-f9da-4e05-b646-06f05037ef84', 'birthday', '{"birthday":"2003-01-31T23:00:00.000Z"}', 'people', '3cb2076c-5317-47fe-86ad-76f298993917', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c7ccac90-02cb-4908-84b3-0c9d0dc99223', 'politicalPosition', '{"politicalPosition":"MIDDLE"}', 'people', '3cb2076c-5317-47fe-86ad-76f298993917', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  -- Merged, Duplicate Loser
  ('f53cebc8-0516-4ba3-8866-8f78c417d26b', 'birthday', '{"birthday":"2010-11-11T23:00:00.000Z"}', 'people', 'c725aef3-cdd1-4baf-ac72-f28219b234e9', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a7a03d68-7e9a-4697-afec-5b3ca6f17fad', 'politicalPosition', '{"politicalPosition":"MIDDLE"}', 'people', 'c725aef3-cdd1-4baf-ac72-f28219b234e9', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add some notes and link them to the objects they relate to
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('2c2272f9-a391-45b0-8b87-4660285a1aea', 'f683335a-91e3-4788-aa3f-9eed384f4ac1', 0, 'A really nice person to work with', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '2c2272f9-a391-45b0-8b87-4660285a1aea', 'people', p.uuid
  FROM people p
  WHERE p.rank = 'CIV';

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('d28cacfd-64b6-4c54-8e66-005669411803', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 0, '<em>This position should always be filled!</em>', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'd28cacfd-64b6-4c54-8e66-005669411803', 'positions', p.uuid
  FROM positions p
  WHERE p.type = 3;

-- Add notes to the positions that will be merged
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('209e3c8b-25c1-4020-80ca-0fe575fdb821', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 0, 'Merge one position note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '209e3c8b-25c1-4020-80ca-0fe575fdb821', 'positions', p.uuid
  FROM positions p
  WHERE p.uuid = '25fe500c-3503-4ba8-a9a4-09b29b50c1f1';

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('0892f17b-24a5-4e23-a00a-2e2bc0af97fa', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 0, 'Merge two position note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '0892f17b-24a5-4e23-a00a-2e2bc0af97fa', 'positions', p.uuid
  FROM positions p
  WHERE p.uuid = 'e87f0f60-ad13-4c1c-96f7-672c595b81c7';

-- Add notes to the people that will be merged
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('990d3165-a5e9-4980-9a05-6658412bd6ec', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 0, 'Merge one person note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '990d3165-a5e9-4980-9a05-6658412bd6ec', 'people', p.uuid
  FROM people p
  WHERE p.uuid = '3cb2076c-5317-47fe-86ad-76f298993917';

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('b3546f3e-0af6-402c-91ce-09edb7fb1645', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 0, 'Merge two person note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'b3546f3e-0af6-402c-91ce-09edb7fb1645', 'people', p.uuid
  FROM people p
  WHERE p.uuid = 'c725aef3-cdd1-4baf-ac72-f28219b234e9';

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('dfcb475c-f7fb-4cbf-9cd0-e10b830fcfaf', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 0, 'Check out this report, it is really positive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'dfcb475c-f7fb-4cbf-9cd0-e10b830fcfaf', 'reports', r.uuid
  FROM reports r
  WHERE r.atmosphere = 0
  AND r.state != 0;

INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  ('edceeb21-7587-456d-800d-b6f8b6058c19', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 0, 'Report text contains some valuable information, especially for the next meeting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'edceeb21-7587-456d-800d-b6f8b6058c19', 'reports', r.uuid
  FROM reports r
  WHERE r.text LIKE 'Today%';

-- Add ondemand assessments to MOD-F and EF 6.2
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('41ed76fa-7446-462b-9dd2-01b710bda199', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.organization.assessments.interactionPlan', '{"exercises":null,"interaction":"<p>Keep in constant contact</p>","plan":"<p>Organise a face to face meeting</p>","relation":"","priority":"","assessmentDate":"2021-01-01","__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '41ed76fa-7446-462b-9dd2-01b710bda199', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" IN ('MOD-F', 'EF 6.2');

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('da89afa6-2550-4443-b310-d1519583caa5', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.organization.assessments.interactionPlan', '{"exercises":null,"interaction":"<p>In constant contact</p>","plan":null,"relation":"maintain","priority":"t1","assessmentDate":"2022-01-01","__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'da89afa6-2550-4443-b310-d1519583caa5', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" IN ('MOD-F', 'EF 6.2');

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('5e10b957-13b9-4725-977a-2fcdfca7b4ea', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.organization.assessments.interactionPlan', '{"exercises":null,"interaction":"<p>Some interaction took place</p>","plan":"<p>Maintain relationship</p>","relation":"","priority":"t2","assessmentDate":"2023-01-01","__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '5e10b957-13b9-4725-977a-2fcdfca7b4ea', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" IN ('MOD-F', 'EF 6.2');

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('566ab80f-c4ba-4d46-a9e3-fe2bf8a2396d', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.organization.assessments.organizationOndemand', '{"question1":"<p>First time</p>","enumset":[],"assessmentDate":"2023-09-30","expirationDate":null,"__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '566ab80f-c4ba-4d46-a9e3-fe2bf8a2396d', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" IN ('MOD-F', 'EF 6.2');

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('27f67faf-6c86-4c87-82cb-17509c16fb8a', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.organization.assessments.organizationOndemand', '{"question1":"<p>Second time</p>","enumset":["t4"],"assessmentDate":"2023-10-01","expirationDate":null,"__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '27f67faf-6c86-4c87-82cb-17509c16fb8a', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" IN ('MOD-F', 'EF 6.2');

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('fb2709ad-0fc6-4796-8946-df7dfc816c83', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.organization.assessments.organizationOndemand', '{"question1":"<p>Third time</p>","enumset":["t1","t2","t3","t5"],"assessmentDate":"2023-10-02","expirationDate":"2037-12-31","__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'fb2709ad-0fc6-4796-8946-df7dfc816c83', 'organizations', o.uuid
  FROM organizations o
  WHERE o."shortName" IN ('MOD-F', 'EF 6.2');

-- Add ondemand assessments to Christopf
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('16942947-41c2-478c-93bd-aaf7192a0e77', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.regular.person.assessments.interlocutorOndemandScreeningAndVetting', '{"question2":null,"question1":"fail3","expirationDate":"2024-10-31","assessmentDate":"2024-09-28","questionForChristopf":"c","__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '16942947-41c2-478c-93bd-aaf7192a0e77', 'people', p.uuid
  FROM people p
  WHERE p.name = 'Topferness, Christopf';

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('252c76e3-979a-4e47-9fde-4683de7556e8', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.regular.person.assessments.interlocutorOndemandScreeningAndVetting', '{"question2":null,"question1":"fail2","expirationDate":null,"assessmentDate":"2024-09-30","questionForChristopf":"b","__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '252c76e3-979a-4e47-9fde-4683de7556e8', 'people', p.uuid
  FROM people p
  WHERE p.name = 'Topferness, Christopf';

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('e910f029-8aef-4440-a870-2711b2d8ffc9', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.regular.person.assessments.interlocutorOndemandScreeningAndVetting', '{"question2":null,"question1":"fail1","expirationDate":"2024-10-02","assessmentDate":"2024-10-01","questionForChristopf":"a","__recurrence":"ondemand"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'e910f029-8aef-4440-a870-2711b2d8ffc9', 'people', p.uuid
  FROM people p
  WHERE p.name = 'Topferness, Christopf';

-- Add instant assessments to tasks related to reports
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('af6165ac-3823-42bf-9e58-a39872701057', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.task.assessments.taskOnceReport', '{"__recurrence":"once","__relatedObjectType":"report","question1":4.462819020045945,"question2":"1","question3":"22"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'af6165ac-3823-42bf-9e58-a39872701057', 'reports', r.uuid
  FROM reports r
  WHERE r.intent = 'A test report from Arthur';
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'af6165ac-3823-42bf-9e58-a39872701057', 'tasks', t.uuid
  FROM tasks t
  WHERE t."shortName" = '1.2.A';

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('d92e5f9c-b6b4-436f-917d-31bd66bdccf4', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 3, 'fields.task.assessments.taskOnceReport', '{"__recurrence":"once","__relatedObjectType":"report","question1":3.141592653589793,"question2":"3","question3":"14"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'd92e5f9c-b6b4-436f-917d-31bd66bdccf4', 'reports', r.uuid
  FROM reports r
  WHERE r.intent = 'A test report from Arthur';
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'd92e5f9c-b6b4-436f-917d-31bd66bdccf4', 'tasks', t.uuid
  FROM tasks t
  WHERE t."shortName" = '1.2.B';

-- Add periodic assessment for a task
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('be9fdb3c-2bc1-412a-aca9-cc009cbd3314', '1a557db0-5af5-4ea3-b926-28b5f2e88bf7', 3, 'fields.task.assessments.taskMonthly', '{"status":"GREEN","issues":"<ol><li>one</li><li>two</li><li>three</li></ol>","__recurrence":"monthly","__periodStart":"' || to_char(date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '-1 month', 'YYYY-MM-DD') || '"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'be9fdb3c-2bc1-412a-aca9-cc009cbd3314', 'tasks', t.uuid
  FROM tasks t
  WHERE t."shortName" = '1.1.A';

-- Add periodic assessments for a person
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('995d37c0-1838-4405-996c-6a70ec3e9760', 'b5d495af-44d5-4c35-851a-1039352a8307', 3, 'fields.regular.person.assessments.interlocutorQuarterly', '{"test3":"3","test2":"3","test1":"3","__recurrence":"quarterly","__periodStart":"' || to_char(date_trunc('quarter', CURRENT_TIMESTAMP) + INTERVAL '-3 month', 'YYYY-MM-DD') || '"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '995d37c0-1838-4405-996c-6a70ec3e9760', 'people', p.uuid
  FROM people p
  WHERE p.name = 'Rogwell, Roger';

INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  ('4af97017-617d-41ee-93cf-4ab92ef15902', 'b5d495af-44d5-4c35-851a-1039352a8307', 3, 'fields.regular.person.assessments.interlocutorMonthly', '{"text":"sample text","__recurrence":"monthly","__periodStart":"' || to_char(date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '-1 month', 'YYYY-MM-DD') || '"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '4af97017-617d-41ee-93cf-4ab92ef15902', 'people', p.uuid
  FROM people p
  WHERE p.name = 'Rogwell, Roger';

-- Add attachments for reports
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt")
	VALUES ('f076406f-1a9b-4fc9-8ab2-cd2a138ec26d', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'attachReport.png', 'Arthur''s test report', 'image/png', lo_import('/var/tmp/assets/default_avatar.png'), 12316, 'We can add attachments to a report', 'NU', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'f076406f-1a9b-4fc9-8ab2-cd2a138ec26d', 'reports', r.uuid
  FROM reports r
  WHERE r.intent = 'A test report from Arthur';

-- Add attachments for locations
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt")
	VALUES ('f7cd5b02-ef73-4ee8-814b-c5a7a916685d', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'attachLocation.png', 'Antarctica', 'image/png', lo_import('/var/tmp/assets/default_avatar.png'), 12316, 'We can add attachments to a location', 'NU_rel_EU', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'f7cd5b02-ef73-4ee8-814b-c5a7a916685d', 'locations', loc.uuid
  FROM locations loc
  WHERE loc.name = 'Antarctica';

-- Add attachments for organizations
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt") VALUES
  ('9ac41246-25ac-457c-b7d6-946c5f625f1f', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'attachOrganization.png', 'EF 2.2', 'image/png', lo_import('/var/tmp/assets/default_avatar.png'), 12316, 'We can add attachments to an organization', 'public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e32b6c9d-45d5-41db-b45a-123ed1975602', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'avatar', 'Merge Org 1', 'image/svg+xml', lo_import('/var/tmp/assets/organization_avatar1.svg'), 2736, NULL, 'public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('5408075e-9126-4201-a631-f72ffe8b54e5', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'avatar', 'Merge Org 2', 'image/svg+xml', lo_import('/var/tmp/assets/organization_avatar2.svg'), 2928, NULL, 'public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid") VALUES
  ('9ac41246-25ac-457c-b7d6-946c5f625f1f', 'organizations', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b'),
  ('e32b6c9d-45d5-41db-b45a-123ed1975602', 'organizations', '381d5435-8852-45d2-91b1-530560ca9d8c'),
  ('5408075e-9126-4201-a631-f72ffe8b54e5', 'organizations', 'e706f443-7d4d-4356-82bc-1456f55e3d75');

-- Add entity avatars for organizations
INSERT INTO "entityAvatars" ("relatedObjectType", "relatedObjectUuid", "attachmentUuid", "applyCrop", "cropLeft", "cropTop", "cropWidth", "cropHeight") VALUES
  ('organizations', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b', '9ac41246-25ac-457c-b7d6-946c5f625f1f', TRUE, 0, 0, 200, 200),
  ('organizations', '381d5435-8852-45d2-91b1-530560ca9d8c', 'e32b6c9d-45d5-41db-b45a-123ed1975602', FALSE, 0, 0, 0, 0),
  ('organizations', 'e706f443-7d4d-4356-82bc-1456f55e3d75', '5408075e-9126-4201-a631-f72ffe8b54e5', FALSE, 0, 0, 0, 0);

-- Add attachments for people
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt") VALUES
  ('3187ad8a-6130-4ec0-bffc-9ebfad4dee39', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'attachPerson.png', 'Michael', 'image/png', lo_import('/var/tmp/assets/default_avatar.png'), 12316, 'We can add attachments to a person', 'public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('13318e42-a0a3-438f-8ed5-dc16b1ef17bc', '87fdbc6a-3109-4e11-9702-a894d6ca31ef', 'attachPerson.png', 'Erin', 'image/png', lo_import('/var/tmp/assets/default_avatar.png'), 12316, 'We can add attachments to a person', 'public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid") VALUES
  ('3187ad8a-6130-4ec0-bffc-9ebfad4dee39', 'people', '46ba6a73-0cd7-4efb-8e99-215e98cc5987'),
  ('13318e42-a0a3-438f-8ed5-dc16b1ef17bc', 'people', 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9');

-- Add entity avatars for people
INSERT INTO "entityAvatars" ("relatedObjectType", "relatedObjectUuid", "attachmentUuid", "applyCrop", "cropLeft", "cropTop", "cropWidth", "cropHeight") VALUES
  ('people', '46ba6a73-0cd7-4efb-8e99-215e98cc5987', '3187ad8a-6130-4ec0-bffc-9ebfad4dee39', TRUE, 0, 0, 200, 200);

-- Add event series
INSERT INTO "eventSeries" (uuid, name, description, status, "createdAt", "updatedAt", "ownerOrgUuid", "hostOrgUuid", "adminOrgUuid") VALUES
  ('b7b70191-54e4-462f-8e40-679dd2e71ec4', 'NMI PDT', 'NMI pre-deployment training', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
   'ccbee4bb-08b8-42df-8cb5-65e8172f657b', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b');

-- Add event
INSERT INTO events (uuid, name, description, status, "createdAt", "updatedAt", "locationUuid", "eventSeriesUuid", "ownerOrgUuid", "hostOrgUuid", "adminOrgUuid", "startDate", "endDate", type) VALUES
  ('e850846e-9741-40e8-bc51-4dccc30cf47f', 'NMI PDT 2024-01', 'NMI pre-deployment training 2024 January', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
   '0855fb0a-995e-4a79-a132-4024ee2983ff', 'b7b70191-54e4-462f-8e40-679dd2e71ec4',
   'ccbee4bb-08b8-42df-8cb5-65e8172f657b', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b', 'ccbee4bb-08b8-42df-8cb5-65e8172f657b',
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'CONFERENCE');

-- Add tasks, organizations and people to the event
INSERT INTO "eventTasks" ("eventUuid", "taskUuid") VALUES
  ((select uuid from events where name = 'NMI PDT 2024-01'), '9d3da7f4-8266-47af-b518-995f587250c9');
INSERT INTO "eventOrganizations" ("eventUuid", "organizationUuid") VALUES
  ((select uuid from events where name = 'NMI PDT 2024-01'), 'ccbee4bb-08b8-42df-8cb5-65e8172f657b');
INSERT INTO "eventPeople" ("eventUuid", "personUuid") VALUES
  ((select uuid from events where name = 'NMI PDT 2024-01'), 'df9c7381-56ac-4bc5-8e24-ec524bccd7e9');

-- Assign existing report to event
UPDATE reports SET "eventUuid" = 'e850846e-9741-40e8-bc51-4dccc30cf47f' WHERE uuid = '86e4cf7e-c0ae-4bd9-b1ad-f2c65ca0f600';

-- Insert a sample web service access token
INSERT INTO "accessTokens" (uuid, name, description, "tokenHash", "createdAt", "expiresAt") VALUES
  -- token value is 'XfayXIGGC4vKu5j9UEgAAbZYj50v88Zv'
  -- you can generate new tokens with e.g.:
  -- dd if=/dev/urandom bs=24 count=1 | base64 | ( read r; echo -ne "Token value = $r\nToken hash = " >&2; echo -n $r ) | openssl dgst -binary -sha256 | openssl base64
  ('2e45aef0-b9de-4818-be95-b0cc2aececfc', 'Sample Web Service Access Token', 'A sample web service access token for the NVG Web Service', 'AaEge0eLJTP25aRAA5jIZxyzvejJBxPk+kAJDpv+5nc=', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '10 years');

-- Add mart imported reports for testing
INSERT INTO "martImportedReports" ("personUuid", "reportUuid", "success", "createdAt", "errors") VALUES
    ('87fdbc6a-3109-4e11-9702-a894d6ca31ef', '59be259b-30b9-4d04-9e21-e8ceb58cbe9c', TRUE, CURRENT_TIMESTAMP, 'some error');

-- Update the link-text indexes
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_lts_attachments";
-- authorizationGroups currently have no links
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_lts_locations";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_lts_organizations";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_lts_people";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_lts_positions";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_lts_reports";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_lts_tasks";

-- Update the full-text indexes
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_attachments";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_authorizationGroups";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_locations";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_organizations";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_people";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_positions";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_reports";
REFRESH MATERIALIZED VIEW CONCURRENTLY "mv_fts_tasks";

-- LEAVE THIS AS LAST STATEMENT
-- Truncate all the dates (on reports etc.) to dates that could have been generated by
-- Java (millisecond precision) rather than by the database itself (microsecond precision)
UPDATE reports SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt"),
  "releasedAt"=date_trunc('milliseconds', "releasedAt"),
  "engagementDate"=date_trunc('second', "engagementDate");
UPDATE people SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt"),
  "endOfTourDate"=date_trunc('second', "endOfTourDate");
UPDATE positions SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt");
UPDATE "peoplePositions" SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "endedAt"=date_trunc('milliseconds', "endedAt");
UPDATE organizations SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt");
UPDATE tasks SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt"),
  "plannedCompletion"=date_trunc('second', "updatedAt"),
  "projectedCompletion"=date_trunc('second', "updatedAt");
UPDATE locations SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt");
UPDATE "authorizationGroups" SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt");
UPDATE notes SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt");
UPDATE attachments SET
  "createdAt"=date_trunc('milliseconds', "createdAt"),
  "updatedAt"=date_trunc('milliseconds', "updatedAt");
