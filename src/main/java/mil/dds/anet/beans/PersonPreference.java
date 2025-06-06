package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class PersonPreference extends AbstractAnetBean {

  // annotated below
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Preference> preference = new ForeignObjectHolder<>();

  @GraphQLQuery
  @GraphQLInputField
  private String value;

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext GraphQLContext context) {
    if (person.hasForeignObject()) {
      return CompletableFuture.completedFuture(person.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, person.getForeignUuid())
        .thenApply(o -> {
          person.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setPersonUuid(String personUuid) {
    this.person = new ForeignObjectHolder<>(personUuid);
  }

  @JsonIgnore
  public String getPersonUuid() {
    return person.getForeignUuid();
  }

  @GraphQLInputField(name = "person")
  public void setPerson(Person person) {
    this.person = new ForeignObjectHolder<>(person);
  }

  public Person getPerson() {
    return person.getForeignObject();
  }

  @GraphQLQuery(name = "preference")
  public CompletableFuture<Preference> loadPreference(@GraphQLRootContext GraphQLContext context) {
    if (preference.hasForeignObject()) {
      return CompletableFuture.completedFuture(preference.getForeignObject());
    }
    return new UuidFetcher<Preference>()
        .load(context, IdDataLoaderKey.PREFERENCES, preference.getForeignUuid()).thenApply(o -> {
          preference.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setPreferenceUuid(String preferenceUuid) {
    this.preference = new ForeignObjectHolder<>(preferenceUuid);
  }

  @JsonIgnore
  public String getPreferenceUuid() {
    return preference.getForeignUuid();
  }

  @GraphQLInputField(name = "preference")
  public void setPreference(Preference preference) {
    this.preference = new ForeignObjectHolder<>(preference);
  }

}
