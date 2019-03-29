package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;
import mil.dds.anet.views.AbstractAnetBean;

public class ReportSensitiveInformation extends AbstractAnetBean {

  private String text;

  @GraphQLQuery(name = "text")
  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = text;
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
      return false;
    }
    final ReportSensitiveInformation rsi = (ReportSensitiveInformation) o;
    return Objects.equals(rsi.getUuid(), uuid) && Objects.equals(rsi.getText(), text);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, text);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s]", uuid);
  }

}
