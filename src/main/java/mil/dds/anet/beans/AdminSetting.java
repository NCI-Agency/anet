package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.views.AbstractAnetBean;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class AdminSetting extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  private String key;
  @GraphQLQuery
  @GraphQLInputField
  private String value;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "no UUID field on AdminSetting");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @AllowUnverifiedUsers
  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
  }

  @AllowUnverifiedUsers
  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

}
