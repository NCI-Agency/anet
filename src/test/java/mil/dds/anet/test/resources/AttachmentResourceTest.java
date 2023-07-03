package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.graphql_java_generator.exception.GraphQLRequestExecutionException;
import com.graphql_java_generator.exception.GraphQLRequestPreparationException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.test.client.Attachment;
import mil.dds.anet.test.client.AttachmentInput;
import mil.dds.anet.test.client.AttachmentRelatedObjectInput;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.util.MutationExecutor;
import org.junit.jupiter.api.Test;

public class AttachmentResourceTest extends AbstractResourceTest {

  protected static final String ATTACHMENT_FIELDS =
      "{ uuid mimeType fileName description classification author"
          + " attachmentRelatedObjects { attachmentUuid relatedObjectType relatedObjectUuid } }";
  private static final String _ATTACHMENTS_FIELDS =
      String.format("attachments %1$s", ATTACHMENT_FIELDS);
  private static final String REPORT_FIELDS =
      String.format("{ uuid intent state reportPeople { uuid name author attendee primary }"
          + " tasks { uuid shortName } %1$s }", _ATTACHMENTS_FIELDS);

  @Test
  public void testCreateAttachment()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final Map<String, Object> attachmentSettings = (Map<String, Object>) AnetObjectEngine
        .getConfiguration().getDictionaryEntry("fields.attachment");
    final Boolean attachmentDisabled = (Boolean) attachmentSettings.get("featureDisabled");


    final ReportInput testReportInput =
        ReportInput.builder().withIntent("a test report created by testCreateAttachment")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = adminMutationExecutor.createReport(REPORT_FIELDS, testReportInput);
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    // Attach attachment to test report
    final AttachmentRelatedObjectInput testAroInput =
        createAttachmentRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());

    final AttachmentInput failedAttachmentInput =
        AttachmentInput.builder().withFileName("testAttachment.jpg")
            .withDescription("a test attachment created by testCreateAttachment")
            .withAttachmentRelatedObjects(Collections.singletonList(testAroInput)).build();

    // Fail attachment create with a mimetype that is not allowed
    failAttachmentCreate(adminMutationExecutor, failedAttachmentInput);

    final var allowedMimeTypes = (List<String>) attachmentSettings.get("mimeTypes");
    final Boolean userUploadDisabled = (Boolean) attachmentSettings.get("disabled");
    final String mimeType = allowedMimeTypes.get(0);
    failedAttachmentInput.setMimeType(mimeType);

    // Fail attachment create with wrong classification
    failedAttachmentInput.setClassification("NATO_UNCLASSIFIED");
    failAttachmentCreate(adminMutationExecutor, failedAttachmentInput);

    if (userUploadDisabled) {
      // Fail attachment create with any user other than admin
      final MutationExecutor erinMutationExecutor =
          getMutationExecutor(getRegularUser().getDomainUsername());
      failAttachmentCreate(erinMutationExecutor, failedAttachmentInput);
    }

    // Succeed attachment create with right classification and mimetype
    final AttachmentInput testAttachmentInput =
        AttachmentInput.builder().withFileName("testCreateAttachment.jpg").withMimeType(mimeType)
            .withDescription("a test attachment created by testCreateAttachment")
            .withAttachmentRelatedObjects(Collections.singletonList(testAroInput)).build();
    final String createdAttachmentUuid =
        succeedAttachmentCreate(adminMutationExecutor, testAttachmentInput);
    assertThat(createdAttachmentUuid).isNotNull();

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getAttachments()).hasSize(1);
    final Attachment reportAttachment = updatedReport.getAttachments().get(0);
    assertThat(reportAttachment.getAttachmentRelatedObjects()).hasSize(1);
    assertThat(reportAttachment.getDescription()).isEqualTo(testAttachmentInput.getDescription());
    assertThat(reportAttachment.getClassification())
        .isEqualTo(testAttachmentInput.getClassification());
    assertThat(reportAttachment.getFileName()).isEqualTo(testAttachmentInput.getFileName());

  }

  @Test
  public void testDeleteAttachment()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final Map<String, Object> attachmentSettings = (Map<String, Object>) AnetObjectEngine
        .getConfiguration().getDictionaryEntry("fields.attachment");
    final Boolean attachmentDisabled = (Boolean) attachmentSettings.get("featureDisabled");


    // create test report
    final ReportInput testReportInput =
        ReportInput.builder().withIntent("a test report created by testDeleteAttachment")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = adminMutationExecutor.createReport(REPORT_FIELDS, testReportInput);
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    // Attach attachment to test report
    final var allowedMimeTypes = (List<String>) attachmentSettings.get("mimeTypes");
    final String mimeType = allowedMimeTypes.get(0);

    final AttachmentRelatedObjectInput testAroInput =
        createAttachmentRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final AttachmentInput testAttachmentInput =
        AttachmentInput.builder().withFileName("testDeleteAttachment.jpg").withMimeType(mimeType)
            .withDescription("a test attachment created by testDeleteAttachment")
            .withAttachmentRelatedObjects(Collections.singletonList(testAroInput)).build();
    final String createdAttachmentUuid =
        succeedAttachmentCreate(adminMutationExecutor, testAttachmentInput);
    assertThat(createdAttachmentUuid).isNotNull();

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getAttachments()).hasSize(1);
    final Attachment reportAttachment = updatedReport.getAttachments().get(0);
    assertThat(reportAttachment.getAttachmentRelatedObjects()).hasSize(1);
    assertThat(reportAttachment.getDescription()).isEqualTo(testAttachmentInput.getDescription());
    assertThat(reportAttachment.getClassification())
        .isEqualTo(testAttachmentInput.getClassification());
    assertThat(reportAttachment.getFileName()).isEqualTo(testAttachmentInput.getFileName());

    // F - delete attachment classification as someone else
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    failAttachmentDelete(erinMutationExecutor, reportAttachment.getUuid());

    // Delete attachment
    succeedAttachmentDelete(adminMutationExecutor, reportAttachment.getUuid());
    final Report deletedAttachmentReport =
        adminQueryExecutor.report(REPORT_FIELDS, updatedReport.getUuid());
    assertThat(deletedAttachmentReport.getAttachments()).isEmpty();

  }

  @Test
  public void testUpdateAttachment()
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final Map<String, Object> attachmentSettings = (Map<String, Object>) AnetObjectEngine
        .getConfiguration().getDictionaryEntry("fields.attachment");
    final Boolean attachmentDisabled = (Boolean) attachmentSettings.get("featureDisabled");

    // create test report
    final ReportInput testReportInput =
        ReportInput.builder().withIntent("a test report created by testUpdateAttachment")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = adminMutationExecutor.createReport(REPORT_FIELDS, testReportInput);
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    // Attach attachment to test report
    final var allowedMimeTypes = (List<String>) attachmentSettings.get("mimeTypes");
    final String mimeType = allowedMimeTypes.get(0);
    final Map<String, String> allowedClassifications = (Map<String, String>) AnetObjectEngine
        .getConfiguration().getDictionaryEntry("fields.attachment.classification.choices");
    final Map.Entry<String, String> entry = allowedClassifications.entrySet().iterator().next();
    final String classification = entry.getKey();

    final AttachmentRelatedObjectInput testAroInput =
        createAttachmentRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final AttachmentInput testAttachmentInput =
        AttachmentInput.builder().withFileName("testUpdateAttachment.jpg").withMimeType(mimeType)
            .withDescription("a test attachment created by testUpdateAttachment")
            .withAttachmentRelatedObjects(Collections.singletonList(testAroInput)).build();
    final String createdAttachmentUuid =
        succeedAttachmentCreate(adminMutationExecutor, testAttachmentInput);
    assertThat(createdAttachmentUuid).isNotNull();

    final Report updatedReport = adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedReport.getAttachments()).hasSize(1);
    final Attachment reportAttachment = updatedReport.getAttachments().get(0);

    // F - update with a classification that is not allowed
    reportAttachment.setClassification("test_classification");
    failAttachmentUpdate(adminMutationExecutor, getInput(reportAttachment, AttachmentInput.class));

    // F - update attachment classification as someone else
    reportAttachment.setClassification(classification);
    final MutationExecutor erinMutationExecutor =
        getMutationExecutor(getRegularUser().getDomainUsername());
    failAttachmentUpdate(erinMutationExecutor, getInput(reportAttachment, AttachmentInput.class));

    // F - update attachment as someone else
    reportAttachment.setFileName("updatedAttachment.jpg");
    failAttachmentUpdate(erinMutationExecutor, getInput(reportAttachment, AttachmentInput.class));

    // S - update attachment as author or admin
    succeedAttachmentUpdate(adminMutationExecutor,
        getInput(reportAttachment, AttachmentInput.class));
    final Attachment updatedAttachment = updatedReport.getAttachments().get(0);
    assertThat(updatedAttachment.getClassification())
        .isEqualTo(reportAttachment.getClassification());

    final Report updatedClassificationReport =
        adminQueryExecutor.report(REPORT_FIELDS, testReport.getUuid());
    assertThat(updatedClassificationReport.getAttachments()).hasSize(1);
    final Attachment updatedClassificationAttachment =
        updatedClassificationReport.getAttachments().get(0);
    updatedClassificationAttachment.setFileName("updatedTestAttachmentName");

    succeedAttachmentUpdate(adminMutationExecutor,
        getInput(updatedClassificationAttachment, AttachmentInput.class));
    final Attachment updatedFilenameAttachment =
        updatedClassificationReport.getAttachments().get(0);
    assertThat(updatedFilenameAttachment.getFileName())
        .isEqualTo(updatedClassificationAttachment.getFileName());

  }

  private AttachmentRelatedObjectInput createAttachmentRelatedObject(final String tableName,
      final String uuid) {
    return AttachmentRelatedObjectInput.builder().withRelatedObjectType(tableName)
        .withRelatedObjectUuid(uuid).build();
  }

  private String succeedAttachmentCreate(final MutationExecutor mutationExecutor,
      final AttachmentInput attachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final String createdAttachmentUuid =
        mutationExecutor.createAttachment(attachmentInput.getUuid(), attachmentInput);
    assertThat(createdAttachmentUuid).isNotNull();
    return createdAttachmentUuid;
  }

  private void failAttachmentCreate(final MutationExecutor mutationExecutor,
      final AttachmentInput attachmentInput) {
    try {
      mutationExecutor.createAttachment(attachmentInput.getUuid(), attachmentInput);
      fail("Expected exception creating attachment");
    } catch (Exception expected) {
      // OK
    }
  }

  private Integer succeedAttachmentDelete(final MutationExecutor mutationExecutor,
      final String attachmentUuid)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final Integer nrDeleted = mutationExecutor.deleteAttachment("", attachmentUuid);
    assertThat(nrDeleted).isOne();
    return nrDeleted;
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

  private String succeedAttachmentUpdate(final MutationExecutor mutationExecutor,
      final AttachmentInput attachmentInput)
      throws GraphQLRequestPreparationException, GraphQLRequestExecutionException {
    final String updatedAttachmentUuid = mutationExecutor.updateAttachment("", attachmentInput);
    assertThat(updatedAttachmentUuid).isNotNull();
    return updatedAttachmentUuid;
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

}
