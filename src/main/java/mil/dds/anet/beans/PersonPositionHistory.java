package mil.dds.anet.beans;

import org.joda.time.DateTime;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.IGraphQLBean;
import mil.dds.anet.views.AbstractAnetBean.LoadLevel;

/**
 * used to represent a person in a position at a particular time.
 * Populated from results of the peoplePositions table. 
 *  
 * @author hpitelka
 */
public class PersonPositionHistory implements IGraphQLBean {

	Person person;
	Position position;
	DateTime startTime;
	DateTime endTime;
	
	public Person getPerson() {
		return person;
	}
	
	public void setPerson(Person person) {
		this.person = person;
	}
	
	@GraphQLFetcher("person")
	public Person loadPerson() { 
		if (person == null || person.getLoadLevel() == null) { return person; } 
		if (person.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.person = AnetObjectEngine.getInstance().getPersonDao().getByUuid(person.getUuid());
		}
		return person;
	}
	
	public Position getPosition() {
		return position;
	}
	
	public void setPosition(Position position) {
		this.position = position;
	}
	
	@GraphQLFetcher("position")
	public Position loadPosition() {
		if (position == null || position.getLoadLevel() == null) { return position; } 
		if (position.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.position = AnetObjectEngine.getInstance().getPositionDao().getByUuid(position.getUuid());
		}
		return position;
	}
	
	public DateTime getStartTime() {
		return startTime;
	}
	
	public void setStartTime(DateTime startTime) {
		this.startTime = startTime;
	}
	
	public DateTime getEndTime() {
		return endTime;
	}
	
	public void setEndTime(DateTime endTime) {
		this.endTime = endTime;
	}

}
