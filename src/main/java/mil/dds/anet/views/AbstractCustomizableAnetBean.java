package mil.dds.anet.views;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.lang.invoke.MethodHandles;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class AbstractCustomizableAnetBean extends AbstractAnetBean {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @GraphQLQuery
  @GraphQLInputField
  protected String customFields;

  public String getCustomFields() {
    return customFields;
  }

  public void setCustomFields(String customFields) {
    this.customFields = Utils.trimStringReturnNull(customFields);
  }

  public void checkAndFixCustomFields() {
    try {
      setCustomFields(Utils.sanitizeJSON(getCustomFields()));
    } catch (JsonProcessingException e) {
      setCustomFields(null);
      logger.error("Unable to process Json, CustomFields payload discarded", e);
    }

  }

}
