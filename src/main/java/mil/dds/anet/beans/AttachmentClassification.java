package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.views.AbstractAnetBean;

public class AttachmentClassification extends AbstractAnetBean {

  public static enum Classification {
    COSMIC_TOP_SECRET, NATO_SECRET, NATO_CONFIDENTIAL, NATO_RESTRICTED, COSMIC_TOP_SECRET_ATOMAL,
    NATO_SECRET_ATOMAL, NATO_CONFIDENTIAL_ATOMAL, NATO_UNCLASSIFIED
  }

  public Classification getClassification() {
    return classification;
  }

  public void setClassification(Classification classification) {
    this.classification = classification;
  }

  @GraphQLQuery
  // @GraphQLInputField
  private Classification classification;

  @Override
  public String toString() {
    return String.format("[uuid:%s classification:%s]", uuid, classification);
  }
}
