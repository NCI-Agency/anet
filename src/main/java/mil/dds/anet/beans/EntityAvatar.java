package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class EntityAvatar {
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
