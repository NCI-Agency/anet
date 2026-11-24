package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.util.List;
import java.util.Map;
import mil.dds.anet.resources.AttachmentResource;
import mil.dds.anet.test.AnetApplicationTest;
import mil.dds.anet.test.client.Attachment;
import mil.dds.anet.test.client.AttachmentInput;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class RestrictedAttachmentsTest extends AnetApplicationTest {
  private static final String RESTRICT_TO_ADMINS = "restrictToAdmins";

  private Object restrictToAdmins;

  @BeforeEach
  void setUp() {
    // Set restrictToAdmins to true in dictionary
    final Map<String, Object> attachmentSettings = AttachmentResource.getAttachmentSettings();
    restrictToAdmins = attachmentSettings.get(RESTRICT_TO_ADMINS);
    attachmentSettings.put(RESTRICT_TO_ADMINS, true);
  }

  @AfterEach
  void tearDown() {
    // Restore value of restrictToAdmins in dictionary
    final Map<String, Object> attachmentSettings = AttachmentResource.getAttachmentSettings();
    attachmentSettings.put(RESTRICT_TO_ADMINS, restrictToAdmins);
  }

  @Test
  void testRestrictToAdmins() {
    final AttachmentInput testAttachmentInput = AttachmentInput.builder()
        .withFileName("testAttachment.jpg").withMimeType(getFirstMimeType())
        .withDescription("a test attachment created by testCreateAttachment")
        .withAttachmentRelatedObjects(List.of()).build();
    // Fail attachment create with any user other than admin
    failAttachmentCreate(jackUser, testAttachmentInput);
    // Succeed attachment create as admin
    succeedAttachmentCreate(adminUser, testAttachmentInput);
  }

  private Attachment succeedAttachmentCreate(final String username,
      final AttachmentInput attachmentInput) {
    final String createdAttachmentUuid =
        withCredentials(username, t -> mutationExecutor.createAttachment("", attachmentInput));
    assertThat(createdAttachmentUuid).isNotNull();
    return withCredentials(username, t -> queryExecutor
        .attachment(AttachmentResourceTest.ATTACHMENT_FIELDS, createdAttachmentUuid));
  }

  private void failAttachmentCreate(final String username, final AttachmentInput attachmentInput) {
    assertThatCode(() -> withCredentials(username,
        t -> mutationExecutor.createAttachment("", attachmentInput)))
        .withFailMessage("Expected exception creating attachment").isInstanceOf(Exception.class);
  }
}
