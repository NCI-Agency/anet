package mil.dds.anet.views;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.lang.invoke.MethodHandles;
import java.util.Objects;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class AbstractCustomizableAnetBean extends AbstractAnetBean {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @GraphQLQuery
  @GraphQLInputField
  private String customFields;

  public String getCustomFields() {
    return customFields;
  }

  public void setCustomFields(String customFields) {
    this.customFields = Utils.trimStringReturnNull(customFields);
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
