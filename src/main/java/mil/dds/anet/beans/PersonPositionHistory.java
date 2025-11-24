package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * used to represent a person in a position at a particular time. Populated from results of the
 * peoplePositions table.
 *
 * @author hpitelka
 */
public class PersonPositionHistory extends AbstractAnetBean {

  // annotated below
  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Position> position = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  Instant startTime;
  @GraphQLQuery
  @GraphQLInputField
  Instant endTime;
  @GraphQLQuery
  @GraphQLInputField
  Boolean primary;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "no UUID field on PersonPositionHistory");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
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

  @GraphQLQuery(name = "position")
  public CompletableFuture<Position> loadPosition(@GraphQLRootContext GraphQLContext context) {
    if (position.hasForeignObject()) {
      return CompletableFuture.completedFuture(position.getForeignObject());
    }
    return new UuidFetcher<Position>()
        .load(context, IdDataLoaderKey.POSITIONS, position.getForeignUuid()).thenApply(o -> {
          position.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setPositionUuid(String positionUuid) {
    this.position = new ForeignObjectHolder<>(positionUuid);
  }

  @JsonIgnore
  public String getPositionUuid() {
    return position.getForeignUuid();
  }

  @GraphQLInputField(name = "position")
  public void setPosition(Position position) {
    this.position = new ForeignObjectHolder<>(position);
  }

  public Position getPosition() {
    return position.getForeignObject();
  }

  public Instant getStartTime() {
    return startTime;
  }

  public void setStartTime(Instant startTime) {
    this.startTime = startTime;
  }

  public Instant getEndTime() {
    return endTime;
  }

  public void setEndTime(Instant endTime) {
    this.endTime = endTime;
  }

  public Boolean getPrimary() {
    return primary;
  }

  public void setPrimary(Boolean primary) {
    this.primary = primary;
  }
}
