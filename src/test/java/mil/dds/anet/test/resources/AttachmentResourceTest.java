package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.List;
import java.util.Map;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.client.Attachment;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Location;
import mil.dds.anet.test.client.LocationInput;
import mil.dds.anet.test.client.LocationType;
import mil.dds.anet.test.client.Organization;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.ReportState;
import mil.dds.anet.test.client.Status;
import mil.dds.anet.test.client.util.MutationExecutor;
import org.junit.jupiter.api.Test;

class AttachmentResourceTest extends AbstractResourceTest {

  protected static final String ATTACHMENT_FIELDS =
      "{ uuid mimeType fileName description classification caption author { uuid }"
          + " attachmentRelatedObjects { objectUuid relatedObjectType relatedObjectUuid } }";
  private static final String _ATTACHMENTS_FIELDS =
      String.format("attachments %1$s", ATTACHMENT_FIELDS);
  private static final String OBJECT_FIELDS = String.format("{ uuid %1$s }", _ATTACHMENTS_FIELDS);

  // Normal user
  private final MutationExecutor erinMutationExecutor =
      getMutationExecutor(getRegularUser().getDomainUsername());
  // Superuser of EF 2.1
  private final MutationExecutor henryMutationExecutor = getMutationExecutor("henry");
  // Superusers of EF 2.2
  private final MutationExecutor rebeccaMutationExecutor =
      getMutationExecutor(getSuperuser().getDomainUsername());
  private final MutationExecutor jacobMutationExecutor = getMutationExecutor("jacob");

  @Test
  void testAttachment()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final Map<String, Object> attachmentSettings = AttachmentResource.getAttachmentSettings();

    final AttachmentInput testAttachmentInput =
        AttachmentInput.builder().withFileName("testAttachment.jpg")
            .withDescription("a test attachment created by testCreateAttachment")
            .withAttachmentRelatedObjects(List.of()).build();

    // Fail attachment create with a mimetype that is not allowed
    failAttachmentCreate(jackMutationExecutor, testAttachmentInput);

    // Fail attachment create with wrong classification
    testAttachmentInput.setMimeType(getFirstMimeType());
    testAttachmentInput.setClassification("NATO_UNCLASSIFIED");
    failAttachmentCreate(jackMutationExecutor, testAttachmentInput);

    // FIXME: change this setting in the dictionary, then test it!
    final Boolean userUploadDisabled = (Boolean) attachmentSettings.get("restrictToAdmins");
    if (userUploadDisabled) {
      // Fail attachment create with any user other than admin
      failAttachmentCreate(jackMutationExecutor, testAttachmentInput);
      // Succeed attachment create as admin
      final String createdAttachmentUuid =
          succeedAttachmentCreate(adminMutationExecutor, testAttachmentInput);
      assertThat(createdAttachmentUuid).isNotNull();
    }

    // Succeed attachment create with right classification and mimetype
    final AttachmentInput testAttachmentInput2 = AttachmentInput.builder()
        .withFileName("testCreateAttachment.jpg").withMimeType(getFirstMimeType())
        .withDescription("a test attachment created by testCreateAttachment")
        .withCaption("testCaption").withClassification(getFirstClassification())
        .withAttachmentRelatedObjects(List.of()).build();
    final String createdAttachmentUuid2 =
        succeedAttachmentCreate(jackMutationExecutor, testAttachmentInput2);
    assertThat(createdAttachmentUuid2).isNotNull();

    // Get the attachment
    final Attachment createdAttachment =
        jackQueryExecutor.attachment(ATTACHMENT_FIELDS, createdAttachmentUuid2);
    assertThat(createdAttachment.getAuthor().getUuid()).isEqualTo(getJackJackson().getUuid());
    assertThat(createdAttachment.getFileName()).isEqualTo(testAttachmentInput2.getFileName());
    assertThat(createdAttachment.getMimeType()).isEqualTo(testAttachmentInput2.getMimeType());
    assertThat(createdAttachment.getDescription()).isEqualTo(testAttachmentInput2.getDescription());
    assertThat(createdAttachment.getCaption()).isEqualTo(testAttachmentInput2.getCaption());
    assertThat(createdAttachment.getClassification())
        .isEqualTo(testAttachmentInput2.getClassification());
    assertThat(createdAttachment.getAttachmentRelatedObjects())
        .hasSameSizeAs(testAttachmentInput2.getAttachmentRelatedObjects());
    assertThat(createdAttachment.getContentLength()).isNull();
  }

  @Test
  void testLocationAttachments()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // Create test location
    final LocationInput testLocationInput = LocationInput.builder().withStatus(Status.ACTIVE)
        .withName("a test location created by testLocationAttachment")
        .withType(LocationType.VIRTUAL_LOCATION).build();
    final Location testLocation =
        adminMutationExecutor.createLocation(OBJECT_FIELDS, testLocationInput);
    assertThat(testLocation).isNotNull();
    assertThat(testLocation.getUuid()).isNotNull();
    final int nrOfAttachments = testLocation.getAttachments().size();

    // Add attachment to test location
    final AttachmentInput testAttachmentInput =
        buildAttachment(LocationDao.TABLE_NAME, testLocation.getUuid());

    // Test attachment create
    final CreateLocationAttachmentsResult result =
        testCreateLocationAttachments(testAttachmentInput);

    // Check the location
    final Location location = jackQueryExecutor.location(OBJECT_FIELDS, testLocation.getUuid());
    assertThat(location.getAttachments()).hasSize(nrOfAttachments + 3);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment superuserAttachment1 = location.getAttachments().stream()
        .filter(a -> result.superuserAttachmentUuid1().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.superuserAttachmentUuid1(), testAttachmentInput,
        superuserAttachment1);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment superuserAttachment2 = location.getAttachments().stream()
        .filter(a -> result.superuserAttachmentUuid2().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.superuserAttachmentUuid2(), testAttachmentInput,
        superuserAttachment2);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment adminAttachment = location.getAttachments().stream()
        .filter(a -> result.adminAttachmentUuid().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.adminAttachmentUuid(), testAttachmentInput, adminAttachment);

    // Test attachment update
    testUpdateLocationAttachments(location.getUuid(), location.getAttachments().size(),
        superuserAttachment1, superuserAttachment2);

    // Test attachment delete
    testDeleteLocationAttachments(location.getUuid(), location.getAttachments().size(),
        superuserAttachment1, superuserAttachment2, adminAttachment);
  }

  private CreateLocationAttachmentsResult testCreateLocationAttachments(
      AttachmentInput testAttachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - create attachment as normal user
    failAttachmentCreate(erinMutationExecutor, testAttachmentInput);

    // S - create attachment as superuser
    final String superuserAttachmentUuid1 =
        succeedAttachmentCreate(rebeccaMutationExecutor, testAttachmentInput);
    final String superuserAttachmentUuid2 =
        succeedAttachmentCreate(rebeccaMutationExecutor, testAttachmentInput);

    // S - create attachment as admin
    final String adminAttachmentUuid =
        succeedAttachmentCreate(adminMutationExecutor, testAttachmentInput);

    return new CreateLocationAttachmentsResult(superuserAttachmentUuid1, superuserAttachmentUuid2,
        adminAttachmentUuid);
  }

  private record CreateLocationAttachmentsResult(String superuserAttachmentUuid1,
      String superuserAttachmentUuid2, String adminAttachmentUuid) {}

  private void testUpdateLocationAttachments(final String locationUuid, final int nrOfAttachments,
      final Attachment superuserAttachment1, final Attachment superuserAttachment2)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - update attachment as normal user
    superuserAttachment1.setFileName("erinUpdatedAttachment.jpg");
    failAttachmentUpdate(erinMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as different superuser
    superuserAttachment1.setFileName("henryUpdatedAttachment.jpg");
    failAttachmentUpdate(henryMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));

    // S - update attachment as superuser
    superuserAttachment1.setFileName("jackUpdatedAttachment.jpg");
    succeedAttachmentUpdate(rebeccaMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));
    Location location = jackQueryExecutor.location(OBJECT_FIELDS, locationUuid);
    assertThat(location.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment1 = location.getAttachments().stream()
        .filter(a -> superuserAttachment1.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment1.getFileName())
        .isEqualTo(superuserAttachment1.getFileName());

    // S - update attachment as admin
    superuserAttachment2.setFileName("adminUpdatedAttachment.jpg");
    succeedAttachmentUpdate(adminMutationExecutor,
        getInput(superuserAttachment2, AttachmentInput.class));
    location = jackQueryExecutor.location(OBJECT_FIELDS, locationUuid);
    assertThat(location.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment2 = location.getAttachments().stream()
        .filter(a -> superuserAttachment2.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment2.getFileName())
        .isEqualTo(superuserAttachment2.getFileName());
  }

  private void testDeleteLocationAttachments(final String locationUuid, final int nrOfAttachments,
      final Attachment superuserAttachment1, final Attachment superuserAttachment2,
      final Attachment adminAttachment)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - delete attachment as normal user
    failAttachmentDelete(erinMutationExecutor, superuserAttachment1.getUuid());

    // F - delete attachment as different superuser
    failAttachmentDelete(henryMutationExecutor, superuserAttachment1.getUuid());

    // S - delete attachment as superuser
    succeedAttachmentDelete(rebeccaMutationExecutor, superuserAttachment1.getUuid());
    Location location = jackQueryExecutor.location(OBJECT_FIELDS, locationUuid);
    assertThat(location.getAttachments()).hasSize(nrOfAttachments - 1);

    // S - delete superuser attachment as admin
    succeedAttachmentDelete(adminMutationExecutor, superuserAttachment2.getUuid());
    location = jackQueryExecutor.location(OBJECT_FIELDS, locationUuid);
    assertThat(location.getAttachments()).hasSize(nrOfAttachments - 2);

    // S - delete admin attachment as admin
    succeedAttachmentDelete(adminMutationExecutor, adminAttachment.getUuid());
    location = jackQueryExecutor.location(OBJECT_FIELDS, locationUuid);
    assertThat(location.getAttachments()).hasSize(nrOfAttachments - 3);
  }

  @Test
  void testOrganizationAttachments()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // Get test organization
    final Organization testOrganization =
        adminQueryExecutor.organization(OBJECT_FIELDS, "ccbee4bb-08b8-42df-8cb5-65e8172f657b");
    assertThat(testOrganization).isNotNull();
    assertThat(testOrganization.getUuid()).isNotNull();
    final int nrOfAttachments = testOrganization.getAttachments().size();

    // Add attachment to test organization
    final AttachmentInput testAttachmentInput =
        buildAttachment(OrganizationDao.TABLE_NAME, testOrganization.getUuid());

    // Test attachment create
    final CreateOrganizationAttachmentsResult result =
        testCreateOrganizationAttachments(testAttachmentInput);

    // Check the organization
    final Organization organization =
        jackQueryExecutor.organization(OBJECT_FIELDS, testOrganization.getUuid());
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments + 3);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment superuserAttachment1 = organization.getAttachments().stream()
        .filter(a -> result.superuserAttachmentUuid1().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.superuserAttachmentUuid1(), testAttachmentInput,
        superuserAttachment1);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment superuserAttachment2 = organization.getAttachments().stream()
        .filter(a -> result.superuserAttachmentUuid2().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.superuserAttachmentUuid2(), testAttachmentInput,
        superuserAttachment2);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment adminAttachment = organization.getAttachments().stream()
        .filter(a -> result.adminAttachmentUuid().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.adminAttachmentUuid(), testAttachmentInput, adminAttachment);

    // Test attachment update
    testUpdateOrganizationAttachments(organization.getUuid(), organization.getAttachments().size(),
        superuserAttachment1, superuserAttachment2);

    // Test attachment delete
    testDeleteOrganizationAttachments(organization.getUuid(), organization.getAttachments().size(),
        superuserAttachment1, superuserAttachment2, adminAttachment);
  }

  private CreateOrganizationAttachmentsResult testCreateOrganizationAttachments(
      AttachmentInput testAttachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - create attachment as normal user
    failAttachmentCreate(erinMutationExecutor, testAttachmentInput);

    // F - create attachment as superuser of different organization
    failAttachmentCreate(henryMutationExecutor, testAttachmentInput);

    // S - create attachment as superuser
    final String superuserAttachmentUuid1 =
        succeedAttachmentCreate(rebeccaMutationExecutor, testAttachmentInput);
    final String superuserAttachmentUuid2 =
        succeedAttachmentCreate(rebeccaMutationExecutor, testAttachmentInput);

    // S - create attachment as admin
    final String adminAttachmentUuid =
        succeedAttachmentCreate(adminMutationExecutor, testAttachmentInput);

    return new CreateOrganizationAttachmentsResult(superuserAttachmentUuid1,
        superuserAttachmentUuid2, adminAttachmentUuid);
  }

  private record CreateOrganizationAttachmentsResult(String superuserAttachmentUuid1,
      String superuserAttachmentUuid2, String adminAttachmentUuid) {}

  private void testUpdateOrganizationAttachments(final String organizationUuid,
      final int nrOfAttachments, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - update attachment as normal user
    superuserAttachment1.setFileName("erinUpdatedAttachment.jpg");
    failAttachmentUpdate(erinMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as superuser of different organization
    superuserAttachment1.setFileName("henryUpdatedAttachment.jpg");
    failAttachmentUpdate(henryMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as different superuser
    superuserAttachment1.setFileName("jacobUpdatedAttachment.jpg");
    failAttachmentUpdate(jacobMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));

    // S - update attachment as superuser
    superuserAttachment1.setFileName("rebeccaUpdatedAttachment.jpg");
    succeedAttachmentUpdate(rebeccaMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));
    Organization organization = jackQueryExecutor.organization(OBJECT_FIELDS, organizationUuid);
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment1 = organization.getAttachments().stream()
        .filter(a -> superuserAttachment1.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment1.getFileName())
        .isEqualTo(superuserAttachment1.getFileName());

    // S - update attachment as admin
    superuserAttachment2.setFileName("adminUpdatedAttachment.jpg");
    succeedAttachmentUpdate(adminMutationExecutor,
        getInput(superuserAttachment2, AttachmentInput.class));
    organization = jackQueryExecutor.organization(OBJECT_FIELDS, organizationUuid);
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment2 = organization.getAttachments().stream()
        .filter(a -> superuserAttachment2.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment2.getFileName())
        .isEqualTo(superuserAttachment2.getFileName());
  }

  private void testDeleteOrganizationAttachments(final String organizationUuid,
      final int nrOfAttachments, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2, final Attachment adminAttachment)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - delete attachment as normal user
    failAttachmentDelete(erinMutationExecutor, superuserAttachment1.getUuid());

    // F - delete attachment as superuser of different organization
    failAttachmentDelete(henryMutationExecutor, superuserAttachment1.getUuid());

    // F - delete attachment as different superuser
    failAttachmentDelete(jacobMutationExecutor, superuserAttachment1.getUuid());

    // S - delete attachment as superuser
    succeedAttachmentDelete(rebeccaMutationExecutor, superuserAttachment1.getUuid());
    Organization organization = jackQueryExecutor.organization(OBJECT_FIELDS, organizationUuid);
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments - 1);

    // S - delete superuser attachment as admin
    succeedAttachmentDelete(adminMutationExecutor, superuserAttachment2.getUuid());
    organization = jackQueryExecutor.organization(OBJECT_FIELDS, organizationUuid);
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments - 2);

    // S - delete admin attachment as admin
    succeedAttachmentDelete(adminMutationExecutor, adminAttachment.getUuid());
    organization = jackQueryExecutor.organization(OBJECT_FIELDS, organizationUuid);
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments - 3);
  }

  @Test
  void testReportAttachment()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // Create test report
    final ReportInput testReportInput = ReportInput.builder().withState(ReportState.DRAFT)
        .withIntent("a test report created by testReportAttachment")
        .withReportPeople(getReportPeopleInput(List.of(personToReportAuthor(getJackJackson()))))
        .build();
    final Report testReport = jackMutationExecutor.createReport(OBJECT_FIELDS, testReportInput);
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();
    final int nrOfAttachments = testReport.getAttachments().size();

    // Add attachment to test report
    final AttachmentInput testAttachmentInput =
        buildAttachment(ReportDao.TABLE_NAME, testReport.getUuid());

    // Test attachment create
    final String createdAttachmentUuid = testCreateReportAttachment(testAttachmentInput);

    // Check the report
    final Report report = jackQueryExecutor.report(OBJECT_FIELDS, testReport.getUuid());
    assertThat(report.getAttachments()).hasSize(nrOfAttachments + 1);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment attachment = report.getAttachments().stream()
        .filter(a -> createdAttachmentUuid.equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(createdAttachmentUuid, testAttachmentInput, attachment);

    // Test attachment update
    testUpdateReportAttachment(report.getUuid(), report.getAttachments().size(), attachment);

    // Test attachment delete
    testDeleteReportAttachment(report.getUuid(), report.getAttachments().size(), attachment);

    // Finally, delete the report
    jackMutationExecutor.deleteReport("", report.getUuid());
  }

  private String testCreateReportAttachment(final AttachmentInput testAttachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - create attachment as non-author
    failAttachmentCreate(erinMutationExecutor, testAttachmentInput);

    // F - create attachment as admin
    failAttachmentCreate(adminMutationExecutor, testAttachmentInput);

    // S - create attachment as author
    return succeedAttachmentCreate(jackMutationExecutor, testAttachmentInput);
  }

  private void testUpdateReportAttachment(final String reportUuid, final int nrOfAttachments,
      final Attachment attachment)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - update attachment as non-author
    attachment.setFileName("erinUpdatedAttachment.jpg");
    failAttachmentUpdate(erinMutationExecutor, getInput(attachment, AttachmentInput.class));

    // F - update attachment as admin
    attachment.setFileName("adminUpdatedAttachment.jpg");
    failAttachmentUpdate(erinMutationExecutor, getInput(attachment, AttachmentInput.class));

    // S - update attachment as author
    attachment.setFileName("jackUpdatedAttachment.jpg");
    succeedAttachmentUpdate(jackMutationExecutor, getInput(attachment, AttachmentInput.class));
    final Report report = jackQueryExecutor.report(OBJECT_FIELDS, reportUuid);
    assertThat(report.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedAttachment = report.getAttachments().stream()
        .filter(a -> attachment.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedAttachment.getFileName()).isEqualTo(attachment.getFileName());
  }

  private void testDeleteReportAttachment(final String reportUuid, final int nrOfAttachments,
      final Attachment attachment)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // F - delete attachment as non-author
    failAttachmentDelete(erinMutationExecutor, attachment.getUuid());

    // F - delete attachment as admin
    failAttachmentDelete(adminMutationExecutor, attachment.getUuid());

    // S - delete attachment as author
    succeedAttachmentDelete(jackMutationExecutor, attachment.getUuid());
    final Report report = jackQueryExecutor.report(OBJECT_FIELDS, reportUuid);
    assertThat(report.getAttachments()).hasSize(nrOfAttachments - 1);
  }

  @Test
  void testPersonAttachments()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // Get test person
    final Person testPerson =
        adminQueryExecutor.person(OBJECT_FIELDS, "df9c7381-56ac-4bc5-8e24-ec524bccd7e9");
    assertThat(testPerson).isNotNull();
    assertThat(testPerson.getUuid()).isNotNull();
    final int nrOfAttachments = testPerson.getAttachments().size();

    // Add attachment to test person
    final AttachmentInput testAttachmentInput =
        buildAttachment(PersonDao.TABLE_NAME, testPerson.getUuid());

    // Test attachment create
    final CreatePersonAttachmentsResult result = testCreatePersonAttachments(testAttachmentInput);

    // Check the person
    final Person person = jackQueryExecutor.person(OBJECT_FIELDS, testPerson.getUuid());
    assertThat(person.getAttachments()).hasSize(nrOfAttachments + 4);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment userAttachment = person.getAttachments().stream()
        .filter(a -> result.userAttachmentUuid().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.userAttachmentUuid(), testAttachmentInput, userAttachment);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment superuserAttachment1 = person.getAttachments().stream()
        .filter(a -> result.superuserAttachmentUuid1().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.superuserAttachmentUuid1(), testAttachmentInput,
        superuserAttachment1);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment superuserAttachment2 = person.getAttachments().stream()
        .filter(a -> result.superuserAttachmentUuid2().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.superuserAttachmentUuid2(), testAttachmentInput,
        superuserAttachment2);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment adminAttachment = person.getAttachments().stream()
        .filter(a -> result.adminAttachmentUuid().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.adminAttachmentUuid(), testAttachmentInput, adminAttachment);

    // Test attachment update
    testUpdatePersonAttachments(person.getUuid(), person.getAttachments().size(), userAttachment,
        superuserAttachment1, superuserAttachment2);

    // Test attachment delete
    testDeletePersonAttachments(person.getUuid(), person.getAttachments().size(), userAttachment,
        superuserAttachment1, superuserAttachment2, adminAttachment);
  }

  private CreatePersonAttachmentsResult testCreatePersonAttachments(
      AttachmentInput testAttachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // S - create attachment as normal user
    final String userAttachmentUuid =
        succeedAttachmentCreate(erinMutationExecutor, testAttachmentInput);

    // F - create attachment as superuser of different person
    failAttachmentCreate(henryMutationExecutor, testAttachmentInput);

    // S - create attachment as superuser
    final String superuserAttachmentUuid1 =
        succeedAttachmentCreate(rebeccaMutationExecutor, testAttachmentInput);
    final String superuserAttachmentUuid2 =
        succeedAttachmentCreate(rebeccaMutationExecutor, testAttachmentInput);

    // S - create attachment as admin
    final String adminAttachmentUuid =
        succeedAttachmentCreate(adminMutationExecutor, testAttachmentInput);

    return new CreatePersonAttachmentsResult(userAttachmentUuid, superuserAttachmentUuid1,
        superuserAttachmentUuid2, adminAttachmentUuid);
  }

  private record CreatePersonAttachmentsResult(String userAttachmentUuid,
      String superuserAttachmentUuid1, String superuserAttachmentUuid2,
      String adminAttachmentUuid) {}

  private void testUpdatePersonAttachments(final String personUuid, final int nrOfAttachments,
      final Attachment userAttachment, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // S - update attachment as normal user
    userAttachment.setFileName("erinUpdatedAttachment.jpg");
    succeedAttachmentUpdate(erinMutationExecutor, getInput(userAttachment, AttachmentInput.class));
    Person person = jackQueryExecutor.person(OBJECT_FIELDS, personUuid);
    assertThat(person.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedUserAttachment = person.getAttachments().stream()
        .filter(a -> userAttachment.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedUserAttachment.getFileName()).isEqualTo(userAttachment.getFileName());

    // F - update attachment as superuser of different person
    superuserAttachment1.setFileName("henryUpdatedAttachment.jpg");
    failAttachmentUpdate(henryMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as different superuser
    superuserAttachment1.setFileName("jacobUpdatedAttachment.jpg");
    failAttachmentUpdate(jacobMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));

    // S - update attachment as superuser
    superuserAttachment1.setFileName("rebeccaUpdatedAttachment.jpg");
    succeedAttachmentUpdate(rebeccaMutationExecutor,
        getInput(superuserAttachment1, AttachmentInput.class));
    person = jackQueryExecutor.person(OBJECT_FIELDS, personUuid);
    assertThat(person.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment1 = person.getAttachments().stream()
        .filter(a -> superuserAttachment1.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment1.getFileName())
        .isEqualTo(superuserAttachment1.getFileName());

    // S - update attachment as admin
    superuserAttachment2.setFileName("adminUpdatedAttachment.jpg");
    succeedAttachmentUpdate(adminMutationExecutor,
        getInput(superuserAttachment2, AttachmentInput.class));
    person = jackQueryExecutor.person(OBJECT_FIELDS, personUuid);
    assertThat(person.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment2 = person.getAttachments().stream()
        .filter(a -> superuserAttachment2.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment2.getFileName())
        .isEqualTo(superuserAttachment2.getFileName());
  }

  private void testDeletePersonAttachments(final String personUuid, final int nrOfAttachments,
      final Attachment userAttachment, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2, final Attachment adminAttachment)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    // S - delete attachment as normal user
    succeedAttachmentDelete(erinMutationExecutor, userAttachment.getUuid());
    Person person = jackQueryExecutor.person(OBJECT_FIELDS, personUuid);
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 1);

    // F - delete attachment as superuser of different person
    failAttachmentDelete(henryMutationExecutor, superuserAttachment1.getUuid());

    // F - delete attachment as different superuser
    failAttachmentDelete(jacobMutationExecutor, superuserAttachment1.getUuid());

    // S - delete attachment as superuser
    succeedAttachmentDelete(rebeccaMutationExecutor, superuserAttachment1.getUuid());
    person = jackQueryExecutor.person(OBJECT_FIELDS, personUuid);
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 2);

    // S - delete superuser attachment as admin
    succeedAttachmentDelete(adminMutationExecutor, superuserAttachment2.getUuid());
    person = jackQueryExecutor.person(OBJECT_FIELDS, personUuid);
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 3);

    // S - delete ADMIN attachment as admin
    succeedAttachmentDelete(adminMutationExecutor, adminAttachment.getUuid());
    person = jackQueryExecutor.person(OBJECT_FIELDS, personUuid);
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 4);
  }

  private GenericRelatedObjectInput createAttachmentRelatedObject(final String tableName,
      final String uuid) {
    return GenericRelatedObjectInput.builder().withRelatedObjectType(tableName)
        .withRelatedObjectUuid(uuid).build();
  }

  private String succeedAttachmentCreate(final MutationExecutor mutationExecutor,
      final AttachmentInput attachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final String createdAttachmentUuid = mutationExecutor.createAttachment("", attachmentInput);
    assertThat(createdAttachmentUuid).isNotNull();
    return createdAttachmentUuid;
  }

  private void failAttachmentCreate(final MutationExecutor mutationExecutor,
      final AttachmentInput attachmentInput) {
    try {
      mutationExecutor.createAttachment("", attachmentInput);
      fail("Expected exception creating attachment");
    } catch (Exception expected) {
      // OK
    }
  }

  private void succeedAttachmentDelete(final MutationExecutor mutationExecutor,
      final String attachmentUuid)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final Integer nrDeleted = mutationExecutor.deleteAttachment("", attachmentUuid);
    assertThat(nrDeleted).isOne();
  }

  private void failAttachmentDelete(final MutationExecutor mutationExecutor,
      final String attachmentUuid) {
    try {
      mutationExecutor.deleteAttachment("", attachmentUuid);
      fail("Expected exception deleting attachment");
    } catch (Exception expected) {
      // OK
    }
  }

  private void succeedAttachmentUpdate(final MutationExecutor mutationExecutor,
      final AttachmentInput attachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final String updatedAttachmentUuid = mutationExecutor.updateAttachment("", attachmentInput);
    assertThat(updatedAttachmentUuid).isNotNull();
  }

  private void failAttachmentUpdate(final MutationExecutor mutationExecutor,
      final AttachmentInput attachmentInput) {
    try {
      mutationExecutor.updateAttachment("", attachmentInput);
      fail("Expected exception updating attachment");
    } catch (Exception expected) {
      // OK
    }
  }

  private void assertAttachmentDetails(final String attachmentUuid,
      final AttachmentInput attachmentInput, final Attachment attachment) {
    assertThat(attachment.getUuid()).isEqualTo(attachmentUuid);
    assertThat(attachment.getFileName()).isEqualTo(attachmentInput.getFileName());
    assertThat(attachment.getMimeType()).isEqualTo(attachmentInput.getMimeType());
    assertThat(attachment.getDescription()).isEqualTo(attachmentInput.getDescription());
    assertThat(attachment.getCaption()).isEqualTo(attachmentInput.getCaption());
    assertThat(attachment.getClassification()).isEqualTo(attachmentInput.getClassification());
    assertThat(attachment.getAttachmentRelatedObjects())
        .hasSameSizeAs(attachmentInput.getAttachmentRelatedObjects());
  }

  private AttachmentInput buildAttachment(final String tableName, final String uuid) {
    return AttachmentInput.builder().withFileName("testAttachment.jpg")
        .withMimeType(getFirstMimeType())
        .withDescription("a test attachment created by AttachmentResourceTest")
        .withCaption("testCaption").withClassification(getFirstClassification())
        .withAttachmentRelatedObjects(List.of(createAttachmentRelatedObject(tableName, uuid)))
        .build();
  }

  private String getFirstMimeType() {
    final var allowedMimeTypes = AttachmentResource.getAllowedMimeTypes();
    return allowedMimeTypes.get(0);
  }

  private String getFirstClassification() {
    final var allowedClassifications = AttachmentResource.getAllowedClassifications();
    return allowedClassifications.keySet().iterator().next();
  }

}
