package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.client.AnetBeanList_Attachment;
import mil.dds.anet.test.client.Attachment;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.AttachmentSearchQueryInput;
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
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.Test;

public class AttachmentResourceTest extends AbstractResourceTest {

  public static final String ATTACHMENT_FIELDS =
      "{ uuid mimeType fileName description classification caption author { uuid }"
          + " attachmentRelatedObjects { objectUuid relatedObjectType relatedObjectUuid } }";
  private static final String _ATTACHMENTS_FIELDS =
      String.format("attachments %1$s", ATTACHMENT_FIELDS);
  private static final String OBJECT_FIELDS = String.format("{ uuid %1$s }", _ATTACHMENTS_FIELDS);

  @Test
  void searchByMimeType() {
    final AttachmentSearchQueryInput sqAll =
        AttachmentSearchQueryInput.builder().withPageSize(0).build();
    final AnetBeanList_Attachment attachmentList = withCredentials(adminUser,
        t -> queryExecutor.attachmentList(getListFields(ATTACHMENT_FIELDS), sqAll));
    assertThat(attachmentList).isNotNull();
    assertThat(attachmentList.getList()).isNotEmpty();
    final Map<String, List<Attachment>> attachmentsByMimeType =
        attachmentList.getList().stream().collect(Collectors.groupingBy(Attachment::getMimeType));
    attachmentsByMimeType.forEach((k, v) -> {
      final AttachmentSearchQueryInput sqByMimeType =
          AttachmentSearchQueryInput.builder().withPageSize(0).withMimeType(k).build();
      final AnetBeanList_Attachment attachmentListForMimeType = withCredentials(adminUser,
          t -> queryExecutor.attachmentList(getListFields(ATTACHMENT_FIELDS), sqByMimeType));
      assertThat(attachmentListForMimeType).isNotNull();
      assertThat(attachmentListForMimeType.getList()).usingRecursiveFieldByFieldElementComparator()
          .hasSameElementsAs(v);
    });
  }

  @Test
  void searchByClassification() {
    final AttachmentSearchQueryInput sqAll =
        AttachmentSearchQueryInput.builder().withPageSize(0).build();
    final AnetBeanList_Attachment attachmentList = withCredentials(adminUser,
        t -> queryExecutor.attachmentList(getListFields(ATTACHMENT_FIELDS), sqAll));
    assertThat(attachmentList).isNotNull();
    assertThat(attachmentList.getList()).isNotEmpty();
    final Map<String, List<Attachment>> attachmentsByClassification =
        attachmentList.getList().stream().filter(a -> !Utils.isEmptyOrNull(a.getClassification()))
            .collect(Collectors.groupingBy(Attachment::getClassification));
    attachmentsByClassification.forEach((k, v) -> {
      final AttachmentSearchQueryInput sqByClassification =
          AttachmentSearchQueryInput.builder().withPageSize(0).withClassification(k).build();
      final AnetBeanList_Attachment attachmentListForClassification = withCredentials(adminUser,
          t -> queryExecutor.attachmentList(getListFields(ATTACHMENT_FIELDS), sqByClassification));
      assertThat(attachmentListForClassification).isNotNull();
      assertThat(attachmentListForClassification.getList())
          .usingRecursiveFieldByFieldElementComparator().hasSameElementsAs(v);
    });
  }

  @Test
  void searchByCaption() {
    final AttachmentSearchQueryInput sqAll =
        AttachmentSearchQueryInput.builder().withPageSize(0).build();
    final AnetBeanList_Attachment attachmentList = withCredentials(adminUser,
        t -> queryExecutor.attachmentList(getListFields(ATTACHMENT_FIELDS), sqAll));
    assertThat(attachmentList).isNotNull();
    assertThat(attachmentList.getList()).isNotEmpty();
    final Map<String, List<Attachment>> attachmentsByClassification =
        attachmentList.getList().stream().filter(a -> !Utils.isEmptyOrNull(a.getCaption()))
            .collect(Collectors.groupingBy(Attachment::getCaption));
    attachmentsByClassification.forEach((k, v) -> {
      final AttachmentSearchQueryInput sqByCaption =
          AttachmentSearchQueryInput.builder().withPageSize(0).withText(k).build();
      final AnetBeanList_Attachment attachmentListForCaption = withCredentials(adminUser,
          t -> queryExecutor.attachmentList(getListFields(ATTACHMENT_FIELDS), sqByCaption));
      assertThat(attachmentListForCaption).isNotNull();
      assertThat(attachmentListForCaption.getList()).usingRecursiveFieldByFieldElementComparator()
          .hasSameElementsAs(v);
    });
  }

  @Test
  void testAttachment() {
    final Map<String, Object> attachmentSettings = AttachmentResource.getAttachmentSettings();

    final AttachmentInput testAttachmentInput =
        AttachmentInput.builder().withFileName("testAttachment.jpg")
            .withDescription("a test attachment created by testCreateAttachment")
            .withAttachmentRelatedObjects(List.of()).build();

    // Fail attachment create with a mimetype that is not allowed
    failAttachmentCreate(jackUser, testAttachmentInput);

    // Fail attachment create with wrong classification
    testAttachmentInput.setMimeType(getFirstMimeType());
    testAttachmentInput.setClassification("NATO_UNCLASSIFIED");
    failAttachmentCreate(jackUser, testAttachmentInput);

    // FIXME: change this setting in the dictionary, then test it!
    final Boolean userUploadDisabled = (Boolean) attachmentSettings.get("restrictToAdmins");
    if (userUploadDisabled) {
      // Fail attachment create with any user other than admin
      failAttachmentCreate(jackUser, testAttachmentInput);
      // Succeed attachment create as admin
      final String createdAttachmentUuid = succeedAttachmentCreate(adminUser, testAttachmentInput);
      assertThat(createdAttachmentUuid).isNotNull();
    }

    // Succeed attachment create with right classification and mimetype
    final AttachmentInput testAttachmentInput2 = AttachmentInput.builder()
        .withFileName("testCreateAttachment.jpg").withMimeType(getFirstMimeType())
        .withDescription("a test attachment created by testCreateAttachment")
        .withCaption("testCaption").withClassification(getFirstClassification())
        .withAttachmentRelatedObjects(List.of()).build();
    final String createdAttachmentUuid2 = succeedAttachmentCreate(jackUser, testAttachmentInput2);
    assertThat(createdAttachmentUuid2).isNotNull();

    // Get the attachment
    final Attachment createdAttachment = withCredentials(jackUser,
        t -> queryExecutor.attachment(ATTACHMENT_FIELDS, createdAttachmentUuid2));
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
  void testLocationAttachments() {
    // Create test location
    final LocationInput testLocationInput = LocationInput.builder().withStatus(Status.ACTIVE)
        .withName("a test location created by testLocationAttachment")
        .withType(LocationType.VIRTUAL_LOCATION).build();
    final Location testLocation = withCredentials(adminUser,
        t -> mutationExecutor.createLocation(OBJECT_FIELDS, testLocationInput));
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
    final Location location = withCredentials(jackUser,
        t -> queryExecutor.location(OBJECT_FIELDS, testLocation.getUuid()));
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
      AttachmentInput testAttachmentInput) {
    // F - create attachment as normal user
    failAttachmentCreate("erin", testAttachmentInput);

    // S - create attachment as superuser
    final String superuserAttachmentUuid1 = succeedAttachmentCreate("rebecca", testAttachmentInput);
    final String superuserAttachmentUuid2 = succeedAttachmentCreate("rebecca", testAttachmentInput);

    // S - create attachment as admin
    final String adminAttachmentUuid = succeedAttachmentCreate(adminUser, testAttachmentInput);

    return new CreateLocationAttachmentsResult(superuserAttachmentUuid1, superuserAttachmentUuid2,
        adminAttachmentUuid);
  }

  private record CreateLocationAttachmentsResult(String superuserAttachmentUuid1,
      String superuserAttachmentUuid2, String adminAttachmentUuid) {
  }

  private void testUpdateLocationAttachments(final String locationUuid, final int nrOfAttachments,
      final Attachment superuserAttachment1, final Attachment superuserAttachment2) {
    // F - update attachment as normal user
    superuserAttachment1.setFileName("erinUpdatedAttachment.jpg");
    failAttachmentUpdate("erin", getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as different superuser
    superuserAttachment1.setFileName("henryUpdatedAttachment.jpg");
    failAttachmentUpdate("henry", getInput(superuserAttachment1, AttachmentInput.class));

    // S - update attachment as superuser
    superuserAttachment1.setFileName("jackUpdatedAttachment.jpg");
    succeedAttachmentUpdate("rebecca", getInput(superuserAttachment1, AttachmentInput.class));
    Location location =
        withCredentials(jackUser, t -> queryExecutor.location(OBJECT_FIELDS, locationUuid));
    assertThat(location.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment1 = location.getAttachments().stream()
        .filter(a -> superuserAttachment1.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment1.getFileName())
        .isEqualTo(superuserAttachment1.getFileName());

    // S - update attachment as admin
    superuserAttachment2.setFileName("adminUpdatedAttachment.jpg");
    succeedAttachmentUpdate(adminUser, getInput(superuserAttachment2, AttachmentInput.class));
    location = withCredentials(jackUser, t -> queryExecutor.location(OBJECT_FIELDS, locationUuid));
    assertThat(location.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment2 = location.getAttachments().stream()
        .filter(a -> superuserAttachment2.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment2.getFileName())
        .isEqualTo(superuserAttachment2.getFileName());
  }

  private void testDeleteLocationAttachments(final String locationUuid, final int nrOfAttachments,
      final Attachment superuserAttachment1, final Attachment superuserAttachment2,
      final Attachment adminAttachment) {
    // F - delete attachment as normal user
    failAttachmentDelete("erin", superuserAttachment1.getUuid());

    // F - delete attachment as different superuser
    failAttachmentDelete("henry", superuserAttachment1.getUuid());

    // S - delete attachment as superuser
    succeedAttachmentDelete("rebecca", superuserAttachment1.getUuid());
    Location location =
        withCredentials(jackUser, t -> queryExecutor.location(OBJECT_FIELDS, locationUuid));
    assertThat(location.getAttachments()).hasSize(nrOfAttachments - 1);

    // S - delete superuser attachment as admin
    succeedAttachmentDelete(adminUser, superuserAttachment2.getUuid());
    location = withCredentials(jackUser, t -> queryExecutor.location(OBJECT_FIELDS, locationUuid));
    assertThat(location.getAttachments()).hasSize(nrOfAttachments - 2);

    // S - delete admin attachment as admin
    succeedAttachmentDelete(adminUser, adminAttachment.getUuid());
    location = withCredentials(jackUser, t -> queryExecutor.location(OBJECT_FIELDS, locationUuid));
    assertThat(location.getAttachments()).hasSize(nrOfAttachments - 3);
  }

  @Test
  void testOrganizationAttachments() {
    // Get test organization
    final Organization testOrganization = withCredentials(adminUser,
        t -> queryExecutor.organization(OBJECT_FIELDS, "ccbee4bb-08b8-42df-8cb5-65e8172f657b"));
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
    final Organization organization = withCredentials(jackUser,
        t -> queryExecutor.organization(OBJECT_FIELDS, testOrganization.getUuid()));
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
      AttachmentInput testAttachmentInput) {
    // F - create attachment as normal user
    failAttachmentCreate("erin", testAttachmentInput);

    // F - create attachment as superuser of different organization
    failAttachmentCreate("henry", testAttachmentInput);

    // S - create attachment as superuser
    final String superuserAttachmentUuid1 = succeedAttachmentCreate("rebecca", testAttachmentInput);
    final String superuserAttachmentUuid2 = succeedAttachmentCreate("rebecca", testAttachmentInput);

    // S - create attachment as admin
    final String adminAttachmentUuid = succeedAttachmentCreate(adminUser, testAttachmentInput);

    return new CreateOrganizationAttachmentsResult(superuserAttachmentUuid1,
        superuserAttachmentUuid2, adminAttachmentUuid);
  }

  private record CreateOrganizationAttachmentsResult(String superuserAttachmentUuid1,
      String superuserAttachmentUuid2, String adminAttachmentUuid) {
  }

  private void testUpdateOrganizationAttachments(final String organizationUuid,
      final int nrOfAttachments, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2) {
    // F - update attachment as normal user
    superuserAttachment1.setFileName("erinUpdatedAttachment.jpg");
    failAttachmentUpdate("erin", getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as superuser of different organization
    superuserAttachment1.setFileName("henryUpdatedAttachment.jpg");
    failAttachmentUpdate("henry", getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as different superuser
    superuserAttachment1.setFileName("jacobUpdatedAttachment.jpg");
    failAttachmentUpdate("jacob", getInput(superuserAttachment1, AttachmentInput.class));

    // S - update attachment as superuser
    superuserAttachment1.setFileName("rebeccaUpdatedAttachment.jpg");
    succeedAttachmentUpdate("rebecca", getInput(superuserAttachment1, AttachmentInput.class));
    Organization organization =
        withCredentials(jackUser, t -> queryExecutor.organization(OBJECT_FIELDS, organizationUuid));
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment1 = organization.getAttachments().stream()
        .filter(a -> superuserAttachment1.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment1.getFileName())
        .isEqualTo(superuserAttachment1.getFileName());

    // S - update attachment as admin
    superuserAttachment2.setFileName("adminUpdatedAttachment.jpg");
    succeedAttachmentUpdate(adminUser, getInput(superuserAttachment2, AttachmentInput.class));
    organization =
        withCredentials(jackUser, t -> queryExecutor.organization(OBJECT_FIELDS, organizationUuid));
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment2 = organization.getAttachments().stream()
        .filter(a -> superuserAttachment2.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment2.getFileName())
        .isEqualTo(superuserAttachment2.getFileName());
  }

  private void testDeleteOrganizationAttachments(final String organizationUuid,
      final int nrOfAttachments, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2, final Attachment adminAttachment) {
    // F - delete attachment as normal user
    failAttachmentDelete("erin", superuserAttachment1.getUuid());

    // F - delete attachment as superuser of different organization
    failAttachmentDelete("henry", superuserAttachment1.getUuid());

    // F - delete attachment as different superuser
    failAttachmentDelete("jacob", superuserAttachment1.getUuid());

    // S - delete attachment as superuser
    succeedAttachmentDelete("rebecca", superuserAttachment1.getUuid());
    Organization organization =
        withCredentials(jackUser, t -> queryExecutor.organization(OBJECT_FIELDS, organizationUuid));
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments - 1);

    // S - delete superuser attachment as admin
    succeedAttachmentDelete(adminUser, superuserAttachment2.getUuid());
    organization =
        withCredentials(jackUser, t -> queryExecutor.organization(OBJECT_FIELDS, organizationUuid));
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments - 2);

    // S - delete admin attachment as admin
    succeedAttachmentDelete(adminUser, adminAttachment.getUuid());
    organization =
        withCredentials(jackUser, t -> queryExecutor.organization(OBJECT_FIELDS, organizationUuid));
    assertThat(organization.getAttachments()).hasSize(nrOfAttachments - 3);
  }

  @Test
  void testReportAttachment() {
    // Create test report
    final ReportInput testReportInput = ReportInput.builder().withState(ReportState.DRAFT)
        .withIntent("a test report created by testReportAttachment")
        .withReportPeople(getReportPeopleInput(List.of(personToReportAuthor(getJackJackson()))))
        .build();
    final Report testReport = withCredentials(jackUser,
        t -> mutationExecutor.createReport(OBJECT_FIELDS, testReportInput));
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();
    final int nrOfAttachments = testReport.getAttachments().size();

    // Add attachment to test report
    final AttachmentInput testAttachmentInput =
        buildAttachment(ReportDao.TABLE_NAME, testReport.getUuid());

    // Test attachment create
    final CreateReportAttachmentsResult result = testCreateReportAttachment(testAttachmentInput);

    // Check the report
    final Report report =
        withCredentials(jackUser, t -> queryExecutor.report(OBJECT_FIELDS, testReport.getUuid()));
    assertThat(report.getAttachments()).hasSize(nrOfAttachments + 2);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment authorAttachment = report.getAttachments().stream()
        .filter(a -> result.authorAttachmentUuid().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.authorAttachmentUuid(), testAttachmentInput, authorAttachment);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment adminAttachment = report.getAttachments().stream()
        .filter(a -> result.adminAttachmentUuid().equals(a.getUuid())).findAny().get();
    assertAttachmentDetails(result.adminAttachmentUuid(), testAttachmentInput, adminAttachment);

    // Test attachment update
    testUpdateReportAttachment(report.getUuid(), report.getAttachments().size(), authorAttachment,
        adminAttachment);

    // Test attachment delete
    testDeleteReportAttachment(report.getUuid(), report.getAttachments().size(), authorAttachment,
        adminAttachment);

    // Finally, delete the report
    withCredentials(jackUser, t -> mutationExecutor.deleteReport("", report.getUuid()));
  }

  private CreateReportAttachmentsResult testCreateReportAttachment(
      final AttachmentInput testAttachmentInput) {
    // F - create attachment as non-author
    failAttachmentCreate("erin", testAttachmentInput);

    // S - create attachment as admin
    final String adminAttachmentUuid = succeedAttachmentCreate(adminUser, testAttachmentInput);

    // S - create attachment as author
    final String authorAttachmentUuid = succeedAttachmentCreate(jackUser, testAttachmentInput);

    return new CreateReportAttachmentsResult(authorAttachmentUuid, adminAttachmentUuid);
  }

  private record CreateReportAttachmentsResult(String authorAttachmentUuid,
      String adminAttachmentUuid) {
  }

  private void testUpdateReportAttachment(final String reportUuid, final int nrOfAttachments,
      final Attachment authorAttachment, final Attachment adminAttachment) {
    // F - update attachment as non-author
    authorAttachment.setFileName("erinUpdatedAttachment.jpg");
    failAttachmentUpdate("erin", getInput(authorAttachment, AttachmentInput.class));

    // S - update attachment as admin
    authorAttachment.setFileName("adminUpdatedAttachment.jpg");
    succeedAttachmentUpdate(adminUser, getInput(adminAttachment, AttachmentInput.class));
    Report report =
        withCredentials(adminUser, t -> queryExecutor.report(OBJECT_FIELDS, reportUuid));
    assertThat(report.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedAdminAttachment = report.getAttachments().stream()
        .filter(a -> adminAttachment.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedAdminAttachment.getFileName()).isEqualTo(adminAttachment.getFileName());

    // S - update attachment as author
    authorAttachment.setFileName("jackUpdatedAttachment.jpg");
    succeedAttachmentUpdate(jackUser, getInput(authorAttachment, AttachmentInput.class));
    report = withCredentials(jackUser, t -> queryExecutor.report(OBJECT_FIELDS, reportUuid));
    assertThat(report.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedAuthorAttachment = report.getAttachments().stream()
        .filter(a -> authorAttachment.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedAuthorAttachment.getFileName()).isEqualTo(authorAttachment.getFileName());
  }

  private void testDeleteReportAttachment(final String reportUuid, final int nrOfAttachments,
      final Attachment authorAttachment, final Attachment adminAttachment) {
    // F - delete attachment as non-author
    failAttachmentDelete("erin", authorAttachment.getUuid());

    // S - delete attachment as admin
    succeedAttachmentDelete(adminUser, adminAttachment.getUuid());
    Report report = withCredentials(jackUser, t -> queryExecutor.report(OBJECT_FIELDS, reportUuid));
    assertThat(report.getAttachments()).hasSize(nrOfAttachments - 1);

    // S - delete attachment as author
    succeedAttachmentDelete(jackUser, authorAttachment.getUuid());
    report = withCredentials(jackUser, t -> queryExecutor.report(OBJECT_FIELDS, reportUuid));
    assertThat(report.getAttachments()).hasSize(nrOfAttachments - 2);
  }

  @Test
  void testPersonAttachments() {
    // Get test person
    final Person testPerson = withCredentials(adminUser,
        t -> queryExecutor.person(OBJECT_FIELDS, "df9c7381-56ac-4bc5-8e24-ec524bccd7e9"));
    assertThat(testPerson).isNotNull();
    assertThat(testPerson.getUuid()).isNotNull();
    final int nrOfAttachments = testPerson.getAttachments().size();

    // Add attachment to test person
    final AttachmentInput testAttachmentInput =
        buildAttachment(PersonDao.TABLE_NAME, testPerson.getUuid());

    // Test attachment create
    final CreatePersonAttachmentsResult result = testCreatePersonAttachments(testAttachmentInput);

    // Check the person
    final Person person =
        withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, testPerson.getUuid()));
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
      AttachmentInput testAttachmentInput) {
    // S - create attachment as normal user
    final String userAttachmentUuid = succeedAttachmentCreate("erin", testAttachmentInput);

    // F - create attachment as superuser of different person
    failAttachmentCreate("henry", testAttachmentInput);

    // S - create attachment as superuser
    final String superuserAttachmentUuid1 = succeedAttachmentCreate("rebecca", testAttachmentInput);
    final String superuserAttachmentUuid2 = succeedAttachmentCreate("rebecca", testAttachmentInput);

    // S - create attachment as admin
    final String adminAttachmentUuid = succeedAttachmentCreate(adminUser, testAttachmentInput);

    return new CreatePersonAttachmentsResult(userAttachmentUuid, superuserAttachmentUuid1,
        superuserAttachmentUuid2, adminAttachmentUuid);
  }

  private record CreatePersonAttachmentsResult(String userAttachmentUuid,
      String superuserAttachmentUuid1, String superuserAttachmentUuid2,
      String adminAttachmentUuid) {
  }

  private void testUpdatePersonAttachments(final String personUuid, final int nrOfAttachments,
      final Attachment userAttachment, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2) {
    // S - update attachment as normal user
    userAttachment.setFileName("erinUpdatedAttachment.jpg");
    succeedAttachmentUpdate("erin", getInput(userAttachment, AttachmentInput.class));
    Person person = withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, personUuid));
    assertThat(person.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedUserAttachment = person.getAttachments().stream()
        .filter(a -> userAttachment.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedUserAttachment.getFileName()).isEqualTo(userAttachment.getFileName());

    // F - update attachment as superuser of different person
    superuserAttachment1.setFileName("henryUpdatedAttachment.jpg");
    failAttachmentUpdate("henry", getInput(superuserAttachment1, AttachmentInput.class));

    // F - update attachment as different superuser
    superuserAttachment1.setFileName("jacobUpdatedAttachment.jpg");
    failAttachmentUpdate("jacob", getInput(superuserAttachment1, AttachmentInput.class));

    // S - update attachment as superuser
    superuserAttachment1.setFileName("rebeccaUpdatedAttachment.jpg");
    succeedAttachmentUpdate("rebecca", getInput(superuserAttachment1, AttachmentInput.class));
    person = withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, personUuid));
    assertThat(person.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment1 = person.getAttachments().stream()
        .filter(a -> superuserAttachment1.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment1.getFileName())
        .isEqualTo(superuserAttachment1.getFileName());

    // S - update attachment as admin
    superuserAttachment2.setFileName("adminUpdatedAttachment.jpg");
    succeedAttachmentUpdate(adminUser, getInput(superuserAttachment2, AttachmentInput.class));
    person = withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, personUuid));
    assertThat(person.getAttachments()).hasSize(nrOfAttachments);
    @SuppressWarnings("OptionalGetWithoutIsPresent")
    final Attachment updatedSuperuserAttachment2 = person.getAttachments().stream()
        .filter(a -> superuserAttachment2.getUuid().equals(a.getUuid())).findAny().get();
    assertThat(updatedSuperuserAttachment2.getFileName())
        .isEqualTo(superuserAttachment2.getFileName());
  }

  private void testDeletePersonAttachments(final String personUuid, final int nrOfAttachments,
      final Attachment userAttachment, final Attachment superuserAttachment1,
      final Attachment superuserAttachment2, final Attachment adminAttachment) {
    // S - delete attachment as normal user
    succeedAttachmentDelete("erin", userAttachment.getUuid());
    Person person = withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, personUuid));
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 1);

    // F - delete attachment as superuser of different person
    failAttachmentDelete("henry", superuserAttachment1.getUuid());

    // F - delete attachment as different superuser
    failAttachmentDelete("jacob", superuserAttachment1.getUuid());

    // S - delete attachment as superuser
    succeedAttachmentDelete("rebecca", superuserAttachment1.getUuid());
    person = withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, personUuid));
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 2);

    // S - delete superuser attachment as admin
    succeedAttachmentDelete(adminUser, superuserAttachment2.getUuid());
    person = withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, personUuid));
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 3);

    // S - delete ADMIN attachment as admin
    succeedAttachmentDelete(adminUser, adminAttachment.getUuid());
    person = withCredentials(jackUser, t -> queryExecutor.person(OBJECT_FIELDS, personUuid));
    assertThat(person.getAttachments()).hasSize(nrOfAttachments - 4);
  }

  private GenericRelatedObjectInput createAttachmentRelatedObject(final String tableName,
      final String uuid) {
    return GenericRelatedObjectInput.builder().withRelatedObjectType(tableName)
        .withRelatedObjectUuid(uuid).build();
  }

  private String succeedAttachmentCreate(final String username,
      final AttachmentInput attachmentInput) {
    final String createdAttachmentUuid =
        withCredentials(username, t -> mutationExecutor.createAttachment("", attachmentInput));
    assertThat(createdAttachmentUuid).isNotNull();
    return createdAttachmentUuid;
  }

  private void failAttachmentCreate(final String username, final AttachmentInput attachmentInput) {
    try {
      withCredentials(username, t -> mutationExecutor.createAttachment("", attachmentInput));
      fail("Expected exception creating attachment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void succeedAttachmentDelete(final String username, final String attachmentUuid) {
    final Integer nrDeleted =
        withCredentials(username, t -> mutationExecutor.deleteAttachment("", attachmentUuid));
    assertThat(nrDeleted).isOne();
  }

  private void failAttachmentDelete(final String username, final String attachmentUuid) {
    try {
      withCredentials(username, t -> mutationExecutor.deleteAttachment("", attachmentUuid));
      fail("Expected exception deleting attachment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void succeedAttachmentUpdate(final String username,
      final AttachmentInput attachmentInput) {
    final String updatedAttachmentUuid =
        withCredentials(username, t -> mutationExecutor.updateAttachment("", attachmentInput));
    assertThat(updatedAttachmentUuid).isNotNull();
  }

  private void failAttachmentUpdate(final String username, final AttachmentInput attachmentInput) {
    try {
      withCredentials(username, t -> mutationExecutor.updateAttachment("", attachmentInput));
      fail("Expected exception updating attachment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  @Test
  void myAttachments() {
    final Person jack = getJackJackson();
    final AnetBeanList_Attachment jackAttachments =
        getAttachments(jack.getDomainUsername(), jack.getUuid());

    assertThat(jackAttachments.getList()).isNotEmpty();
    assertThat(jackAttachments.getList().stream()
        .filter(p -> (p.getAuthor().getUuid().equals(jack.getUuid()))).collect(Collectors.toList()))
        .hasSameElementsAs(jackAttachments.getList());
  }

  protected AnetBeanList_Attachment getAttachments(final String username, final String authorUuid) {
    final AttachmentSearchQueryInput ssqi =
        AttachmentSearchQueryInput.builder().withPageSize(0).withAuthorUuid(authorUuid).build();
    return withCredentials(username,
        t -> queryExecutor.attachmentList(getListFields(ATTACHMENT_FIELDS), ssqi));
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
}
