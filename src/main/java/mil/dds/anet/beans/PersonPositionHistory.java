package mil.dds.anet.beans;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import javax.ws.rs.WebApplicationException;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;

import org.joda.time.DateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.IdFetcher;

/**
 * used to represent a person in a position at a particular time.
 * Populated from results of the peoplePositions table. 
 *  
 * @author hpitelka
 */
public class PersonPositionHistory extends AbstractAnetBean {

	Person person;
	Position position;
	DateTime startTime;
	DateTime endTime;

	@Override
	@JsonIgnore
	@GraphQLIgnore
	public Integer getId() {
		throw new WebApplicationException("no ID field on PersonPositionHistory");
	}

	@GraphQLIgnore
	public Person getPerson() {
		return person;
	}
	
	public void setPerson(Person person) {
		this.person = person;
	}
	
	@GraphQLQuery(name="person")
	public CompletableFuture<Person> loadPerson(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Person>().load(context, "people", person)
				.thenApply(o -> { person = o; return o; });
	}
	
	@GraphQLIgnore
	public Position getPosition() {
		return position;
	}
	
	public void setPosition(Position position) {
		this.position = position;
	}
	
	@GraphQLQuery(name="position")
	public CompletableFuture<Position> loadPosition(@GraphQLRootContext Map<String, Object> context) {
		return new IdFetcher<Position>().load(context, "positions", position)
				.thenApply(o -> { position = o; return o; });
	}
	
	@GraphQLQuery(name="startTime")
	public DateTime getStartTime() {
		return startTime;
	}
	
	public void setStartTime(DateTime startTime) {
		this.startTime = startTime;
	}
	
	@GraphQLQuery(name="endTime")
	public DateTime getEndTime() {
		return endTime;
	}
	
	public void setEndTime(DateTime endTime) {
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
		history = history.stream().filter(pph -> (pph != null && pph.getPerson() != null && pph.getPosition() != null)).collect(Collectors.toList());
		return history;
	}
}
