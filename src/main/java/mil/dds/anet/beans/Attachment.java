package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import javax.sql.rowset.serial.SerialBlob;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Attachment extends AbstractAnetBean {

  public static enum Classification {
    UNDEFINED, NATO_UNCLASSIFIED, NATO_UNCLASSIFIED_Releasable_to_EU

  }

  @GraphQLQuery
  @GraphQLInputField
  private String mimeType;

  // can not be queried; needs to be streamed through contentBlob always
  @GraphQLInputField
  private byte[] content;
  // specifically for streaming the content
  private Blob contentBlob;

  @GraphQLQuery
  @GraphQLInputField
  private String fileName;

  @GraphQLQuery
  @GraphQLInputField
  private String description;

  // annotated below
  @GraphQLQuery
  @GraphQLInputField
  private Classification classification;

  // annotated below
  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();

  // annotated below
  private List<AttachmentRelatedObject> attachmentRelatedObjects;

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public byte[] getContent() {
    try {
      return contentBlob.getBytes(1L, (int) contentBlob.length());
    } catch (SQLException e) {
      throw new RuntimeException(e);
    }
  }

  public void setContent(byte[] content) {
    try {
      setContentBlob(new SerialBlob(content));
    } catch (final SQLException e) {
      throw new RuntimeException(e);
    }
  }

  public Blob getContentBlob() {
    return contentBlob;
  }

  public void setContentBlob(Blob contentBlob) {
    this.contentBlob = contentBlob;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public void setClassification(Classification classification) {
    this.classification = classification;
  }

  public Classification getClassification() {
    return classification;
  }

  @GraphQLQuery(name = "author")
  public CompletableFuture<Person> loadAuthor(@GraphQLRootContext Map<String, Object> context) {
    if (author.hasForeignObject()) {
      return CompletableFuture.completedFuture(author.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, author.getForeignUuid())
        .thenApply(o -> {
          author.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setAuthorUuid(String authorUuid) {
    this.author = new ForeignObjectHolder<>(authorUuid);
  }

  @JsonIgnore
  public String getAuthorUuid() {
    return author.getForeignUuid();
  }

  @GraphQLInputField(name = "author")
  public void setAuthor(Person author) {
    this.author = new ForeignObjectHolder<>(author);
  }

  public Person getAuthor() {
    return author.getForeignObject();
  }

  @GraphQLQuery(name = "attachmentRelatedObjects")
  public CompletableFuture<List<AttachmentRelatedObject>> loadAttachmentRelatedObjects(
      @GraphQLRootContext Map<String, Object> context) {
    if (attachmentRelatedObjects != null) {
      return CompletableFuture.completedFuture(attachmentRelatedObjects);
    }
    return AnetObjectEngine.getInstance().getAttachmentDao().getRelatedObjects(context, this)
        .thenApply(o -> {
          attachmentRelatedObjects = o;
          return o;
        });
  }

  public List<AttachmentRelatedObject> getAttachmentRelatedObjects() {
    return attachmentRelatedObjects;
  }

  @GraphQLInputField(name = "attachmentRelatedObjects")
  public void setAttachmentRelatedObjects(List<AttachmentRelatedObject> attachmentRelatedObjects) {
    this.attachmentRelatedObjects = attachmentRelatedObjects;
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, file name:%s, mime type:%s]", uuid, getFileName(),
        getMimeType());
  }

}
