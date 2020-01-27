package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

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

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new WebApplicationException("no UUID field on PersonPositionHistory");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @GraphQLQuery(name = "person")
  public CompletableFuture<Person> loadPerson(@GraphQLRootContext Map<String, Object> context) {
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
  public CompletableFuture<Position> loadPosition(@GraphQLRootContext Map<String, Object> context) {
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

  public static List<PersonPositionHistory> getDerivedHistory(List<PersonPositionHistory> history) {
    // Remove all null entries
    return history.stream()
        .filter(
            pph -> (pph != null && pph.getPersonUuid() != null && pph.getPositionUuid() != null))
        .collect(Collectors.toList());
  }
}
