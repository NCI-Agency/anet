package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import javax.ws.rs.BadRequestException;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.core.GenericType;

import org.joda.time.DateTime;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;

import com.google.common.collect.ImmutableList;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery.PositionSearchSortBy;
import mil.dds.anet.test.beans.OrganizationTest;
import mil.dds.anet.test.beans.PositionTest;
import mil.dds.anet.test.resources.utils.GraphQLResponse;

public class PositionResourceTest extends AbstractResourceTest {

	private static final String ORGANIZATION_FIELDS = "id shortName";
	private static final String PERSON_FIELDS = "id name role";
	private static final String POSITION_FIELDS = "id name code type status";
	private static final String FIELDS = POSITION_FIELDS + " person { " + PERSON_FIELDS + " } organization { " + ORGANIZATION_FIELDS + " }";

	@Rule
	public ExpectedException thrown = ExpectedException.none();

	@Test
	public void positionTest()
		throws ExecutionException, InterruptedException {
		final Person jack = getJackJackson();
		assertThat(jack.getId()).isNotNull();
		assertThat(jack.getPosition()).isNotNull();
		final Position jacksOldPosition = jack.getPosition();
		
		//Create Position
		Position test = new Position();
		test.setName("A Test Position created by PositionResourceTest");
		test.setType(PositionType.ADVISOR);
		test.setStatus(PositionStatus.ACTIVE);
		
		//Assign to an AO
		final Integer aoId = graphQLHelper.createObject(admin, "createOrganization", "organization", "OrganizationInput",
				OrganizationTest.getTestAO(true), new GenericType<GraphQLResponse<Organization>>() {});
		test.setOrganization(Organization.createWithId(aoId));

		Integer createdId = graphQLHelper.createObject(admin, "createPosition", "position", "PositionInput",
				test, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(createdId).isNotNull();
		Position created = graphQLHelper.getObjectById(jack, "position", FIELDS, createdId, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(created.getName()).isEqualTo(test.getName());
		assertThat(created.getOrganization().getId()).isEqualTo(aoId);
		
		//Assign a person into the position
		Map<String, Object> variables = new HashMap<>();
		variables.put("id", created.getId());
		variables.put("person", jack);
		Integer nrUpdated = graphQLHelper.updateObject(admin, "mutation ($id: Int!, $person: PersonInput!) { payload: putPersonInPosition (id: $id, person: $person) }", variables);
		assertThat(nrUpdated).isEqualTo(1);
		
		Position currPos = graphQLHelper.getObjectById(admin, "position", FIELDS, created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(currPos.getPerson()).isNotNull();
		assertThat(currPos.getPerson().getId()).isEqualTo(jack.getId());
		
		final DateTime jacksTime = DateTime.now();
		try {
			Thread.sleep(500);//just slow me down a bit...
		} catch (InterruptedException ignore) {
			/* ignore */
		}  
		
		//change the person in this position
		Person steve = getSteveSteveson();
		final Position stevesCurrentPosition = steve.loadPosition();
		assertThat(stevesCurrentPosition).isNotNull();
		variables = new HashMap<>();
		variables.put("id", created.getId());
		variables.put("person", steve);
		nrUpdated = graphQLHelper.updateObject(admin, "mutation ($id: Int!, $person: PersonInput!) { payload: putPersonInPosition (id: $id, person: $person) }", variables);
		assertThat(nrUpdated).isEqualTo(1);
		
		//Verify that the new person is in the position
		currPos = graphQLHelper.getObjectById(jack, "position", FIELDS, created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(currPos.getPerson()).isNotNull();
		assertThat(currPos.getPerson().getId()).isEqualTo(steve.getId());
		
		//Verify that the previous person is now no longer in a position
		Person returnedPerson = graphQLHelper.getObjectById(jack, "person", PERSON_FIELDS + " position { " + POSITION_FIELDS + " }", jack.getId(), new GenericType<GraphQLResponse<Person>>() {});
		assertThat(returnedPerson.getPosition()).isNull();
		
		//delete the person from this position
		Integer nrDeleted = graphQLHelper.deleteObject(admin, "deletePersonFromPosition", created.getId());
		assertThat(nrDeleted).isEqualTo(1);
		
		currPos = graphQLHelper.getObjectById(jack, "position", FIELDS, created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(currPos.getPerson()).isNull();
		
		//Put steve back in his old position
		variables = new HashMap<>();
		variables.put("id", stevesCurrentPosition.getId());
		variables.put("person", steve);
		nrUpdated = graphQLHelper.updateObject(admin, "mutation ($id: Int!, $person: PersonInput!) { payload: putPersonInPosition (id: $id, person: $person) }", variables);
		assertThat(nrUpdated).isEqualTo(1);
		
		currPos = graphQLHelper.getObjectById(jack, "position", FIELDS, stevesCurrentPosition.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(currPos.getPerson()).isNotNull();
		assertThat(currPos.getPerson().getId()).isEqualTo(steve.getId());
		
		//pull for the person at a previous time. 
		Position retPos = graphQLHelper.getObjectById(jack, "position", POSITION_FIELDS + " previousPeople { createdAt startTime endTime person { id name } }", created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		final List<PersonPositionHistory> previousPeople = retPos.getPreviousPeople();
		assertThat(previousPeople).isNotEmpty();
		PersonPositionHistory last = null;
		for (final PersonPositionHistory personPositionHistory : previousPeople) {
			if (personPositionHistory.getCreatedAt().isBefore(jacksTime)
					&& (last == null || personPositionHistory.getCreatedAt().isAfter(last.getCreatedAt()))) {
				last = personPositionHistory;
			}
		}
		assertThat(last).isNotNull();
		assertThat(last.getPerson()).isNotNull();
		assertThat(last.getPerson().getId()).isEqualTo(jack.getId());
		
		created = graphQLHelper.getObjectById(jack, "position", FIELDS, created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		List<PersonPositionHistory> history = created.loadPreviousPeople(context).get();
		assertThat(history.size()).isEqualTo(2);
		assertThat(history.get(0).getPosition().getId()).isEqualTo(created.getId());
		assertThat(history.get(0).getPerson()).isEqualTo(jack);
		assertThat(history.get(0).getStartTime()).isNotNull();
		assertThat(history.get(0).getEndTime()).isNotNull();
		assertThat(history.get(0).getStartTime()).isLessThan(history.get(0).getEndTime());
		
		assertThat(history.get(1).getPerson()).isEqualTo(steve);
		assertThat(history.get(1).getEndTime()).isNotNull();
		assertThat(history.get(1).getStartTime()).isLessThan(history.get(1).getEndTime());
		
		
		//Create a principal
		final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
		queryOrgs.setText("Ministry");
		queryOrgs.setType(OrganizationType.PRINCIPAL_ORG);
		final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(admin, "organizationList", "query", "OrganizationSearchQueryInput",
				ORGANIZATION_FIELDS, queryOrgs, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().size()).isGreaterThan(0);
			
		Position prinPos = new Position();
		prinPos.setName("A Principal Position created by PositionResourceTest");
		prinPos.setType(PositionType.PRINCIPAL);
		prinPos.setOrganization(orgs.getList().get(0));
		prinPos.setStatus(PositionStatus.ACTIVE);
		
		Person principal = getRogerRogwell();
		assertThat(principal.getId()).isNotNull();
		Integer tashkilId = graphQLHelper.createObject(admin, "createPosition", "position", "PositionInput",
				prinPos, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(tashkilId).isNotNull();
		Position tashkil = graphQLHelper.getObjectById(admin, "position", FIELDS, tashkilId, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(tashkil.getId()).isNotNull();
		
		//put the principal in a tashkil
		variables = new HashMap<>();
		variables.put("id", tashkil.getId());
		variables.put("person", principal);
		nrUpdated = graphQLHelper.updateObject(admin, "mutation ($id: Int!, $person: PersonInput!) { payload: putPersonInPosition (id: $id, person: $person) }", variables);
		assertThat(nrUpdated).isEqualTo(1);
		
		//assign the tashkil to the position
		final List<Position> associatedPositions = new ArrayList<>();
		associatedPositions.add(tashkil);
		created.setAssociatedPositions(associatedPositions);
		nrUpdated = graphQLHelper.updateObject(admin, "updateAssociatedPosition", "position", "PositionInput", created);
		assertThat(nrUpdated).isEqualTo(1);
		
		//verify that we can pull the tashkil from the position
		retPos = graphQLHelper.getObjectById(jack, "position", FIELDS + " associatedPositions { " + FIELDS + " }", created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(retPos.getAssociatedPositions().size()).isEqualTo(1);
		assertThat(retPos.getAssociatedPositions()).contains(tashkil);
		
		//delete the tashkil from this position
		retPos.getAssociatedPositions().remove(tashkil);
		nrUpdated = graphQLHelper.updateObject(admin, "updateAssociatedPosition", "position", "PositionInput", retPos);
		assertThat(nrUpdated).isEqualTo(1);
		
		//verify that it's now gone. 
		retPos = graphQLHelper.getObjectById(jack, "position", FIELDS + " associatedPositions { " + FIELDS + " }", created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(retPos.getAssociatedPositions().size()).isEqualTo(0);
		
		//remove the principal from the tashkil
		nrDeleted = graphQLHelper.deleteObject(admin, "deletePersonFromPosition", tashkil.getId());
		assertThat(nrDeleted).isEqualTo(1);
		
		//Try to delete this position, it should fail because the tashkil is active
		thrown.expect(BadRequestException.class);
		graphQLHelper.deleteObject(admin, "deletePosition", tashkil.getId());
		
		tashkil.setStatus(PositionStatus.INACTIVE);
		nrUpdated = graphQLHelper.updateObject(admin, "updatePosition", "position", "PositionInput", tashkil);
		assertThat(nrUpdated).isEqualTo(1);
		
		nrDeleted = graphQLHelper.deleteObject(admin, "deletePosition", tashkil.getId());
		assertThat(nrDeleted).isEqualTo(1);

		thrown.expect(NotFoundException.class);
		graphQLHelper.getObjectById(jack, "position", FIELDS, tashkil.getId(), new GenericType<GraphQLResponse<Position>>() {});

		//Put jack back in his old position
		variables = new HashMap<>();
		variables.put("id", jacksOldPosition.getId());
		variables.put("person", jack);
		nrUpdated = graphQLHelper.updateObject(admin, "mutation ($id: Int!, $person: PersonInput!) { payload: putPersonInPosition (id: $id, person: $person) }", variables);
		assertThat(nrUpdated).isEqualTo(1);

		currPos = graphQLHelper.getObjectById(admin, "position", FIELDS, jacksOldPosition.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(currPos.getPerson()).isNotNull();
		assertThat(currPos.getPerson().getId()).isEqualTo(jack.getId());
	}
		
	
	@Test
	public void tashkilTest() {
		final Person jack = getJackJackson();
		
		//Create Position
		Position test = PositionTest.getTestPosition();
		test.setCode(test.getCode() + "_" + DateTime.now().getMillis());
		final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
		queryOrgs.setText("Ministry");
		queryOrgs.setType(OrganizationType.PRINCIPAL_ORG);
		final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(admin, "organizationList", "query", "OrganizationSearchQueryInput",
				ORGANIZATION_FIELDS, queryOrgs, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().size()).isGreaterThan(0);
		
		test.setOrganization(orgs.getList().get(0));
		
		Integer createdId = graphQLHelper.createObject(admin, "createPosition", "position", "PositionInput",
				test, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(createdId).isNotNull();
		Position created = graphQLHelper.getObjectById(admin, "position", FIELDS, createdId, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(created.getName()).isEqualTo(test.getName());
		assertThat(created.getCode()).isEqualTo(test.getCode());
		assertThat(created.getId()).isNotNull();
		
		//Change Name/Code
		created.setName("Deputy Chief of Donuts");
		Integer nrUpdated = graphQLHelper.updateObject(admin, "updatePosition", "position", "PositionInput", created);
		assertThat(nrUpdated).isEqualTo(1);
		Position returned = graphQLHelper.getObjectById(jack, "position", FIELDS, created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(returned.getName()).isEqualTo(created.getName());
		assertThat(returned.getCode()).isEqualTo(created.getCode());
		
		//Assign Principal
		Person steve = getSteveSteveson();
		Position stevesCurrPos = steve.loadPosition();
		assertThat(stevesCurrPos).isNotNull();
		
		Map<String, Object> variables = new HashMap<>();
		variables.put("id", created.getId());
		variables.put("person", steve);
		nrUpdated = graphQLHelper.updateObject(admin, "mutation ($id: Int!, $person: PersonInput!) { payload: putPersonInPosition (id: $id, person: $person) }", variables);
		assertThat(nrUpdated).isEqualTo(1);
		
		Position principalPos = graphQLHelper.getObjectById(admin, "position", FIELDS, created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(principalPos.getPerson()).isNotNull();
		assertThat(principalPos.getPerson().getId()).isEqualTo(steve.getId());
		
		//Put steve back in his originial position
		variables = new HashMap<>();
		variables.put("id", stevesCurrPos.getId());
		variables.put("person", steve);
		nrUpdated = graphQLHelper.updateObject(admin, "mutation ($id: Int!, $person: PersonInput!) { payload: putPersonInPosition (id: $id, person: $person) }", variables);
		assertThat(nrUpdated).isEqualTo(1);
		
		//Ensure the old position is now empty
		principalPos = graphQLHelper.getObjectById(admin, "position", FIELDS, created.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(principalPos.getPerson()).isNull();
	}
	
	@Test
	public void searchTest() { 
		Person jack = getJackJackson();
		PositionSearchQuery query = new PositionSearchQuery();
		
		//Search by name
		query.setText("Advisor");
		List<Position> searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults).isNotEmpty();
		
		//Search by name & is not filled
		query.setIsFilled(false);
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults).isNotEmpty();
		assertThat(searchResults.stream().filter(p -> (p.getPerson() == null)).collect(Collectors.toList()))
			.hasSameElementsAs(searchResults);
		
		//Search by name and is filled and type
		query.setIsFilled(true);
		query.setType(ImmutableList.of(PositionType.ADVISOR));
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults).isNotEmpty();
		assertThat(searchResults.stream()
				.filter(p -> (p.getPerson() != null))
				.filter(p -> p.getType().equals(PositionType.ADVISOR))
				.collect(Collectors.toList()))
			.hasSameElementsAs(searchResults);
		
		//Search for text= advisor and type = admin should be empty. 
		query.setType(ImmutableList.of(PositionType.ADMINISTRATOR));
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults).isEmpty();
		
		query.setText("Administrator");
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults).isNotEmpty();
		
		//Search by organization
		final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
		queryOrgs.setText("ef 1");
		queryOrgs.setType(OrganizationType.ADVISOR_ORG);
		final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(jack, "organizationList", "query", "OrganizationSearchQueryInput",
				ORGANIZATION_FIELDS, queryOrgs, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().size()).isGreaterThan(0);
		Organization ef11 = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("ef 1.1")).findFirst().get();
		Organization ef1 = orgs.getList().stream().filter(o -> o.getShortName().equalsIgnoreCase("ef 1")).findFirst().get();
		assertThat(ef11.getShortName()).isEqualToIgnoringCase("EF 1.1");
		assertThat(ef1.getShortName()).isEqualTo("EF 1");
		
		query.setText("Advisor");
		query.setType(null);
		query.setOrganizationId(ef1.getId());
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults.stream()
				.filter(p -> p.getOrganization().getId() == ef1.getId())
				.collect(Collectors.toList()))
			.hasSameElementsAs(searchResults);
		
		query.setIncludeChildrenOrgs(true);
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults).isNotEmpty();
		
		query.setIncludeChildrenOrgs(false);
		query.setText("a");
		query.setSortBy(PositionSearchSortBy.NAME);
		query.setSortOrder(SortOrder.DESC); 
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		String prevName = null;
		for (Position p : searchResults) { 
			if (prevName != null) { assertThat(p.getName().compareToIgnoreCase(prevName)).isLessThanOrEqualTo(0); } 
			prevName = p.getName();
		}
		
		query.setSortBy(PositionSearchSortBy.CODE);
		query.setSortOrder(SortOrder.ASC); 
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		String prevCode = null;
		for (Position p : searchResults) { 
			if (prevCode != null) { assertThat(p.getCode().compareToIgnoreCase(prevCode)).isGreaterThanOrEqualTo(0); } 
			prevCode = p.getCode();
		}
		
		//search by status. 
		query = new PositionSearchQuery();
		query.setStatus(PositionStatus.INACTIVE);
		searchResults = graphQLHelper.searchObjects(jack, "positionList", "query", "PositionSearchQueryInput",
				FIELDS, query, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {}).getList();
		assertThat(searchResults.size()).isGreaterThan(0);
		assertThat(searchResults.stream().filter(p -> p.getStatus().equals(PositionStatus.INACTIVE)).count()).isEqualTo(searchResults.size());
	}
	
	@Test
	public void getAllPositionsTest() { 
		Person jack = getJackJackson();
		
		int pageNum = 0;
		int pageSize = 10;
		int totalReturned = 0;
		int firstTotalCount = 0;
		AnetBeanList<Position> list = null;
		do { 
			list = graphQLHelper.getAllObjects(jack, "positions (pageNum: " + pageNum + ", pageSize: " + pageSize + ")",
					FIELDS, new GenericType<GraphQLResponse<AnetBeanList<Position>>>() {});
			assertThat(list).isNotNull();
			assertThat(list.getPageNum()).isEqualTo(pageNum);
			assertThat(list.getPageSize()).isEqualTo(pageSize);
			totalReturned += list.getList().size();
			if (pageNum == 0) { firstTotalCount = list.getTotalCount(); }
			pageNum++;
		} while (list.getList().size() != 0); 
		
		assertThat(totalReturned).isEqualTo(firstTotalCount);
	}
	
	@Test
	public void createPositionTest()
		throws ExecutionException, InterruptedException {
		//Create a new position and designate the person upfront
		Person newb = new Person();
		newb.setName("PositionTest Person");
		newb.setRole(Role.PRINCIPAL);
		newb.setStatus(PersonStatus.ACTIVE);
		
		Integer newbId = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput",
				newb, new GenericType<GraphQLResponse<Person>>() {});
		assertThat(newbId).isNotNull();
		newb = graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, newbId, new GenericType<GraphQLResponse<Person>>() {});
		assertThat(newb.getId()).isNotNull();
		
		final OrganizationSearchQuery queryOrgs = new OrganizationSearchQuery();
		queryOrgs.setText("Ministry");
		queryOrgs.setType(OrganizationType.PRINCIPAL_ORG);
		final AnetBeanList<Organization> orgs = graphQLHelper.searchObjects(admin, "organizationList", "query", "OrganizationSearchQueryInput",
				ORGANIZATION_FIELDS, queryOrgs, new GenericType<GraphQLResponse<AnetBeanList<Organization>>>() {});
		assertThat(orgs.getList().size()).isGreaterThan(0);
		
		Position newbPosition = new Position();
		newbPosition.setName("PositionTest Position for Newb");
		newbPosition.setType(PositionType.PRINCIPAL);
		newbPosition.setOrganization(orgs.getList().get(0));
		newbPosition.setStatus(PositionStatus.ACTIVE);
		newbPosition.setPerson(newb);
		
		Integer newbPositionId = graphQLHelper.createObject(admin, "createPosition", "position", "PositionInput",
				newbPosition, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(newbPositionId).isNotNull();
		newbPosition = graphQLHelper.getObjectById(admin, "position", FIELDS, newbPositionId, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(newbPosition.getId()).isNotNull();
		
		//Ensure that the position contains the person
		Position returned = graphQLHelper.getObjectById(admin, "position", FIELDS, newbPosition.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(returned.getId()).isNotNull();
		final Person returnedPerson = returned.getPerson();
		assertThat(returnedPerson).isNotNull();
		assertThat(returnedPerson.getId()).isEqualTo(newb.getId());
		
		//Ensure that the person is assigned to this position. 
		assertThat(newb.loadPosition()).isNotNull();
		assertThat(newb.loadPosition().getId()).isEqualTo(returned.getId());
		
		//Assign somebody else to this position. 
		Person prin2 = new Person();
		prin2.setName("2nd Principal in PrincipalTest");
		prin2.setRole(Role.PRINCIPAL);
		Integer prin2Id = graphQLHelper.createObject(admin, "createPerson", "person", "PersonInput",
				prin2, new GenericType<GraphQLResponse<Person>>() {});
		assertThat(prin2Id).isNotNull();
		prin2 = graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, prin2Id, new GenericType<GraphQLResponse<Person>>() {});
		assertThat(prin2.getId()).isNotNull();
		assertThat(prin2.loadPosition()).isNull();
		
		prin2.setPosition(Position.createWithId(newbPosition.getId()));
		Integer nrUpdated = graphQLHelper.updateObject(admin, "updatePerson", "person", "PersonInput", prin2);
		assertThat(nrUpdated).isEqualTo(1);
		
		//Reload this person to check their position was set. 
		prin2 = graphQLHelper.getObjectById(admin, "person", PERSON_FIELDS, prin2.getId(), new GenericType<GraphQLResponse<Person>>() {});
		assertThat(prin2).isNotNull();
		assertThat(prin2.loadPosition()).isNotNull();
		assertThat(prin2.loadPosition().getId()).isEqualTo(newbPosition.getId());
		
		//Check with a different API endpoint. 
		Position currPos = graphQLHelper.getObjectById(admin, "position", FIELDS, newbPosition.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(currPos.getPerson()).isNotNull();
		assertThat(currPos.getPerson().getId()).isEqualTo(prin2.getId());
		
		//Slow the test down a bit
		try {
			Thread.sleep(10);
		} catch (InterruptedException ignore) { }
		
		//Create a new position and move prin2 there on CREATE. 
		Position pos2 = new Position();
		pos2.setName("Created by PositionTest");
		pos2.setType(PositionType.PRINCIPAL);
		pos2.setOrganization(orgs.getList().get(0));
		pos2.setStatus(PositionStatus.ACTIVE);
		pos2.setPerson(Person.createWithId(prin2.getId()));
		
		Integer pos2Id = graphQLHelper.createObject(admin, "createPosition", "position", "PositionInput",
				pos2, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(pos2Id).isNotNull();
		pos2 = graphQLHelper.getObjectById(admin, "position", FIELDS, pos2Id, new GenericType<GraphQLResponse<Position>>() {});
		assertThat(pos2.getId()).isNotNull();
		
		returned = graphQLHelper.getObjectById(admin, "position", FIELDS, pos2.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(returned).isNotNull();
		assertThat(returned.getName()).isEqualTo(pos2.getName());
		final Person returnedPerson2 = returned.getPerson();
		assertThat(returnedPerson2).isNotNull();
		assertThat(returnedPerson2.getId()).isEqualTo(prin2.getId());
		
		//Make sure prin2 got moved out of newbPosition
		currPos = graphQLHelper.getObjectById(admin, "position", FIELDS, newbPosition.getId(), new GenericType<GraphQLResponse<Position>>() {});
		assertThat(currPos.getPerson()).isNull();
		
		//Pull the history of newbPosition
		newbPosition = graphQLHelper.getObjectById(admin, "position", FIELDS, newbPosition.getId(), new GenericType<GraphQLResponse<Position>>() {});
		List<PersonPositionHistory> history = newbPosition.loadPreviousPeople(context).get();
		assertThat(history.size()).isEqualTo(2);
		assertThat(history.get(0).getPerson().getId()).isEqualTo(newb.getId());
		assertThat(history.get(1).getPerson().getId()).isEqualTo(prin2.getId());
	}
	
}
