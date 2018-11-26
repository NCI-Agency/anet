package mil.dds.anet.database;

import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.joda.time.DateTime;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

public class PositionDao extends AnetBaseDao<Position> {

	private static String[] fields = {"uuid", "name", "code", "createdAt",
			"updatedAt", "organizationUuid", "currentPersonUuid", "type",
			"status", "locationUuid" };
	private static String tableName = "positions";
	public static String POSITIONS_FIELDS  = DaoUtils.buildFieldAliases(tableName, fields, true);

	private final IdBatcher<Position> idBatcher;
	private final ForeignKeyBatcher<PersonPositionHistory> personPositionHistoryBatcher;

	public PositionDao(Handle h) { 
		super(h, "positions", tableName, POSITIONS_FIELDS, null);
		final String idBatcherSql = "/* batch.getPositionsByUuids */ SELECT " + POSITIONS_FIELDS + ", " + PersonDao.PERSON_FIELDS
				+ "FROM positions LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid "
				+ "WHERE positions.uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Position>(h, idBatcherSql, "uuids", new PositionMapper());

		final String personPositionHistoryBatcherSql = "/* batch.getPositionHistory */ SELECT \"peoplePositions\".\"positionUuid\" AS \"positionUuid\", "
				+ "\"peoplePositions\".\"personUuid\" AS \"personUuid\", "
				+ "\"peoplePositions\".\"createdAt\" AS pph_createdAt, "
				+ PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON \"peoplePositions\".\"personUuid\" = people.uuid "
				+ "WHERE \"positionUuid\" IN ( <foreignKeys> ) ORDER BY \"peoplePositions\".\"createdAt\" ASC";
		this.personPositionHistoryBatcher = new ForeignKeyBatcher<PersonPositionHistory>(h, personPositionHistoryBatcherSql, "foreignKeys", new PersonPositionHistoryMapper(), "positionUuid");
	}
	
	public AnetBeanList<Position> getAll(int pageNum, int pageSize) {
		final Query query = getPagedQuery(pageNum, pageSize);
		Long manualRowCount = getSqliteRowCount();
		return new AnetBeanList<Position>(query, pageNum, pageSize, new PositionMapper(), manualRowCount);
	}
	
	public Position insert(Position p) {
		DaoUtils.setInsertFields(p);
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try { 
			dbHandle.createUpdate(
					"/* positionInsert */ INSERT INTO positions (uuid, name, code, type, "
					+ "status, \"organizationUuid\", \"locationUuid\", \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :code, :type, :status, :organizationUuid, :locationUuid, :createdAt, :updatedAt)")
				.bindBean(p)
				.bind("type", DaoUtils.getEnumId(p.getType()))
				.bind("organizationUuid", DaoUtils.getUuid(p.getOrganization()))
				.bind("status", DaoUtils.getEnumId(p.getStatus()))
				.bind("locationUuid", DaoUtils.getUuid(p.getLocation()))
				.execute();
			//Specifically don't set currentPersonUuid here because we'll handle that later in setPersonInPosition();
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
				.findFirst().orElse(null);
	}

	@Override
	public List<Position> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	public List<List<PersonPositionHistory>> getPersonPositionHistory(List<String> foreignKeys) {
		return personPositionHistoryBatcher.getByForeignKeys(foreignKeys);
	}

	/*
	 * @return: number of rows updated. 
	 */
	public int update(Position p) { 
		DaoUtils.setUpdateFields(p);
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try {
			return dbHandle.createUpdate("/* positionUpdate */ UPDATE positions SET name = :name, "
					+ "code = :code, \"organizationUuid\" = :organizationUuid, type = :type, status = :status, "
					+ "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(p)
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
	
	public int setPersonInPosition(Person person, Position position) {
		return dbHandle.inTransaction(h -> {
				DateTime now = DateTime.now();
				//If this person is in a position already, we need to remove them. 
				Position currPos = h.createQuery("/* positionSetPerson.find */ SELECT " + POSITIONS_FIELDS 
						+ " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
					.bind("personUuid", person.getUuid())
					.map(new PositionMapper())
					.findFirst().orElse(null);
				if (currPos != null) { 
					h.createUpdate("/* positionSetPerson.remove1 */ UPDATE positions set \"currentPersonUuid\" = null "
							+ "WHERE \"currentPersonUuid\" = :personUuid")
						.bind("personUuid", person.getUuid())
						.execute();
					
					h.createUpdate("/* positionSetPerson.remove2 */ INSERT INTO \"peoplePositions\" "
							+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
							+ "VALUES (:positionUuid, NULL, :createdAt)")
						.bind("positionUuid", currPos.getUuid())
						.bind("createdAt", now)
						.execute();
				}
				
				h.createUpdate("/* positionSetPerson.set1 */ UPDATE positions "
						+ "SET \"currentPersonUuid\" = :personUuid WHERE uuid = :positionUuid")
					.bind("personUuid", person.getUuid())
					.bind("positionUuid", position.getUuid())
					.execute();
				// GraphQL mutations *have* to return something, so we return the number of inserted rows
				return h.createUpdate("/* positionSetPerson.set2 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
						+ "VALUES (:positionUuid, :personUuid, :createdAt)")
					.bind("positionUuid", position.getUuid())
					.bind("personUuid", person.getUuid())
					.bind("createdAt", now.plusMillis(1)) // Need to ensure this timestamp is greater than previous INSERT. 
					.execute();
		});
		
	}
	
	public int removePersonFromPosition(Position position) {
		return dbHandle.inTransaction(h -> {
				DateTime now = DateTime.now();
				h.createUpdate("/* positionRemovePerson.update */ UPDATE positions "
						+ "SET \"currentPersonUuid\" = :personUuid, \"updatedAt\" = :updatedAt "
						+ "WHERE uuid = :positionUuid")
					.bind("personUuid", (Integer) null)
					.bind("updatedAt", now)
					.bind("positionUuid", position.getUuid())
					.execute();
					
				String sql;
				if (DaoUtils.isMsSql(h)) { 
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
				h.createUpdate(sql)
					.bind("positionUuid", position.getUuid())
					.bind("createdAt", now)
					.execute();
			
				return h.createUpdate("/* positionRemovePerson.insert2 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
						+ "VALUES (:positionUuid, null, :createdAt)")
					.bind("positionUuid", position.getUuid())
					.bind("createdAt", now)
					.execute();
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
		List<Person> results = dbHandle.createQuery(sql)
			.bind("positionUuid", b.getUuid())
			.bind("dtg", dtg)
			.map(new PersonMapper())
			.list();
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
		return dbHandle.createQuery("/* getAssociatedPositions */ SELECT "
				+ POSITIONS_FIELDS + ", people.* FROM positions "
				+ "LEFT JOIN people ON positions.\"currentPersonUuid\" = people.uuid "
				+ "WHERE positions.uuid IN "
				+ "(SELECT \"positionUuid_a\" FROM \"positionRelationships\" WHERE \"positionUuid_b\" = :positionUuid AND deleted = :deleted) "
				+ "OR positions.uuid IN (SELECT \"positionUuid_b\" FROM \"positionRelationships\" WHERE \"positionUuid_a\" = :positionUuid AND deleted = :deleted)")
			.bind("positionUuid", p.getUuid())
			.bind("deleted", false)
			.map(new PositionMapper())
			.list();
	}

	public int associatePosition(Position a, Position b) {
		DateTime now = DateTime.now();
		final List<String> uuids = Arrays.asList(a.getUuid(), b.getUuid());
		Collections.sort(uuids);
		return dbHandle.createUpdate("/* associatePosition */ INSERT INTO \"positionRelationships\" "
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
		return dbHandle.createUpdate("/* deletePositionAssociation */ UPDATE \"positionRelationships\" "
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
	
	public AnetBeanList<Position> search(PositionSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getPositionSearcher().runSearch(query, dbHandle);
	}

	public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(Map<String, Object> context, Position position) {
		return new ForeignKeyFetcher<PersonPositionHistory>()
				.load(context, "position.personPositionHistory", position.getUuid())
				.thenApply(l ->
		{
			return PersonPositionHistory.getDerivedHistory(l);
		});
	}

	public Boolean getIsApprover(Position position) {
		Number count = (Number) dbHandle.createQuery("/* getIsApprover */ SELECT count(*) as ct from approvers where \"positionUuid\" = :positionUuid")
			.bind("positionUuid", position.getUuid())
			.map(new MapMapper(false))
			.findOnly()
			.get("ct");
		
		return count.longValue() > 0;
	}

	public int deletePosition(final Position p) {
		return dbHandle.inTransaction(h -> {
				//if this position has any history, we'll just delete it
				h.execute("DELETE FROM \"peoplePositions\" WHERE \"positionUuid\" = ?", p.getUuid());
				
				//if this position is in an approval chain, we just delete it
				h.execute("DELETE FROM approvers WHERE \"positionUuid\" = ?", p.getUuid());
				
				//if this position is in an organization, it'll be automatically removed. 
				
				//if this position has any associated positions, just remove them.
				h.execute("DELETE FROM \"positionRelationships\" WHERE \"positionUuid_a\" = ? OR \"positionUuid_b\"= ?", p.getUuid(), p.getUuid());
				
				return h.createUpdate("DELETE FROM positions WHERE uuid = :positionUuid")
					.bind("positionUuid", p.getUuid())
					.execute();
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
