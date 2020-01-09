package mil.dds.anet.views;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.utils.Utils;

public abstract class AbstractCustomizableAnetBean extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  protected String customFields;

  public String getCustomFields() {
    return customFields;
  }

  public void setCustomFields(String customFields) {
    this.customFields = Utils.trimStringReturnNull(customFields);
  }
}
