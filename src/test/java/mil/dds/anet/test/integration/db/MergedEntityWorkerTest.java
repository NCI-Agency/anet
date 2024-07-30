package mil.dds.anet.test.integration.db;


import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.MergedEntity;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.AttachmentDao;
import mil.dds.anet.database.CustomSensitiveInformationDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.test.SpringTestConfig;
import mil.dds.anet.test.client.Atmosphere;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportSensitiveInformationInput;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.test.resources.ReportResourceTest;
import mil.dds.anet.threads.MergedEntityWorker;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = SpringTestConfig.class,
    useMainMethod = SpringBootTest.UseMainMethod.ALWAYS,
    webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MergedEntityWorkerTest extends AbstractResourceTest {

  @Autowired
  private JobHistoryDao jobHistoryDao;

  @Autowired
  private AdminDao adminDao;

  @Autowired
  private AttachmentDao attachmentDao;

  @Autowired
  private CustomSensitiveInformationDao customSensitiveInformationDao;

  @Autowired
  private LocationDao locationDao;

  @Autowired
  private NoteDao noteDao;

  @Autowired
  private OrganizationDao organizationDao;

  @Autowired
  private PersonDao personDao;

  @Autowired
  private PositionDao positionDao;

  @Autowired
  private TaskDao taskDao;

  private MergedEntityWorker mergedEntityWorker;

  @BeforeAll
  void setUpClass() {
    mergedEntityWorker = new MergedEntityWorker(dict, jobHistoryDao, adminDao);

    // Flush all merged entities from previous tests
    mergedEntityWorker.run();
  }

  @Test
  void testAttachment() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final Attachment input = new Attachment();
    input.setAuthor(getRegularUserBean());
    input.setDescription(getRichText(AttachmentDao.TABLE_NAME, testOldUuid));
    final Attachment created = attachmentDao.insert(input);
    assertContains(created.getDescription(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Attachment updated = attachmentDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getDescription(), testOldUuid);
    assertContains(updated.getDescription(), testNewUuid);

    // clean up
    attachmentDao.delete(updated.getUuid());
  }

  @Test
  void testCustomSensitiveInformation() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final CustomSensitiveInformation input = new CustomSensitiveInformation();
    input.setRelatedObjectType(PersonDao.TABLE_NAME);
    final String relatedObjectUuid = getRegularUserBean().getUuid();
    input.setRelatedObjectUuid(relatedObjectUuid);
    input.setCustomFieldName("testCustomField");
    input.setCustomFieldValue(getRichText(PersonDao.TABLE_NAME, testOldUuid));
    final CustomSensitiveInformation created = customSensitiveInformationDao.insert(input);
    assertContains(created.getCustomFieldValue(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final CustomSensitiveInformation updated =
        customSensitiveInformationDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getCustomFieldValue(), testOldUuid);
    assertContains(updated.getCustomFieldValue(), testNewUuid);

    // clean up
    customSensitiveInformationDao.deleteFor(relatedObjectUuid);
  }

  @Test
  void testLocation() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final Location input = new Location();
    input.setStatus(WithStatus.Status.ACTIVE);
    input.setType(Location.LocationType.POINT_LOCATION);
    input.setName("testLocation");
    input.setDescription(getRichText(LocationDao.TABLE_NAME, testOldUuid));
    input.setCustomFields(getJsonString(LocationDao.TABLE_NAME, testOldUuid));
    final Location created = locationDao.insert(input);
    assertContains(created.getDescription(), testOldUuid);
    assertContains(created.getCustomFields(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Location updated = locationDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getDescription(), testOldUuid);
    assertDoesNotContain(updated.getCustomFields(), testOldUuid);
    assertContains(updated.getDescription(), testNewUuid);
    assertContains(updated.getCustomFields(), testNewUuid);

    // clean up (through internal method)
    locationDao._deleteByUuid(LocationDao.TABLE_NAME, "uuid", updated.getUuid());
  }

  @Test
  void testNote() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final Note input = new Note();
    input.setType(Note.NoteType.FREE_TEXT);
    input.setAuthor(getRegularUserBean());
    input.setText(getRichText(NoteDao.TABLE_NAME, testOldUuid));
    input.setNoteRelatedObjects(List.of());
    final Note created = noteDao.insert(input);
    assertContains(created.getText(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Note updated = noteDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getText(), testOldUuid);
    assertContains(updated.getText(), testNewUuid);

    // clean up
    noteDao.delete(updated.getUuid());
  }

  @Test
  void testOrganization() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final Organization input = new Organization();
    input.setStatus(WithStatus.Status.ACTIVE);
    input.setShortName("testOrganization");
    input.setProfile(getRichText(OrganizationDao.TABLE_NAME, testOldUuid));
    input.setCustomFields(getJsonString(OrganizationDao.TABLE_NAME, testOldUuid));
    final Organization created = organizationDao.insert(input);
    assertContains(created.getProfile(), testOldUuid);
    assertContains(created.getCustomFields(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Organization updated = organizationDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getProfile(), testOldUuid);
    assertDoesNotContain(updated.getCustomFields(), testOldUuid);
    assertContains(updated.getProfile(), testNewUuid);
    assertContains(updated.getCustomFields(), testNewUuid);

    // clean up (through internal method)
    organizationDao._deleteByUuid(OrganizationDao.TABLE_NAME, "uuid", updated.getUuid());
  }

  @Test
  void testPerson() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final Person input = new Person();
    input.setStatus(WithStatus.Status.ACTIVE);
    input.setName("testPerson");
    input.setBiography(getRichText(PersonDao.TABLE_NAME, testOldUuid));
    input.setCustomFields(getJsonString(PersonDao.TABLE_NAME, testOldUuid));
    final Person created = personDao.insert(input);
    assertContains(created.getBiography(), testOldUuid);
    assertContains(created.getCustomFields(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Person updated = personDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getBiography(), testOldUuid);
    assertDoesNotContain(updated.getCustomFields(), testOldUuid);
    assertContains(updated.getBiography(), testNewUuid);
    assertContains(updated.getCustomFields(), testNewUuid);

    // clean up
    personDao.delete(updated.getUuid());
  }

  @Test
  void testPosition() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final Position input = new Position();
    input.setStatus(WithStatus.Status.ACTIVE);
    input.setType(Position.PositionType.REGULAR);
    input.setRole(Position.PositionRole.MEMBER);
    input.setName("testPosition");
    input.setCustomFields(getJsonString(PositionDao.TABLE_NAME, testOldUuid));
    final Position created = positionDao.insert(input);
    assertContains(created.getCustomFields(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Position updated = positionDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getCustomFields(), testOldUuid);
    assertContains(updated.getCustomFields(), testNewUuid);

    // clean up
    positionDao.delete(updated.getUuid());
  }

  @Test
  void testReport() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up (through GraphQL, so we can include report sensitive information)
    final mil.dds.anet.test.client.Person author = getRegularUser();
    final ReportSensitiveInformationInput rsiInput = ReportSensitiveInformationInput.builder()
        .withText(getRichText(ReportDao.TABLE_NAME, testOldUuid)).build();
    final ReportInput input = ReportInput.builder().withIntent("testReport")
        .withEngagementDate(Instant.now()).withAtmosphere(Atmosphere.NEUTRAL)
        .withReportPeople(getReportPeopleInput(List.of(personToReportAuthor(author))))
        .withReportText(getRichText(ReportDao.TABLE_NAME, testOldUuid))
        .withCustomFields(getJsonString(ReportDao.TABLE_NAME, testOldUuid))
        .withReportSensitiveInformation(rsiInput).build();
    final Report created = withCredentials(author.getDomainUsername(),
        t -> mutationExecutor.createReport(ReportResourceTest.FIELDS, input));
    assertContains(created.getReportText(), testOldUuid);
    assertContains(created.getCustomFields(), testOldUuid);
    assertContains(created.getReportSensitiveInformation().getText(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Report updated = withCredentials(author.getDomainUsername(),
        t -> queryExecutor.report(ReportResourceTest.FIELDS, created.getUuid()));
    assertDoesNotContain(updated.getReportText(), testOldUuid);
    assertDoesNotContain(updated.getCustomFields(), testOldUuid);
    assertDoesNotContain(updated.getReportSensitiveInformation().getText(), testOldUuid);
    assertContains(updated.getReportText(), testNewUuid);
    assertContains(updated.getCustomFields(), testNewUuid);
    assertContains(updated.getReportSensitiveInformation().getText(), testNewUuid);

    // clean up
    withCredentials(author.getDomainUsername(),
        t -> mutationExecutor.deleteReport("", updated.getUuid()));
  }

  @Test
  void testTask() {
    final String testOldUuid = UUID.randomUUID().toString();
    final String testNewUuid = UUID.randomUUID().toString();

    // set things up
    final Task input = new Task();
    input.setStatus(WithStatus.Status.ACTIVE);
    input.setShortName("testTask");
    input.setDescription(getRichText(TaskDao.TABLE_NAME, testOldUuid));
    input.setCustomFields(getJsonString(TaskDao.TABLE_NAME, testOldUuid));
    final Task created = taskDao.insert(input);
    assertContains(created.getDescription(), testOldUuid);
    assertContains(created.getCustomFields(), testOldUuid);

    // run the worker
    runMergedEntityWorker(testOldUuid, testNewUuid);

    // assert that the entity refs have been updated
    final Task updated = taskDao.getByUuid(created.getUuid());
    assertDoesNotContain(updated.getDescription(), testOldUuid);
    assertDoesNotContain(updated.getCustomFields(), testOldUuid);
    assertContains(updated.getDescription(), testNewUuid);
    assertContains(updated.getCustomFields(), testNewUuid);

    // clean up (through internal method)
    taskDao._deleteByUuid(TaskDao.TABLE_NAME, "uuid", updated.getUuid());
  }

  private void assertContains(String field, String uuid) {
    assertThat(field).containsPattern(getPattern(uuid));
  }

  private void assertDoesNotContain(String field, String uuid) {
    assertThat(field).doesNotContainPattern(getPattern(uuid));
  }

  private String getRichText(String tableName, String uuid) {
    return String.format("<p><a href=\"urn:anet:%1$s:%2$s\" rel=\"nofollow\">%1$s:%2$s</a></p>",
        tableName, uuid);
  }

  private String getJsonString(String tableName, String uuid) {
    return String.format("{\"relatedObject1\":{\"type\":\"%1$s\",\"uuid\":\"%2$s\"},"
        + "\"relatedObject2\":{\"type\":\"%1$s\",\"uuid\":\"%2$s\"}}", tableName, uuid);
  }

  private String getPattern(String testOldUuid) {
    return String.format("\\b%1$s\\b", testOldUuid);
  }

  private void runMergedEntityWorker(String testOldUuid, String testNewUuid) {
    final int nrBefore =
        adminDao.insertMergedEntity(new MergedEntity(testOldUuid, testNewUuid, Instant.now()));
    assertThat(nrBefore).isOne();
    mergedEntityWorker.run();
    final int nrAfter = adminDao.getMergedEntities().size();
    assertThat(nrAfter).isZero();
  }

}
