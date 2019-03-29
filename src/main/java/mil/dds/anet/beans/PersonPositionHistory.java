package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

/**
 * used to represent a person in a position at a particular time. Populated from results of the
 * peoplePositions table.
 * 
 * @author hpitelka
 */
public class PersonPositionHistory extends AbstractAnetBean {

  private ForeignObjectHolder<Person> person = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Position> position = new ForeignObjectHolder<>();
  Instant startTime;
  Instant endTime;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new WebApplicationException("no UUID field on PersonPositionHistory");
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

  @GraphQLQuery(name = "position")
  public CompletableFuture<Position> loadPosition(@GraphQLRootContext Map<String, Object> context) {
    if (position.hasForeignObject()) {
      return CompletableFuture.completedFuture(position.getForeignObject());
    }
    return new UuidFetcher<Position>().load(context, "positions", position.getForeignUuid())
        .thenApply(o -> {
          position.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setPositionUuid(String positionUuid) {
    this.position = new ForeignObjectHolder<>(positionUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getPositionUuid() {
    return position.getForeignUuid();
  }

  public void setPosition(Position position) {
    this.position = new ForeignObjectHolder<>(position);
  }

  @GraphQLIgnore
  public Position getPosition() {
    return position.getForeignObject();
  }

  @GraphQLQuery(name = "startTime")
  public Instant getStartTime() {
    return startTime;
  }

  public void setStartTime(Instant startTime) {
    this.startTime = startTime;
  }

  @GraphQLQuery(name = "endTime")
  public Instant getEndTime() {
    return endTime;
  }

  public void setEndTime(Instant endTime) {
    this.endTime = endTime;
  }

  public static List<PersonPositionHistory> getDerivedHistory(List<PersonPositionHistory> history) {
    // Derive the start and end times; assumes list is in chronological order
    PersonPositionHistory pphPrev = null;
    for (final PersonPositionHistory pph : history) {
      pph.setStartTime(pph.getCreatedAt());
      if (pphPrev != null) {
        pphPrev.setEndTime(pph.getStartTime());
      }
      pphPrev = pph;
    }
    // Remove all null entries
    return history.stream()
        .filter(
            pph -> (pph != null && pph.getPersonUuid() != null && pph.getPositionUuid() != null))
        .collect(Collectors.toList());
  }
}
