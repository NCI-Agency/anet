package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import jakarta.ws.rs.WebApplicationException;
import java.time.Instant;
import mil.dds.anet.views.AbstractAnetBean;

public class EntityAvatar extends AbstractAnetBean {
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectType;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectUuid;
  @GraphQLQuery
  @GraphQLInputField
  private boolean applyCrop;
  @GraphQLQuery
  @GraphQLInputField
  private String attachmentUuid;
  @GraphQLQuery
  @GraphQLInputField
  private Integer cropLeft;
  @GraphQLQuery
  @GraphQLInputField
  private Integer cropTop;
  @GraphQLQuery
  @GraphQLInputField
  private Integer cropWidth;
  @GraphQLQuery
  @GraphQLInputField
  private Integer cropHeight;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    return getRelatedObjectUuid();
  }

  @Override
  public void setUuid(String uuid) {
    setRelatedObjectUuid(uuid);
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getCreatedAt() {
    throw new WebApplicationException("no createdAt field on EntityAvatar");
  }

  @Override
  public void setCreatedAt(Instant createdAt) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getUpdatedAt() {
    throw new WebApplicationException("no updatedAt field on EntityAvatar");
  }

  @Override
  public void setUpdatedAt(Instant updatedAt) {
    // just ignore
  }

  public String getRelatedObjectType() {
    return relatedObjectType;
  }

  public void setRelatedObjectType(String relatedObjectType) {
    this.relatedObjectType = relatedObjectType;
  }

  public String getRelatedObjectUuid() {
    return relatedObjectUuid;
  }

  public void setRelatedObjectUuid(String relatedObjectUuid) {
    this.relatedObjectUuid = relatedObjectUuid;
  }

  public String getAttachmentUuid() {
    return attachmentUuid;
  }

  public void setAttachmentUuid(final String attachmentUuid) {
    this.attachmentUuid = attachmentUuid;
  }

  public boolean isApplyCrop() {
    return applyCrop;
  }

  public void setApplyCrop(boolean applyCrop) {
    this.applyCrop = applyCrop;
  }

  public Integer getCropLeft() {
    return cropLeft;
  }

  public void setCropLeft(Integer cropLeft) {
    this.cropLeft = cropLeft;
  }

  public Integer getCropTop() {
    return cropTop;
  }

  public void setCropTop(Integer cropTop) {
    this.cropTop = cropTop;
  }

  public Integer getCropWidth() {
    return cropWidth;
  }

  public void setCropWidth(Integer cropWidth) {
    this.cropWidth = cropWidth;
  }

  public Integer getCropHeight() {
    return cropHeight;
  }

  public void setCropHeight(Integer cropHeight) {
    this.cropHeight = cropHeight;
  }
}
