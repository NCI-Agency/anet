package mil.dds.anet.database;

import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.TransactionCallback;
import org.skife.jdbi.v2.TransactionStatus;
import org.skife.jdbi.v2.exceptions.UnableToExecuteStatementException;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PositionList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;

public class PositionDao extends AnetBaseDao<Position> {

	private static String[] fields = {"uuid", "name", "code", "createdAt",
			"updatedAt", "organizationUuid", "currentPersonUuid", "type",
			"status", "locationUuid" };
	private static String tableName = "positions";
	public static String POSITIONS_FIELDS  = DaoUtils.buildFieldAliases(tableName, fields, true);
	
	public PositionDao(Handle h) { 
		super(h, "positions", tableName, POSITIONS_FIELDS, null);
	}
	
	public PositionList getAll(int pageNum, int pageSize) {
		Query<Position> query = getPagedQuery(pageNum, pageSize, new PositionMapper());
		Long manualRowCount = getSqliteRowCount();
		return PositionList.fromQuery(query, pageNum, pageSize, manualRowCount);
	}
	
	public Position insert(Position p) {
		DaoUtils.setInsertFields(p);
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try { 
			dbHandle.createStatement(
					"/* positionInsert */ INSERT INTO positions (uuid, name, code, type, "
					+ "status, \"organizationUuid\", \"locationUuid\", \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :code, :type, :status, :organizationUuid, :locationUuid, :createdAt, :updatedAt)")
				.bindFromProperties(p)
				.bind("type", DaoUtils.getEnumId(p.getType()))
				.bind("organizationUuid", DaoUtils.getUuid(p.getOrganization()))
				.bind("status", DaoUtils.getEnumId(p.getStatus()))
				.bind("locationUuid", DaoUtils.getUuid(p.getLocation()))
				.execute();
			//Specifically don't set currentPersonId here because we'll handle that later in setPersonInPosition();
		} catch (UnableToExecuteStatementException e) {
			checkForUniqueCodeViolation(e);
			throw e;
		}
		return p;
	}
	
	public void checkForUniqueCodeViolation(UnableToExecuteStatementException e) { 
		if (e.getCause() != null && e.getCause() instanceof SQLException) { 
			SQLException cause = (SQLException) e.getCause();
			if (cause.getErrorCode() == 2601) { // Unique Key Violation constant for SQL Server
				if (cause.getMessage().contains("UQ_PositionCodes")) {
					throw new WebApplicationException("Another position is already using this "
							+ "code and each position must have its own code. "
							+ "Please double check that you entered the right code. ", Status.CONFLICT);	
				}
			}
		}
	}

	public Position getByUuid(String uuid) {
		return dbHandle.createQuery("/* positionGetByUuid */ SELECT " + POSITIONS_FIELDS + ", " + PersonDao.PERSON_FIELDS
				+ "FROM positions LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid "
				+ "WHERE positions.uuid = :uuid")
				.bind("uuid", uuid)
				.map(new PositionMapper())
				.first();
	}

	/*
	 * @return: number of rows updated. 
	 */
	public int update(Position p) { 
		DaoUtils.setUpdateFields(p);
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try {
			return dbHandle.createStatement("/* positionUpdate */ UPDATE positions SET name = :name, "
					+ "code = :code, \"organizationUuid\" = :organizationUuid, type = :type, status = :status, "
					+ "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindFromProperties(p)
				.bind("type", DaoUtils.getEnumId(p.getType()))
				.bind("organizationUuid", DaoUtils.getUuid(p.getOrganization()))
				.bind("status", DaoUtils.getEnumId(p.getStatus()))
				.bind("locationUuid", DaoUtils.getUuid(p.getLocation()))
				.execute();
		} catch (UnableToExecuteStatementException e) {
			checkForUniqueCodeViolation(e);
			throw e;
		}
	}
	
	public void setPersonInPosition(Person person, Position position) {
		dbHandle.inTransaction(new TransactionCallback<Void>() {
			public Void inTransaction(Handle conn, TransactionStatus status) throws Exception {
				DateTime now = DateTime.now();
				//If this person is in a position already, we need to remove them. 
				Position currPos = dbHandle.createQuery("/* positionSetPerson.find */ SELECT " + POSITIONS_FIELDS 
						+ " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
					.bind("personUuid", person.getUuid())
					.map(new PositionMapper())
					.first();
				if (currPos != null) { 
					dbHandle.createStatement("/* positionSetPerson.remove1 */ UPDATE positions set \"currentPersonUuid\" = null "
							+ "WHERE \"currentPersonUuid\" = :personUuid")
						.bind("personUuid", person.getUuid())
						.execute();
					
					dbHandle.createStatement("/* positionSetPerson.remove2 */ INSERT INTO \"peoplePositions\" "
							+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
							+ "VALUES (:positionUuid, NULL, :createdAt)")
						.bind("positionUuid", currPos.getUuid())
						.bind("createdAt", now)
						.execute();
				}
				
				dbHandle.createStatement("/* positionSetPerson.set1 */ UPDATE positions "
						+ "SET \"currentPersonUuid\" = :personUuid WHERE uuid = :positionUuid")
					.bind("personUuid", person.getUuid())
					.bind("positionUuid", position.getUuid())
					.execute();
				dbHandle.createStatement("/* positionSetPerson.set2 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
						+ "VALUES (:positionUuid, :personUuid, :createdAt)")
					.bind("positionUuid", position.getUuid())
					.bind("personUuid", person.getUuid())
					.bind("createdAt", now.plusMillis(1)) // Need to ensure this timestamp is greater than previous INSERT. 
					.execute();
				return null;
			}
		});
		
	}
	
	public void removePersonFromPosition(Position position) {
		dbHandle.inTransaction(new TransactionCallback<Void>() {
			public Void inTransaction(Handle conn, TransactionStatus status) throws Exception {
				DateTime now = DateTime.now();
				dbHandle.createStatement("/* positionRemovePerson.update */ UPDATE positions "
						+ "SET \"currentPersonUuid\" = :personUuid, \"updatedAt\" = :updatedAt "
						+ "WHERE uuid = :positionUuid")
					.bind("personUuid", (Integer) null)
					.bind("updatedAt", now)
					.bind("positionUuid", position.getUuid())
					.execute();
					
				String sql;
				if (DaoUtils.isMsSql(dbHandle)) { 
					sql = "/* positionRemovePerson.insert1 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
						+ "VALUES(null, " 
							+ "(SELECT TOP(1)\"personUuid\" FROM \"peoplePositions\" "
							+ "WHERE \"positionUuid\" = :positionUuid ORDER BY \"createdAt\" DESC), "
						+ ":createdAt)";
				} else { 
					sql = "/* positionRemovePerson.insert1 */ INSERT INTO \"peoplePositions\" "
							+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
						+ "VALUES(null, " 
							+ "(SELECT \"personUuid\" FROM \"peoplePositions\" WHERE \"positionUuid\" = :positionUuid "
							+ "ORDER BY \"createdAt\" DESC LIMIT 1), "
						+ ":createdAt)";
				}
				dbHandle.createStatement(sql)
					.bind("positionUuid", position.getUuid())
					.bind("createdAt", now)
					.execute();
			
				dbHandle.createStatement("/* positionRemovePerson.insert2 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
						+ "VALUES (:positionUuid, null, :createdAt)")
					.bind("positionUuid", position.getUuid())
					.bind("createdAt", now)
					.execute();
				return null;
			}
		});
	}
	
	public Person getPersonInPositionNow(Position p) { 
		if (p.getPerson() == null) { return null; } //No person currently in position.
		List<Person> people = dbHandle.createQuery("/* positionFindCurrentPerson */ SELECT " + PersonDao.PERSON_FIELDS
				+ " FROM people WHERE uuid = :personUuid")
			.bind("personUuid", p.getPerson().getUuid())
			.map(new PersonMapper())
			.list();
		if (people.size() == 0) { return null; }
		return people.get(0);
	}
	
	public Person getPersonInPosition(Position b, DateTime dtg) { 
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* positionFindPerson */ SELECT TOP(1) " + PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ " LEFT JOIN people ON people.uuid = \"peoplePositions\".\"personUuid\" "
				+ "WHERE \"peoplePositions\".\"positionUuid\" = :positionUuid "
				+ "AND \"peoplePositions\".\"createdAt\" < :dtg "
				+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC";
		} else {
			sql = "/* positionFindPerson */ SELECT " + PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ " LEFT JOIN people ON people.uuid = \"peoplePositions\".\"personUuid\" "
				+ "WHERE \"peoplePositions\".\"positionUuid\" = :positionUuid "
				+ "AND \"peoplePositions\".\"createdAt\" < :dtg "
				+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC LIMIT 1";
		}
		Query<Person> query = dbHandle.createQuery(sql)
			.bind("positionUuid", b.getUuid())
			.bind("dtg", dtg)
			.map(new PersonMapper());
		List<Person> results = query.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	public List<Person> getPeoplePreviouslyInPosition(Position p) { 
		List<Person> people = dbHandle.createQuery("/* positionFindPreviousPeople */ SELECT " + PersonDao.PERSON_FIELDS
				+ "FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON \"peoplePositions\".\"personUuid\" = people.uuid "
				+ "WHERE \"peoplePositions\".\"positionUuid\" = :positionUuid "
				+ "AND \"peoplePositions\".\"personUuid\" IS NOT NULL "
				+ "ORDER BY \"createdAt\" DESC")
			.bind("positionUuid", p.getUuid())
			.map(new PersonMapper())
			.list();
		//remove the last person, as that's the current position holder
		if (people.size() > 0) { people.remove(people.size() - 1); } 
		return people;
	}
	
	public Position getCurrentPositionForPerson(Person p) {
		List<Position> positions = dbHandle.createQuery("/* getCurrentPositionForPerson */ SELECT " 
				+ POSITIONS_FIELDS + " FROM positions "
				+ "WHERE \"currentPersonUuid\" = :personUuid")
			.bind("personUuid", p.getUuid())
			.map(new PositionMapper())
			.list();
		if (positions.size() == 0) { return null; } 
		return positions.get(0);		
	}

	public List<Position> getAssociatedPositions(Position p) {
		Query<Position> query = dbHandle.createQuery("/* getAssociatedPositions */ SELECT " 
				+ POSITIONS_FIELDS + ", people.* FROM positions "
				+ "LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid "
				+ "WHERE positions.uuid IN "
				+ "(SELECT \"positionUuid_a\" FROM \"positionRelationships\" WHERE \"positionUuid_b\" = :positionUuid AND deleted = :deleted) "
				+ "OR positions.uuid IN (SELECT \"positionUuid_b\" FROM \"positionRelationships\" WHERE \"positionUuid_a\" = :positionUuid AND deleted = :deleted)")
			.bind("positionUuid", p.getUuid())
			.bind("deleted", false)
			.map(new PositionMapper());
		return query.list();
	}

	public void associatePosition(Position a, Position b) {
		DateTime now = DateTime.now();
		final List<String> uuids = Arrays.asList(a.getUuid(), b.getUuid());
		Collections.sort(uuids);
		dbHandle.createStatement("/* associatePosition */ INSERT INTO \"positionRelationships\" "
				+ "(\"positionUuid_a\", \"positionUuid_b\", \"createdAt\", \"updatedAt\", deleted) "
				+ "VALUES (:positionUuid_a, :positionUuid_b, :createdAt, :updatedAt, :deleted)")
			.bind("positionUuid_a", uuids.get(0))
			.bind("positionUuid_b", uuids.get(1))
			.bind("createdAt", now)
			.bind("updatedAt", now)
			.bind("deleted", false)
			.execute();
	}

	public int deletePositionAssociation(Position a, Position b) {
		final List<String> uuids = Arrays.asList(a.getUuid(), b.getUuid());
		Collections.sort(uuids);
		return dbHandle.createStatement("/* deletePositionAssociation */ UPDATE \"positionRelationships\" "
				+ "SET deleted = :deleted, \"updatedAt\" = :updatedAt "
				+ "WHERE \"positionUuid_a\" = :positionUuid_a AND \"positionUuid_b\" = :positionUuid_b")
			.bind("deleted", true)
			.bind("positionUuid_a", uuids.get(0))
			.bind("positionUuid_b", uuids.get(1))
			.bind("updatedAt", DateTime.now())
			.execute();
		
	}

	public List<Position> getEmptyPositions(PositionType type) {
		return dbHandle.createQuery("SELECT " + POSITIONS_FIELDS + " FROM positions "
				+ "WHERE \"currentPersonUuid\" IS NULL "
				+ "AND positions.type = :type")
			.bind("type", DaoUtils.getEnumId(type))
			.map(new PositionMapper())
			.list();
	}

	public List<Position> getByOrganization(Organization organization) {
		return dbHandle.createQuery("/* getPositionByOrg */ SELECT " + POSITIONS_FIELDS 
				+ ", people.* from positions "
				+ "LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid "
				+ "WHERE \"organizationUuid\" = :orgUuid")
			.bind("orgUuid", organization.getUuid())
			.map(new PositionMapper())
			.list();
	}
	
	public PositionList search(PositionSearchQuery query) { 
		return AnetObjectEngine.getInstance().getSearcher()
				.getPositionSearcher().runSearch(query, dbHandle);
	}

	public List<PersonPositionHistory> getPositionHistory(Position position) {
		PersonPositionHistoryMapper mapper = new PersonPositionHistoryMapper(position);
		List<PersonPositionHistory> results = dbHandle.createQuery("/* getPositionHistory */ SELECT \"peoplePositions\".\"personUuid\" AS \"personUuid\", "
				+ "\"peoplePositions\".\"createdAt\" AS pph_createdAt, "
				+ PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON \"peoplePositions\".\"personUuid\" = people.uuid "
				+ "WHERE \"positionUuid\" = :positionUuid ORDER BY \"peoplePositions\".\"createdAt\" ASC")
			.bind("positionUuid", DaoUtils.getUuid(position))
			.map(mapper)
			.list();
		
		results.add(mapper.getCurrentPerson());
		
		//Remove all null entries. 
		results = results.stream().filter(pph -> pph != null).collect(Collectors.toList());
		return results;
		
	}

	public Boolean getIsApprover(Position position) {
		Number count = (Number) dbHandle.createQuery("/* getIsApprover */ SELECT count(*) as ct from approvers where \"positionUuid\" = :positionUuid")
			.bind("positionUuid", position.getUuid())
			.first()
			.get("ct");
		
		return count.longValue() > 0;
	}

	public Integer deletePosition(final Position p) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				//if this position has any history, we'll just delete it
				dbHandle.execute("DELETE FROM \"peoplePositions\" WHERE \"positionUuid\" = ?", p.getUuid());
				
				//if this position is in an approval chain, we just delete it
				dbHandle.execute("DELETE FROM approvers WHERE \"positionUuid\" = ?", p.getUuid());
				
				//if this position is in an organization, it'll be automatically removed. 
				
				//if this position has any associated positions, just remove them.
				dbHandle.execute("DELETE FROM \"positionRelationships\" WHERE \"positionUuid_a\" = ? OR \"positionUuid_b\"= ?", p.getUuid(), p.getUuid());
				
				return dbHandle.createStatement("DELETE FROM positions WHERE uuid = :positionUuid")
					.bind("positionUuid", p.getUuid())
					.execute();
			}
		});
	}

	public static String generateCurrentPositionFilter(String personJoinColumn, String dateFilterColumn, String placeholderName) {
		// it is possible this would be better implemented using WHERE NOT EXISTS instead of the left join
		return String.format("JOIN \"peoplePositions\" pp ON pp.\"personUuid\" = %1$s  AND pp.\"createdAt\" <= %2$s "
				+ " LEFT JOIN \"peoplePositions\" maxPp ON"
				+ "   maxPp.\"positionUuid\" = pp.\"positionUuid\" AND maxPp.\"createdAt\" > pp.\"createdAt\" AND maxPp.\"createdAt\" <= %2$s "
				+ " WHERE pp.\"positionUuid\" = :%3$s "
				+ " AND maxPp.\"createdAt\" IS NULL ",
				personJoinColumn, dateFilterColumn, placeholderName);
	}
}
