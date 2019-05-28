package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Avatar extends AbstractAnetBean {

  private String imageData;
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();

  @GraphQLQuery(name = "image")
  public String getImageData() {
    return imageData;
  }

  public void setImageData(String data) {
    this.imageData = data;
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext Map<String, Object> context) {
    if (person.hasForeignObject()) {
      return CompletableFuture.completedFuture(person.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, "people", person.getForeignUuid())
        .thenApply(o -> {
          person.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setPersonUuid(String personUuid) {
    this.person = new ForeignObjectHolder<>(personUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getPersonUuid() {
    return person.getForeignUuid();
  }

  public void setPerson(Person person) {
    this.person = new ForeignObjectHolder<>(person);
  }

  @GraphQLIgnore
  public Person getPerson() {
    return person.getForeignObject();
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
      return false;
    }
    final Note n = (Note) o;
    return Objects.equals(n.getUuid(), uuid) && Objects.equals(n.getAuthorUuid(), getPersonUuid())
        && Objects.equals(n.getText(), imageData);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, imageData);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, person:%s]", uuid, getPersonUuid());
  }

}
