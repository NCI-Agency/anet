package mil.dds.anet.views;

import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.utils.Utils;

public abstract class AbstractCustomizableAnetBean extends AbstractAnetBean {

  protected String customFields;

  @GraphQLQuery(name = "customFields")
  public String getCustomFields() {
    return customFields;
  }

  public void setCustomFields(String customFields) {
    this.customFields = Utils.trimStringReturnNull(customFields);
  }
}
