package mil.dds.anet.views;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Attachment;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.Note;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class AbstractCustomizableAnetBean extends AbstractAnetBean {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @GraphQLQuery
  @GraphQLInputField
  private String customFields;
  // annotated below
  private List<Note> notes;
  // annotated below
  private List<CustomSensitiveInformation> customSensitiveInformation;
  // annotated below
  private Boolean isSubscribed;
  // annotated below
  private List<Attachment> attachments;

  public String getCustomFields() {
    return customFields;
  }

  public void setCustomFields(String customFields) {
    this.customFields = Utils.trimStringReturnNull(customFields);
  }

  @GraphQLQuery(name = "notes")
  public CompletableFuture<List<Note>> loadNotes(@GraphQLRootContext Map<String, Object> context) {
    if (notes != null) {
      return CompletableFuture.completedFuture(notes);
    }
    return AnetObjectEngine.getInstance().getNoteDao().getNotesForRelatedObject(context, uuid)
        .thenApply(o -> {
          notes = o;
          return o;
        });
  }

  @GraphQLQuery(name = "attachments")
  public CompletableFuture<List<Attachment>> loadAttachments(
      @GraphQLRootContext Map<String, Object> context) {
    if (attachments != null) {
      return CompletableFuture.completedFuture(attachments);
    }
    return AnetObjectEngine.getInstance().getAttachmentDao()
        .getAttachmentsForRelatedObject(context, uuid).thenApply(o -> {
          attachments = o;
          return o;
        });
  }

  @GraphQLQuery(name = "customSensitiveInformation")
  public CompletableFuture<List<CustomSensitiveInformation>> loadCustomSensitiveInformation(
      @GraphQLRootContext Map<String, Object> context) {
    if (customSensitiveInformation != null) {
      return CompletableFuture.completedFuture(customSensitiveInformation);
    }
    return AnetObjectEngine.getInstance().getCustomSensitiveInformationDao()
        .getCustomSensitiveInformationForRelatedObject(context, uuid).thenApply(o -> {
          customSensitiveInformation = o;
          return o;
        });
  }

  public List<CustomSensitiveInformation> getCustomSensitiveInformation() {
    return customSensitiveInformation;
  }

  @GraphQLInputField(name = "customSensitiveInformation")
  public void setCustomSensitiveInformation(
      List<CustomSensitiveInformation> customSensitiveInformation) {
    this.customSensitiveInformation = customSensitiveInformation;
  }

  @GraphQLQuery(name = "isSubscribed")
  public synchronized Boolean isSubscribed(@GraphQLRootContext Map<String, Object> context) {
    if (isSubscribed == null) {
      isSubscribed =
          AnetObjectEngine.getInstance().getSubscriptionDao().isSubscribedObject(context, uuid);
    }
    return isSubscribed;
  }

  public void checkAndFixCustomFields() {
    try {
      setCustomFields(Utils.sanitizeJson(getCustomFields()));
    } catch (JsonProcessingException e) {
      setCustomFields(null);
      logger.error("Unable to process Json, customFields payload discarded", e);
    }
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof AbstractCustomizableAnetBean)) {
      return false;
    }
    final AbstractCustomizableAnetBean other = (AbstractCustomizableAnetBean) o;
    return Objects.equals(customFields, other.getCustomFields());
  }

  @Override
  public int hashCode() {
    return Objects.hash(customFields);
  }

}
