-- Do a cascading TRUNCATE of all tables created for ANET
TRUNCATE TABLE "adminSettings" CASCADE;
TRUNCATE TABLE "approvalSteps" CASCADE;
TRUNCATE TABLE "approvers" CASCADE;
TRUNCATE TABLE "attachments" CASCADE;
TRUNCATE TABLE "attachmentRelatedObjects" CASCADE;
TRUNCATE TABLE "authorizationGroupRelatedObjects" CASCADE;
TRUNCATE TABLE "authorizationGroups" CASCADE;
TRUNCATE TABLE "comments" CASCADE;
TRUNCATE TABLE "customSensitiveInformation" CASCADE;
TRUNCATE TABLE "jobHistory" CASCADE;
TRUNCATE TABLE "locations" CASCADE;
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

--Advisors
INSERT INTO people (uuid, name, status, "emailAddress", "phoneNumber", rank, biography, "user", "domainUsername", "openIdSubject", country, gender, "endOfTourDate", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'JACKSON, Jack', 0, 'hunter+jack@example.com', '123-456-78960', 'OF-9', 'Jack is an advisor in EF 2.1', true, 'jack', '89003390-168e-4dc3-a582-5b38ae264bdd', 'Germany', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'ELIZAWELL, Elizabeth', 0, 'hunter+liz@example.com', '+1-777-7777', 'Capt', 'Elizabeth is a test advisor we have in the database who is in EF 1.1', true, 'elizabeth', '06547ee2-dcc3-420c-96cb-5f3bb3793b4d', 'United States of America', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00b19ebf-0d4d-4b0f-93c8-9023ccb59c49', 'SOLENOID, Selena', 0, 'hunter+selena@example.com', '+1-111-1111', 'CIV', 'Selena is a test advisor in EF 1.2', true, 'selena', 'ce1df48e-fd6e-4dc4-bc00-9bb65a0d6910', 'United States of America', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('df9c7381-56ac-4bc5-8e24-ec524bccd7e9', 'ERINSON, Erin', 0, 'hunter+erin@example.com', '+9-23-2323-2323', 'CIV', 'Erin is an Advisor in EF 2.2 who can approve reports', true, 'erin', '04c29bab-7b20-4ff2-8583-8ad3dbcff4d6', 'Australia', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'REINTON, Reina', 0, 'hunter+reina@example.com', '+23-23-11222', 'CIV', 'Reina is an Advisor in EF 2.2', true, 'reina', '5b585887-1c3d-4f47-bccb-cdfebfd6e919', 'Italy', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('39d02d26-49eb-43b5-9cec-344777213a67', 'DVISOR, A', 0, 'hunter+advisor@example.com', '+444-44-4444', 'OF-2', 'A Dvisor was born for this job', true, 'advisor', 'd09a55cf-6aa4-4bbf-8bf3-055ddcb4d27c', 'Canada', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'31cba227-f6c6-49e9-9483-fce441bea624', 'BRATTON, Creed', 0, 'creed+bratton@example.com', '+444-44-4444', 'CIV', 'Let me first settle in.', true, 'creed', 'efad3f0d-3cd0-40fc-ac7e-90a1fa343e89', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'MALONE, Kevin', 0, 'kevin+malone@example.com', '+444-44-4444', 'CIV', 'Sometimes numbers just dont add up.', true, 'kevin', 'cf05120c-bb43-408f-93ac-609c996a9da5', 'United States of America', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'GUIST, Lin', 0, 'lin+guist@example.com', '+444-44-4444', 'CIV', 'Lin can speak so many languages', true, 'lin', 'd8d9eb8f-acfd-40fa-91c7-1ddc4401b8da', 'United States of America', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'PRETER, Inter', 0, 'inter+preter@example.com', '+444-44-4444', 'CIV', 'Inter is fluent in various languages', true, 'inter', '7a17af5d-7863-47b5-8034-4e2f79f3fa0b', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Advisor with no position for testing
  (uuid_generate_v4(), 'NOPOSITION, Ihave', 0, 'hunter+noPosition@example.com', '+444-44-4545', 'OF-2', 'I need a career change', true, 'nopos', 'e88f6157-61bf-4d43-96eb-f65a91d927c0', 'Canada', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'REPORTGUY, Ima', 0, 'ima+reportguy@example.com', '+444-44-4545', 'CIV', 'I need a career change', true, 'reportguy', NULL, 'France', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'REPORTGIRL, Ima', 0, 'ima+reportgirl@example.com', '+444-44-4545', 'CIV', 'I need a career change', true, 'reportgirl', NULL, 'Mexico', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Interlocutors
  ('90fa5784-9e63-4353-8119-357bcd88e287', 'STEVESON, Steve', 0, 'hunter+steve@example.com', '+011-232-12324', 'LtCol', 'this is a sample person who could be a Interlocutor!', false, NULL, NULL, 'Afghanistan', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('6866ce4d-1f8c-4f78-bdc2-4767e9a859b0', 'ROGWELL, Roger', 0, 'hunter+roger@example.com', '+1-412-7324', 'Maj', 'Roger is another test person we have in the database', false, NULL, NULL, 'Afghanistan', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('237e8bf7-2ae4-4d49-b7c8-eca6a92d4767', 'TOPFERNESS, Christopf', 0, 'hunter+christopf@example.com', '+1-422222222', 'CIV', 'Christopf works in the MoD Office', false, NULL, NULL, 'Afghanistan', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'CHRISVILLE, Chris', 0, 'chrisville+chris@example.com', '+1-412-7324', 'Maj', 'Chris is another test person we have in the database', false, NULL, NULL, 'Afghanistan', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'KYLESON, Kyle', 0, 'kyleson+kyle@example.com', '+1-412-7324', 'CIV', 'Kyle is another test person we have in the database', false, NULL, NULL, 'Afghanistan', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'BEMERGED, Myposwill', 0, 'bemerged+myposwill@example.com', '+1-412-7324', 'CIV', 'Myposwill is a test person whose position will be merged', false, NULL, NULL, 'Afghanistan', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('3cb2076c-5317-47fe-86ad-76f298993917', 'MERGED, Duplicate Winner', 0, 'merged+winner@example.com', '+1-234-5678', 'CIV', 'Winner is a test person who will be merged', false, NULL, NULL, 'Afghanistan', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c725aef3-cdd1-4baf-ac72-f28219b234e9', 'MERGED, Duplicate Loser', 0, 'merged+loser@example.com', '+1-876-5432', 'CTR', 'Loser is a test person who will be merged', false, NULL, NULL, 'Afghanistan', 'FEMALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Superusers
  (uuid_generate_v4(), 'BOBTOWN, Bob', 0, 'hunter+bob@example.com', '+1-444-7324', 'CIV', 'Bob is a Superuser in EF 1.1', true, 'bob', '505c6bd9-e2d1-4f9e-83b0-ecc9279c42c5', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'HENDERSON, Henry', 0, 'hunter+henry@example.com', '+2-456-7324', 'BGen', 'Henry is a Superuser in EF 2.1', true, 'henry', '04fbbc19-3bd9-4075-8dd8-bc8c741d8c3c', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'JACOBSON, Jacob', 0, 'hunter+jacob@example.com', '+2-456-7324', 'CIV', 'Jacob is a Superuser in EF 2.2', true, 'jacob', '19fcef93-1b1a-472b-97f5-77f46cf6f3fd', 'Italy', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('f683335a-91e3-4788-aa3f-9eed384f4ac1', 'BECCABON, Rebecca', 0, 'hunter+rebecca@example.com', '+2-456-7324', 'CTR', 'Rebecca is a Superuser in EF 2.2', true, 'rebecca', '9eb4b898-6fe4-40f8-abca-e893424d75d1', 'Germany', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'ANDERSON, Andrew', 0, 'hunter+andrew@example.com', '+1-412-7324', 'CIV', 'Andrew is the EF 1 Manager', true, 'andrew', '3276c85a-bf03-4591-a74b-56d70ac8eec0', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'SCHRUTE, Dwight', 0, 'dwight+schrute@example.com', '+1-412-7324', 'CIV', 'Beets & Battlestar Galactica.', true, 'dwight', 'cb23f6a5-1321-4330-b972-22d98bff12af', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'HALPERT, Jim', 0, 'jim+halpert@example.com', '+1-412-7324', 'CIV', 'Lets prank dwight.', true, 'jim', 'e8c81377-eaac-4ace-8aa6-7b255b53494c', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Administrator
  (uuid_generate_v4(), 'DMIN, Arthur', '0', 'hunter+arthur@example.com', NULL, 'CIV', 'An administrator', true, 'arthur', 'abc72322-1452-4222-bb71-a0b3db435175', 'Albania', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'SCOTT, Michael', '0', 'michael+scott@example.com', NULL, 'CIV', 'Worlds best boss.', true, 'michael', 'bd482701-2342-4a50-ba92-d956007a8828', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
--People
  (uuid_generate_v4(), 'HUNTMAN, Hunter', 0, 'hunter+hunter@example.com', '+1-412-9314', 'CIV', NULL, false, NULL, NULL, 'United States of America', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'NICHOLSON, Nick', 0, 'hunter+nick@example.com', '+1-202-7324', 'CIV', NULL, true, 'nick', '2a1e98bd-13dc-49c9-a1c5-7137eacc0e8f', 'United States of America', 'MALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'BEAU, Yoshie', 0, 'hunter+yoshie@example.com', '+1-202-7320', 'CIV', NULL, true, 'yoshie', 'b3f67185-77e7-42a0-a2eb-f0739077eab5', 'United States of America', 'FEMALE', CURRENT_TIMESTAMP + INTERVAL '1 year', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'SHARTON, Shardul', 1, 'hunter+shardul@example.com', '+99-9999-9999', 'CIV', NULL, false, NULL, NULL, 'Italy', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'ROGERS, Ben', 0, 'ben+rogers@example.com', '+99-9999-9999', 'CIV', NULL, true, NULL, NULL, 'Italy', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'RIVERS, Kevin', 0, 'kevin+rivers@example.com', '+99-9999-9999', 'CIV', NULL, true, NULL, NULL, 'Italy', 'MALE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create locations
INSERT INTO locations (uuid, type, name, lat, lng, "createdAt", "updatedAt") VALUES
  (N'e5b3a4b9-acf7-4c79-8224-f248b9a7215d', 'PA', 'Antarctica', -90, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'cc49bb27-4d8f-47a8-a9ee-af2b68b992ac', 'PP', 'St Johns Airport', 47.613442, -52.740936, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'8c138750-91ce-41bf-9b4c-9f0ddc73608b', 'PP', 'Murray''s Hotel', 47.561517, -52.708760, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'9c982685-5946-4dad-a7ee-0f5a12f5e170', 'PP', 'Wishingwells Park', 47.560040, -52.736962, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'0855fb0a-995e-4a79-a132-4024ee2983ff', 'PP', 'General Hospital', 47.571772, -52.741935, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'95446f93-249b-4aa9-b98a-7bd2c4680718', 'PP', 'Portugal Cove Ferry Terminal', 47.626718, -52.857241, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'c8fdb53f-6f93-46fc-b0fa-f005c7b49667', 'PP', 'Cabot Tower', 47.570010, -52.681770, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'c7a9f420-457a-490c-a810-b504c022cf1e', 'PP', 'Fort Amherst', 47.563763, -52.680590, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'7339f9e3-99d1-497a-9e3b-1269c4c287fe', 'PP', 'Harbour Grace Police Station', 47.705133, -53.214422, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'f2207d9b-204b-4cb5-874d-3fe6bc6f8acd', 'PP', 'Conception Bay South Police Station', 47.526784, -52.954739, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO locations (uuid, type, name, "createdAt", "updatedAt") VALUES
  (N'283797ec-7077-49b2-87b8-9afd5499b6f3', 'V', 'VTC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'e0ff0d6c-e663-4639-a44d-b075bf1e690d', 'PPP', 'MoD Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'5046a870-6c2a-40a7-9681-61a1d6eeaa07', 'PP', 'MoI Headquarters Kabul', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'c15eb29e-2965-401e-9f36-6ac8b9cc3842', 'PP', 'President''s Palace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'0585f158-5121-46a2-b099-799fe980aa9c', 'PP', 'Kabul Police Academy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'053ab2ad-132a-4a62-8cbb-20827f50ec34', 'PP', 'Police HQ Training Facility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'e87f145b-32e9-47ec-a0f4-e0dcf18e8a8c', 'PP', 'Kabul Hospital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'6465dd40-9fec-41db-a3b9-652fa52c7d21', 'PP', 'MoD Army Training Base 123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'2a59dd78-0c29-4b3f-bc94-7c98ff80b197', 'PP', 'MoD Location the Second', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'18c9be38-bf68-40e2-80d8-aac47f5ff7cf', 'PP', 'MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'8a34768c-aa15-41e4-ab79-6cf2740d555e', 'PP', 'MoI Training Center', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'9f364c59-953e-4c17-919c-648ea3a74e36', 'PP', 'MoI Adminstrative Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'dfc3918d-c2e3-4308-b161-2445cde77b3f', 'PP', 'MoI Senior Executive Suite', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'3652e114-ad16-43f0-b179-cc1bce6958d5', 'PP', 'MoI Coffee Shop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'5ac4078d-d445-416a-a93e-5941562359bb', 'PP', 'MoI Herat Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'22b0137c-4d89-43eb-ac95-a9f68aba884f', 'PP', 'MoI Jalalabad Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'60f4084f-3304-4cd5-89df-353edef07d18', 'PP', 'MoI Kandahar Office', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'c136bf89-cc24-43a5-8f51-0f41dfc9ab77', 'PP', 'MoI Mazar-i-Sharif', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'b0979678-0ed0-4b42-9b26-9976fcfa1b81', 'PP', 'MoI Office Building ABC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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

-- Put Andrew in the EF 1 Manager Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1 Manager'), (SELECT uuid from people where "emailAddress" = 'hunter+andrew@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+andrew@example.com') WHERE name = 'EF 1 Manager';

-- Put Bob into the Superuser Billet in EF 1.1
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.1 Superuser'), (SELECT uuid from people where "emailAddress" = 'hunter+bob@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+bob@example.com') WHERE name = 'EF 1.1 Superuser';

-- Put Henry into the Superuser Billet in EF 2.1
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.1 Superuser'), (SELECT uuid from people where "emailAddress" = 'hunter+henry@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+henry@example.com') WHERE name = 'EF 2.1 Superuser';

-- Rotate an advisor through a billet ending up with Jack in the EF 2.1 Advisor B Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where "emailAddress" = 'hunter+erin@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+erin@example.com') WHERE name = 'EF 2.1 Advisor B';
UPDATE "peoplePositions" SET "endedAt" = CURRENT_TIMESTAMP + INTERVAL '1 millisecond' WHERE "positionUuid" = (SELECT uuid from positions where name = 'EF 2.1 Advisor B');
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.1 Advisor B'), (SELECT uuid from people where "emailAddress" = 'hunter+jack@example.com'), CURRENT_TIMESTAMP + INTERVAL '1 millisecond');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+jack@example.com') WHERE name = 'EF 2.1 Advisor B';

-- Rotate advisors through billets ending up with Dvisor in the EF 2.2 Advisor Sewing Facilities Billet and Selena in the EF 1.2 Advisor Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor Sewing Facilities'), (SELECT uuid from people where "emailAddress" = 'hunter+selena@example.com'), CURRENT_TIMESTAMP);
UPDATE "peoplePositions" SET "endedAt" = CURRENT_TIMESTAMP + INTERVAL '1 millisecond' WHERE "positionUuid" = (SELECT uuid from positions where name = 'EF 2.2 Advisor Sewing Facilities');
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor Sewing Facilities'), (SELECT uuid from people where "emailAddress" = 'hunter+advisor@example.com'), CURRENT_TIMESTAMP + INTERVAL '1 millisecond');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+advisor@example.com') WHERE name = 'EF 2.2 Advisor Sewing Facilities';

INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.2 Advisor'), (SELECT uuid from people where "emailAddress" = 'hunter+advisor@example.com'), CURRENT_TIMESTAMP);
UPDATE "peoplePositions" SET "endedAt" = CURRENT_TIMESTAMP + INTERVAL '1 millisecond' WHERE "positionUuid" = (SELECT uuid from positions where name = 'EF 1.2 Advisor');
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.2 Advisor'), (SELECT uuid from people where "emailAddress" = 'hunter+selena@example.com'), CURRENT_TIMESTAMP + INTERVAL '1 millisecond');
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+selena@example.com') WHERE name = 'EF 1.2 Advisor';

-- Put Elizabeth into the EF 1.1 Advisor A Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 1.1 Advisor A'), (SELECT uuid from people where "emailAddress" = 'hunter+liz@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+liz@example.com') WHERE name = 'EF 1.1 Advisor A';

-- Put Reina into the EF 2.2 Advisor C Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor C'), (SELECT uuid from people where "emailAddress" = 'hunter+reina@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+reina@example.com') WHERE name = 'EF 2.2 Advisor C';

-- Put Erin into the EF 2.2 Advisor D Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Advisor D'), (SELECT uuid from people where "emailAddress" = 'hunter+erin@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+erin@example.com') WHERE name = 'EF 2.2 Advisor D';

-- Put Jacob in the EF 2.2 Superuser Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Superuser'), (SELECT uuid from people where "emailAddress" = 'hunter+jacob@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+jacob@example.com') WHERE name = 'EF 2.2 Superuser';

-- Put Rebecca in the EF 2.2 Final Reviewer Position
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 2.2 Final Reviewer'), (SELECT uuid from people where "emailAddress" = 'hunter+rebecca@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+rebecca@example.com') WHERE name = 'EF 2.2 Final Reviewer';

-- Put Arthur into the Admin Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'ANET Administrator'), (SELECT uuid from people where "emailAddress" = 'hunter+arthur@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+arthur@example.com') WHERE name = 'ANET Administrator';

-- Put Creed into the EF 5.1 Quality Ensurance
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Advisor Quality Assurance'), (SELECT uuid from people where "emailAddress" = 'creed+bratton@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'creed+bratton@example.com') WHERE name = 'EF 5.1 Advisor Quality Assurance';

-- Put Kevin into the EF 5.1 Accounting
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Advisor Accounting'), (SELECT uuid from people where "emailAddress" = 'kevin+malone@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'kevin+malone@example.com') WHERE name = 'EF 5.1 Advisor Accounting';

-- Put Jim into the EF 5.1 Sales 1
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Superuser Sales 1'), (SELECT uuid from people where "emailAddress" = 'jim+halpert@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'jim+halpert@example.com') WHERE name = 'EF 5.1 Superuser Sales 1';

-- Put Dwight into the EF 5.1 Sales 2
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5.1 Superuser Sales 2'), (SELECT uuid from people where "emailAddress" = 'dwight+schrute@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'dwight+schrute@example.com') WHERE name = 'EF 5.1 Superuser Sales 2';

-- Put Michael into the EF 5 Admin
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 5 Admin'), (SELECT uuid from people where "emailAddress" = 'michael+scott@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'michael+scott@example.com') WHERE name = 'EF 5 Admin';

-- Put Kevin Rivers into the EF 6 Approver
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt")
VALUES ((SELECT uuid from positions where name = 'EF 6 Approver'), (SELECT uuid from people where "emailAddress" = 'kevin+rivers@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'kevin+rivers@example.com') WHERE name = 'EF 6 Approver';

-- Put Ben Rogers into the EF 6.1 Advisor
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt")
VALUES ((SELECT uuid from positions where name = 'EF 6.1 Advisor'), (SELECT uuid from people where "emailAddress" = 'ben+rogers@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'ben+rogers@example.com') WHERE name = 'EF 6.1 Advisor';

-- Put Nick into the EF 9 Advisor
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 9 Advisor'), (SELECT uuid from people where "emailAddress" = 'hunter+nick@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+nick@example.com') WHERE name = 'EF 9 Advisor';

-- Put Yoshie Beau into the EF 9 Approver
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'EF 9 Approver'), (SELECT uuid from people where "emailAddress" = 'hunter+yoshie@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+yoshie@example.com') WHERE name = 'EF 9 Approver';

-- Put Lin into the LNG Advisor A
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'LNG Advisor A'), (SELECT uuid from people where "emailAddress" = 'lin+guist@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'lin+guist@example.com') WHERE name = 'LNG Advisor A';

-- Put Inter into the LNG Advisor B
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'LNG Advisor B'), (SELECT uuid from people where "emailAddress" = 'inter+preter@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'inter+preter@example.com') WHERE name = 'LNG Advisor B';

-- Top-level organizations
INSERT INTO organizations(uuid, "shortName", "longName", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'ANET Administrators','', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('70193ee9-05b4-4aac-80b5-75609825db9f', 'LNG', 'Linguistic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 1', 'Planning Programming, Budgeting and Execution', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 2', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 3', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 4', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 5', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 6', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF7', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF8', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'EF 9', 'Gender', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-N', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-S', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-W', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-E', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC-C', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'TAAC Air', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub-organizations
INSERT INTO organizations(uuid, "shortName", "longName", "parentOrgUuid", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'EF 1.1', '', (SELECT uuid from organizations WHERE "shortName" ='EF 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
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
SELECT ('''' || uuid_generate_v4() || '''') AS "approvalStepUuid" \gset
INSERT INTO "approvalSteps" (uuid, name, "relatedObjectUuid", "nextStepUuid", type) VALUES
  (:approvalStepUuid, 'EF 2.2 Secondary Reviewers', (SELECT uuid from organizations where "shortName"='EF 2.2'), NULL, 1),
  (uuid_generate_v4(), 'EF 2.2 Initial Approvers', (SELECT uuid from organizations where "shortName"='EF 2.2'), :approvalStepUuid, 1);

INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Superuser')),
  ((SELECT uuid from "approvalSteps" WHERE name='EF 2.2 Initial Approvers'), (SELECT uuid from positions where name = 'EF 2.2 Advisor D')),
  ((SELECT uuid from "approvalSteps" WHERE name='EF 2.2 Secondary Reviewers'), (SELECT uuid from positions where name = 'EF 2.2 Final Reviewer'));

-- Create the EF 6 approval process
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
VALUES (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='EF 6'), 'EF 6 Approvers', 1);
INSERT INTO approvers ("approvalStepUuid", "positionUuid")
VALUES ((SELECT uuid from "approvalSteps" WHERE name='EF 6 Approvers'), (SELECT uuid from positions where name = 'EF 6 Approver'));

-- Create the EF 9 approval process
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type) VALUES
  (uuid_generate_v4(), (SELECT uuid from organizations where "shortName"='EF 9'), 'EF 9 Approvers', 1);
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" WHERE name='EF 9 Approvers'), (SELECT uuid from positions where name = 'EF 9 Approver'));

-- Create some tasks
INSERT INTO tasks (uuid, "shortName", "longName", category, "createdAt", "updatedAt", "parentTaskUuid") VALUES
  (N'1145e584-4485-4ce0-89c4-2fa2e1fe846a', 'EF 1', 'Budget and Planning', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'fdf107e7-a88a-4dc4-b744-748e9aaffabc', '1.1', 'Budgeting in the MoD', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
  (N'7b2ad5c3-018b-48f5-b679-61fbbda21693', '1.1.A', 'Milestone the First in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
  (N'1b5eb36b-456c-46b7-ae9e-1c89e9075292', '1.1.B', 'Milestone the Second in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
  (N'7fdef880-1bf3-4e56-8476-79166324023f', '1.1.C', 'Milestone the Third in EF 1.1', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fdf107e7-a88a-4dc4-b744-748e9aaffabc'),
  (N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0', 'EF 1.2', 'Budgeting in the MoI', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
  (N'ac466253-1456-4fc8-9b14-a3643746e5a6', 'EF 1.3', 'Budgeting in the Police?', 'Sub-EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'1145e584-4485-4ce0-89c4-2fa2e1fe846a'),
  (N'953e0b0b-25e6-44b6-bc77-ef98251d046a', '1.2.A', 'Milestone the First in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
  (N'9d3da7f4-8266-47af-b518-995f587250c9', '1.2.B', 'Milestone the Second in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
  (N'6bbb1be9-4655-48d7-83f2-bc474781544a', '1.2.C', 'Milestone the Third in EF 1.2', 'Milestone', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'fe6b6b2f-d2a1-4ce1-9aa7-05361812a4d0'),
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
  (N'4831e09b-2bbb-4717-9bfa-91071e62260a', 'EF9', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (N'5173f34b-16f5-4e18-aa3d-def55c40e36d', 'Gender', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, N'4831e09b-2bbb-4717-9bfa-91071e62260a'),
  (uuid_generate_v4(), 'TAAC-N', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-S', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-E', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-W', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC-C', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  (uuid_generate_v4(), 'TAAC Air', '', 'EF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);

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
  ((SELECT uuid from tasks where "shortName" = 'EF 2'), (SELECT uuid from organizations where "shortName"='EF 2')),
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

-- Create a location approval process for a location
INSERT INTO "approvalSteps" (uuid, "relatedObjectUuid", name, type)
  SELECT uuid_generate_v4(), (SELECT uuid FROM locations WHERE name = 'Portugal Cove Ferry Terminal'), 'Location approval', 1;
INSERT INTO approvers ("approvalStepUuid", "positionUuid") VALUES
  ((SELECT uuid from "approvalSteps" where name = 'Location approval'), (SELECT uuid from positions where name = 'ANET Administrator'));

-- Top-level organizations
INSERT INTO organizations (uuid, "shortName", "longName", "identificationCode", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'MoD', 'Ministry of Defense', 'Z12345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'MoI', 'Ministry of Interior', 'P12345', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Sub-organizations
INSERT INTO organizations (uuid, "shortName", "longName", "parentOrgUuid", "identificationCode", "createdAt", "updatedAt") VALUES
  (uuid_generate_v4(), 'MOD-F', 'Ministry of Defense Finances', (SELECT uuid from organizations where "shortName" = 'MoD'), NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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

-- Put Steve into a Tashkil and associate with the EF 1.1 Advisor A Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Cost Adder - MoD'), (SELECT uuid from people where "emailAddress" = 'hunter+steve@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+steve@example.com') WHERE name = 'Cost Adder - MoD';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid from positions WHERE name ='EF 1.1 Advisor A'),
  (SELECT uuid FROM positions WHERE name='Cost Adder - MoD'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Roger in a Tashkil and associate with the EF 2.1 Advisor B Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Police'), (SELECT uuid from people where "emailAddress" = 'hunter+roger@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+roger@example.com') WHERE name = 'Chief of Police';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 2.1 Advisor B'),
  (SELECT uuid from positions WHERE name ='Chief of Police'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Christopf in a Tashkil and associate with the EF 2.2 Advisor D Billet
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Planning Captain'), (SELECT uuid from people where "emailAddress" = 'hunter+christopf@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'hunter+christopf@example.com') WHERE name = 'Planning Captain';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 2.2 Advisor D'),
  (SELECT uuid from positions WHERE name ='Planning Captain'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Chris in a Tashkil and associate with the EF 5.1 Advisor Accounting
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Tests'), (SELECT uuid from people where "emailAddress" = 'chrisville+chris@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'chrisville+chris@example.com') WHERE name = 'Chief of Tests';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 5.1 Advisor Accounting'),
  (SELECT uuid from positions WHERE name ='Chief of Tests'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Kyle in a Tashkil and associate with the EF 5.1 Advisor Quality Assurance
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Director of Tests'), (SELECT uuid from people where "emailAddress" = 'kyleson+kyle@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'kyleson+kyle@example.com') WHERE name = 'Director of Tests';
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 5.1 Advisor Quality Assurance'),
  (SELECT uuid from positions WHERE name ='Director of Tests'),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Myposwill in a Tashkil
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Merge One'), (SELECT uuid from people where "emailAddress" = 'bemerged+myposwill@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'bemerged+myposwill@example.com') WHERE name = 'Merge One';
-- Associate Merge One and Merge Two positions with some advisor positions to test merging
INSERT INTO "positionRelationships" ("positionUuid_a", "positionUuid_b", "createdAt", "updatedAt", deleted) VALUES
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor B'), (SELECT uuid from positions WHERE name ='Merge One'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor C'), (SELECT uuid from positions WHERE name ='Merge One'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor C'), (SELECT uuid from positions WHERE name ='Merge Two'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE),
  ((SELECT uuid FROM positions WHERE name='EF 1.1 Advisor D'), (SELECT uuid from positions WHERE name ='Merge Two'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE);

-- Put Winner Duplicate in a Tashkil
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Merge People Test 1'), (SELECT uuid from people where "emailAddress" = 'merged+winner@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'merged+winner@example.com') WHERE name = 'Chief of Merge People Test 1';
-- Put Loser Duplicate in a Tashkil
INSERT INTO "peoplePositions" ("positionUuid", "personUuid", "createdAt") VALUES
  ((SELECT uuid from positions where name = 'Chief of Merge People Test 2'), (SELECT uuid from people where "emailAddress" = 'merged+loser@example.com'), CURRENT_TIMESTAMP);
UPDATE positions SET "currentPersonUuid" = (SELECT uuid from people where "emailAddress" = 'merged+loser@example.com') WHERE name = 'Chief of Merge People Test 2';

UPDATE positions SET "locationUuid" = (SELECT uuid from LOCATIONS where name = 'Kabul Police Academy') WHERE name = 'Chief of Police';
UPDATE positions SET "locationUuid" = (SELECT uuid from LOCATIONS where name = 'MoD Headquarters Kabul') WHERE name = 'Cost Adder - MoD';

-- Write a couple of reports!

SELECT ('''' || N'9bb1861c-1f55-4a1b-bd3d-3c1f56d739b5' || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Discuss improvements in Annual Budgeting process',
  'Today I met with this dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
  'Meet with the dude again next week', 2, '2016-05-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='General Hospital'), 'Run through FY2016 Numbers on tool usage',
  'Today we discussed the fiscal details of how spreadsheets break down numbers into rows and columns and then text is used to fill up space on a web page, it was very interesting and other adjectives',
  'we read over the spreadsheets for the FY17 Budget',
  'meet with him again :(', 2, '2016-06-01', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+roger@example.com'), :reportuuid, FALSE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), :reportuuid),
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Kabul Hospital'), 'Looked at Hospital usage of Drugs',
  'This report needs to fill up more space',
  'putting something in the database to take up space',
  'to be more creative next time', 2, '2016-06-03', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.C'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Kabul Hospital'), 'discuss enagement of Doctors with Patients',
  'Met with Nobody in this engagement and discussed no tasks, what a waste of time',
  'None',
  'Head over to the MoD Headquarters buildling for the next engagement', 2, '2016-06-10', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "releasedAt", "engagementDate", atmosphere, "atmosphereDetails", "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='MoD Headquarters Kabul'), 'Meet with Leadership regarding monthly status update',
  'This engagement was sooooo interesting',
  'Meet up with Roger next week to look at the numbers on the charts', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2, 'Guy was grumpy',
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+bob@example.com'), :reportuuid, TRUE, FALSE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, FALSE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "keyOutcomes", "nextSteps", state, "releasedAt", "engagementDate", atmosphere, "atmosphereDetails", "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Fort Amherst'), 'Inspect Ft Amherst Medical Budgeting Facility?',
  'Went over to the fort to look at the beds and the spreadsheets and the numbers and the whiteboards and the planning and all of the budgets. It was GREAT!',
  'Seeing the whiteboards firsthand',
  'head to Cabot Tower and inspect their whiteboards next week', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'Very good tea',
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+roger@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (select uuid from locations where name='Cabot Tower'), 'Inspect Cabot Tower Budgeting Facility',
  'Looked over the places around Cabot Tower for all of the things that people do when they need to do math.  There were calculators, and slide rules, and paper, and computers',
  'keep writing fake reports to fill the database!!!', 1, '2016-06-20', 1,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.C'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Discuss discrepancies in monthly budgets',
  'Back to the hospital this week to test the recent locations feature of ANET, and also to look at math and numbers and budgets and things',
  'Meet with the dude again next week', 1, '2016-06-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.A'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='St Johns Airport'), 'Inspect Air Operations Capabilities',
  'We went to the Aiport and looked at the planes, and the hangers, and the other things that airports have. ',
  'Go over to the Airport next week to look at the helicopters', 2, '2016-05-20', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 1.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+roger@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+liz@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '2.A'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='St Johns Airport'), 'Inspect Helicopter Capabilities',
  'Today we looked at the helicopters at the aiport and talked in depth about how they were not in good condition and the AAF needed new equipment.  I expressed my concerns to the pilots and promised to see what we can do.',
  'Figure out what can be done about the helicopters', 2, '2016-05-22', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 1.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+roger@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+liz@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '2.A'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Look for Budget Controls',
  'Goal of the meeting was to look for the word spreadsheet in a report and then return that in a search result about budget. Lets see what happens!!',
  'Searching for text', 'Test Cases are good', 2, '2017-01-14', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+christopf@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+erin@example.com'), :reportuuid, TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+reina@example.com'), :reportuuid, FALSE, FALSE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), :reportuuid);
INSERT INTO "reportsSensitiveInformation" (uuid, "createdAt", "updatedAt", text, "reportUuid") VALUES
  (uuid_generate_v4(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Need to know only', :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Look for Budget Controls Again',
  'The search for the spreadsheet was doomed to be successful, so we needed to generate more data in order to get a more full test of the system that really is going to have much much larger reports in it one day.',
  'Mocking up test cases','Better test data is always better', 2, '2017-01-04', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+christopf@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+erin@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Talk to the Interior about things',
  'We know that we want to go to the house with the food and eat the food, but the words in the database need to be long enough to do something. What that is were not sure, but we know we cant use apostrophies or spell.  Wow, we really cant do much, right? It was decided that we would do more tomorrow.',
  'Mocking up test cases','Looking at the telescope with our eyes', 2, '2017-01-04', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+christopf@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+erin@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.1.B'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "cancelledReason", "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Weekly Checkin with MG Somebody',
  'Meeting got cancelled',
  'Reschedule Meeting','', 4, CURRENT_TIMESTAMP, 0, 1,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+erin@example.com'), :reportuuid, TRUE, TRUE, FALSE);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'A test report from Arthur', '',
  'keep on testing!','have reports in organizations', 2, CURRENT_TIMESTAMP + INTERVAL '1 minute', 0,
  (SELECT uuid FROM organizations where "shortName" = 'ANET Administrators'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+arthur@example.com'), :reportuuid, TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+shardul@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='lin+guist@example.com'), :reportuuid, FALSE, FALSE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='kyleson+kyle@example.com'), :reportuuid, FALSE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='chrisville+chris@example.com'), :reportuuid, FALSE, FALSE, TRUE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.2.A'), :reportuuid),
  ((SELECT uuid from tasks where "shortName" = '1.2.B'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid", "classification") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'A classified report from Arthur', '',
  'keep on testing!','check the classification', 0, CURRENT_TIMESTAMP + INTERVAL '1 minute', 0,
  (SELECT uuid FROM organizations where "shortName" = 'ANET Administrators'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'), 'NU');
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+arthur@example.com'), :reportuuid, TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+shardul@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='lin+guist@example.com'), :reportuuid, FALSE, FALSE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='kyleson+kyle@example.com'), :reportuuid, FALSE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='chrisville+chris@example.com'), :reportuuid, FALSE, FALSE, TRUE);


SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'A test report to be unpublished from Arthur', '',
  'I need to edit this report so unpublish it please','have reports in organizations', 2, CURRENT_TIMESTAMP + INTERVAL '1 minute', 0,
  (SELECT uuid FROM organizations where "shortName" = 'ANET Administrators'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Interior'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+arthur@example.com'), :reportuuid, TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+shardul@example.com'), :reportuuid, TRUE, FALSE, TRUE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '1.2.A'), :reportuuid),
  ((SELECT uuid from tasks where "shortName" = '1.2.B'), :reportuuid);

SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Test report with rich text',
  '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>Handle text without tags. <p>Handle the white space below</p> <p>'||chr(10)||'</p> <blockquote>Blockquote</blockquote><b>Bold</b> <i>Italic</i> <u>Underline</u> <strike>Strike</strike> <strike><b>BoldStrike</b></strike> <i><b>BoldItalic</b></i><ol><li>numbered list 1</li><li><p><b>numbered</b> list 2<p></li></ol><ul><li>bulleted list 1</li><li>bulleted list 2</li></ul>',
  'Keep testing', 0, '2022-08-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+arthur@example.com'), :reportuuid, TRUE, TRUE, FALSE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, FALSE, FALSE, FALSE);

-- Erin's Draft report
SELECT ('''530b735e-1134-4daa-9e87-4491c888a4f7''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", "keyOutcomes", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid", "customFields") VALUES
  (:reportuuid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT uuid from locations where name='General Hospital'), 'Erin''s Draft report, ready for submission',
  'This is just a draft.', 'This is just a draft.', 'This is just a draft.', 0, '2023-05-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.2'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'),
  '{"invisibleCustomFields":["formCustomFields.trainingEvent","formCustomFields.numberTrained","formCustomFields.levelTrained","formCustomFields.trainingDate","formCustomFields.systemProcess","formCustomFields.echelons","formCustomFields.itemsAgreed","formCustomFields.assetsUsed"],"multipleButtons":[],"additionalEngagementNeeded":[],"relatedObject":null,"relatedReport":null}');
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+christopf@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+erin@example.com'), :reportuuid, TRUE, TRUE, FALSE);
INSERT INTO "reportTasks" ("taskUuid", "reportUuid") VALUES
  ((SELECT uuid from tasks where "shortName" = '2.A'), :reportuuid);

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
  ('SECURITY_BANNER_CLASSIFICATION', 'demo use only'),
  ('SECURITY_BANNER_RELEASABILITY', 'releasable to DEMO MISSION'),
  ('SECURITY_BANNER_COLOR', 'green'),
  ('DEFAULT_APPROVAL_ORGANIZATION', (select uuid from organizations where "shortName"='ANET Administrators')),
  ('HELP_LINK_URL', 'http://google.com'),
  ('CONTACT_EMAIL', 'team-anet@example.com'),
  ('DAILY_ROLLUP_MAX_REPORT_AGE_DAYS', '14'),
  ('EXTERNAL_DOCUMENTATION_LINK_TEXT', ''),
  ('EXTERNAL_DOCUMENTATION_LINK_URL', ''),
  ('GENERAL_BANNER_TEXT', ''),
  ('GENERAL_BANNER_LEVEL', 'notice'),
  ('GENERAL_BANNER_VISIBILITY', '1');

-- System user, used when importing data that can't be linked to any specific user
INSERT INTO PEOPLE (uuid, name, status, "createdAt", "updatedAt")
  SELECT uuid_generate_v4(), 'ANET Importer', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  WHERE NOT EXISTS (SELECT uuid FROM people WHERE name = 'ANET Importer');

SELECT ('''' || uuid || '''') AS "authorUuid" FROM people WHERE name = 'ANET Importer' \gset

-- Tag some reports
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0,
    'Previously tagged as bribery - Giving/Promising money or something valuable to corrupt the behavior of a public official',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('0', '2', '4', '6', '8', 'a', 'c', 'e')
  AND r.state != 0;

SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0,
    'Previously tagged as embezzlement - Steal or misappropriate money from the organization the person works for',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('0', '3', '6', '9', 'c', 'f')
  AND r.state != 0;

SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0,
    'Previously tagged as patronage - Leaders illegally appointing someone to a position',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('1', '3', '5', '7', '9', 'b', 'd', 'f')
  AND r.state != 0;

SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0,
    'Previously tagged as facilitation payment - Payment made to a government official that acts as an incentive to complete an action quickly',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE SUBSTRING(r.uuid, 1, 1) IN ('1', '4', '7', 'a', 'd')
  AND r.state != 0;

-- Insert report with created at and updated at date for two days before current timestamp
SELECT ('''' || uuid_generate_v4() || '''') AS reportuuid \gset
INSERT INTO reports (uuid, "createdAt", "updatedAt", "locationUuid", intent, text, "nextSteps", state, "engagementDate", atmosphere, "advisorOrganizationUuid", "interlocutorOrganizationUuid") VALUES
  (:reportuuid, CURRENT_TIMESTAMP + INTERVAL '-2 day', CURRENT_TIMESTAMP + INTERVAL '-2 day', (SELECT uuid from locations where name='General Hospital'), 'Discuss further improvements in Annual Budgeting process',
  'Today I met with Edwin the dude to tell him all the great things that he can do to improve his budgeting process. I hope he listened to me',
  'Meet with the dude again next week', 2, '2016-05-25', 0,
  (SELECT uuid FROM organizations where "shortName" = 'EF 2.1'), (SELECT uuid FROM organizations WHERE "longName" LIKE 'Ministry of Defense'));
INSERT INTO "reportPeople" ("personUuid", "reportUuid", "isPrimary", "isAuthor", "isInterlocutor") VALUES
  ((SELECT uuid FROM people where "emailAddress"='hunter+steve@example.com'), :reportuuid, TRUE, FALSE, TRUE),
  ((SELECT uuid FROM people where "emailAddress"='hunter+jack@example.com'), :reportuuid, TRUE, TRUE, FALSE);

-- Authorization groups
INSERT INTO "authorizationGroups" (uuid, name, description, status, "createdAt", "updatedAt") VALUES
  ('1050c9e3-e679-4c60-8bdc-5139fbc1c10b', 'EF 1.1', 'The complete EF 1.1 organisation', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('39a78d51-c351-452c-9206-4305ec8dd76d', 'EF 2.1', 'The complete EF 2.1 organisation', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c21e7321-7ec5-4837-8805-a302f9575754', 'EF 2.2', 'The complete EF 2.2 organisation', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ab1a7d99-4529-44b1-a118-bdee3ca8296b', 'EF 5', 'The complete EF 5 organization', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
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
  (N'4263793a-18bc-4cef-a535-0116615301e1', 'birthday', '{"birthday":"1999-09-09T00:00:00.000Z"}', 'people', '90fa5784-9e63-4353-8119-357bcd88e287', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'c9ca5fd9-699e-4643-8025-91a2f2e0cd77', 'politicalPosition', '{"politicalPosition":"LEFT"}', 'people', '90fa5784-9e63-4353-8119-357bcd88e287', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  -- Roger
  (N'84b46418-4350-4b52-8789-2b292fc0ab60', 'birthday', '{"birthday":"2001-01-01T00:00:00.000Z"}', 'people', '6866ce4d-1f8c-4f78-bdc2-4767e9a859b0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (N'810cf44b-91f6-474a-b522-5ba822ccfc1c', 'politicalPosition', '{"politicalPosition":"RIGHT"}', 'people', '6866ce4d-1f8c-4f78-bdc2-4767e9a859b0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add some notes and link them to the objects they relate to
SELECT ('''' || uuid || '''') AS "authorUuid" FROM people WHERE name = 'BECCABON, Rebecca' \gset
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, 'A really nice person to work with', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'people', p.uuid
  FROM people p
  WHERE p.rank = 'CIV';

SELECT ('''' || uuid || '''') AS "authorUuid" FROM people WHERE name = 'DMIN, Arthur' \gset
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, '<em>This position should always be filled!</em>', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'positions', p.uuid
  FROM positions p
  WHERE p.type = 3;

-- Add notes to the positions that will be merged
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, 'Merge one position note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'positions', p.uuid
  FROM positions p
  WHERE p.uuid = '25fe500c-3503-4ba8-a9a4-09b29b50c1f1';

SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, 'Merge two position note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'positions', p.uuid
  FROM positions p
  WHERE p.uuid = 'e87f0f60-ad13-4c1c-96f7-672c595b81c7';

-- Add notes to the people that will be merged
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, 'Merge one person note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'people', p.uuid
  FROM people p
  WHERE p.uuid = '3cb2076c-5317-47fe-86ad-76f298993917';

SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, 'Merge two person note', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'people', p.uuid
  FROM people p
  WHERE p.uuid = 'c725aef3-cdd1-4baf-ac72-f28219b234e9';

SELECT ('''' || uuid || '''') AS "authorUuid" FROM people WHERE name = 'ERINSON, Erin' \gset
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, 'Check out this report, it is really positive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE r.atmosphere = 0
  AND r.state != 0;

SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 0, 'Report text contains some valuable information, especially for the next meeting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE r.text LIKE 'Today%';

-- Add instant assessments to tasks related to reports
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 3, 'fields.task.subLevel.assessments.subTaskOnceReport', '{"__recurrence":"once","__relatedObjectType":"report","question1":4.462819020045945,"question2":"1","question3":"22"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE r.intent = 'A test report from Arthur';
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'tasks', t.uuid
  FROM tasks t
  WHERE t."shortName" = '1.2.A';

SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 3, 'fields.task.subLevel.assessments.subTaskOnceReport', '{"__recurrence":"once","__relatedObjectType":"report","question1":3.141592653589793,"question2":"3","question3":"14"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'reports', r.uuid
  FROM reports r
  WHERE r.intent = 'A test report from Arthur';
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'tasks', t.uuid
  FROM tasks t
  WHERE t."shortName" = '1.2.B';

-- Add periodic assessment for a task
SELECT ('''' || uuid || '''') AS "authorUuid" FROM people WHERE name = 'ANDERSON, Andrew' \gset
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 3, 'fields.task.subLevel.assessments.subTaskMonthly', '{"status":"GREEN","issues":"<ol><li>one</li><li>two</li><li>three</li></ol>","__recurrence":"monthly","__periodStart":"' || to_char(date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '-1 month', 'YYYY-MM-DD') || '"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'tasks', t.uuid
  FROM tasks t
  WHERE t."shortName" = '1.1.A';

-- Add periodic assessments for a person
SELECT ('''' || uuid || '''') AS "authorUuid" FROM people WHERE name = 'JACKSON, Jack' \gset
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 3, 'fields.regular.person.assessments.interlocutorQuarterly', '{"test3":"3","test2":"3","test1":"3","__recurrence":"quarterly","__periodStart":"' || to_char(date_trunc('quarter', CURRENT_TIMESTAMP) + INTERVAL '-3 month', 'YYYY-MM-DD') || '"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'people', p.uuid
  FROM people p
  WHERE p.name = 'ROGWELL, Roger';
SELECT ('''' || uuid_generate_v4() || '''') AS "noteUuid" \gset
INSERT INTO notes (uuid, "authorUuid", type, "assessmentKey", text, "createdAt", "updatedAt") VALUES
  (:noteUuid, :authorUuid, 3, 'fields.regular.person.assessments.interlocutorMonthly', '{"text":"sample text","__recurrence":"monthly","__periodStart":"' || to_char(date_trunc('month', CURRENT_TIMESTAMP) + INTERVAL '-1 month', 'YYYY-MM-DD') || '"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "noteRelatedObjects" ("noteUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT :noteUuid, 'people', p.uuid
  FROM people p
  WHERE p.name = 'ROGWELL, Roger';

-- Add attachments for reports
SELECT ('''' || uuid || '''') AS "authorUuid" FROM people WHERE name = 'DMIN, Arthur' \gset
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt")
	VALUES ('f076406f-1a9b-4fc9-8ab2-cd2a138ec26d', :authorUuid, 'test_attachment.png', 'test_attachment', 'image/png', lo_import('/var/tmp/default_avatar.png'), 12316, 'We can add attachments to a report', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'f076406f-1a9b-4fc9-8ab2-cd2a138ec26d', 'reports', r.uuid
  FROM reports r
  WHERE r.intent = 'A test report from Arthur';

-- Add attachments for locations
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt")
	VALUES ('f7cd5b02-ef73-4ee8-814b-c5a7a916685d', :authorUuid, 'attachLocation.png', 'attachLocation', 'image/png', lo_import('/var/tmp/default_avatar.png'), 12316, 'We can add attachments to a location', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT 'f7cd5b02-ef73-4ee8-814b-c5a7a916685d', 'locations', loc.uuid
  FROM locations loc
  WHERE loc.name = 'Antarctica';

-- Add attachments for organizations
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt")
	VALUES ('9ac41246-25ac-457c-b7d6-946c5f625f1f', :authorUuid, 'attachOrganization.png', 'attachOrganization', 'image/png', lo_import('/var/tmp/default_avatar.png'), 12316, 'We can add attachments to an organization', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '9ac41246-25ac-457c-b7d6-946c5f625f1f', 'organizations', org.uuid
  FROM organizations org
  WHERE org."shortName" = 'EF 2.2';

-- Add attachments for people
INSERT INTO attachments (uuid, "authorUuid", "fileName", "caption", "mimeType", content, "contentLength", "description", "classification", "createdAt", "updatedAt")
	VALUES ('13318e42-a0a3-438f-8ed5-dc16b1ef17bc', :authorUuid, 'attachPerson.png', 'attachPerson', 'image/png', lo_import('/var/tmp/default_avatar.png'), 12316, 'We can add attachments to a person', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "attachmentRelatedObjects" ("attachmentUuid", "relatedObjectType", "relatedObjectUuid")
  SELECT '13318e42-a0a3-438f-8ed5-dc16b1ef17bc', 'people', p.uuid
  FROM people p
  WHERE p."domainUsername" = 'erin';

-- Update the full-text indexes
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
