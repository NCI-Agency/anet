package mil.dds.anet.database;

import java.sql.SQLException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

import mil.dds.anet.AnetObjectEngine;
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
	private final ForeignKeyBatcher<Position> currentPositionForPersonBatcher;

	public PositionDao(AnetObjectEngine engine) {
		super(engine, "Positions", tableName, POSITIONS_FIELDS, null);
		final String idBatcherSql = "/* batch.getPositionsByUuids */ SELECT " + POSITIONS_FIELDS
				+ "FROM positions "
				+ "WHERE positions.uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Position>(engine, idBatcherSql, "uuids", new PositionMapper());

		final String personPositionHistoryBatcherSql = "/* batch.getPositionHistory */ SELECT * FROM \"peoplePositions\" "
				+ "WHERE \"positionUuid\" IN ( <foreignKeys> ) ORDER BY \"createdAt\" ASC";
		this.personPositionHistoryBatcher = new ForeignKeyBatcher<PersonPositionHistory>(engine, personPositionHistoryBatcherSql, "foreignKeys", new PersonPositionHistoryMapper(), "positionUuid");

		final String currentPositionForPersonBatcherSql = "/* batch.getCurrentPositionForPerson */ SELECT "
				+ POSITIONS_FIELDS + " FROM positions "
				+ "WHERE positions.\"currentPersonUuid\" IN ( <foreignKeys> )";
		this.currentPositionForPersonBatcher = new ForeignKeyBatcher<Position>(engine, currentPositionForPersonBatcherSql, "foreignKeys", new PositionMapper(), "positions_currentPersonUuid");
	}
	
	public AnetBeanList<Position> getAll(int pageNum, int pageSize) {
		final Query query = getPagedQuery(pageNum, pageSize);
		Long manualRowCount = getSqliteRowCount();
		return new AnetBeanList<Position>(query, pageNum, pageSize, new PositionMapper(), manualRowCount);
	}

	@Override
	public Position insertInternal(Position p) {
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try { 
			engine.getDbHandle().createUpdate(
					"/* positionInsert */ INSERT INTO positions (uuid, name, code, type, "
					+ "status, \"organizationUuid\", \"locationUuid\", \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :code, :type, :status, :organizationUuid, :locationUuid, :createdAt, :updatedAt)")
				.bindBean(p)
				.bind("createdAt", DaoUtils.asLocalDateTime(p.getCreatedAt()))
				.bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
				.bind("type", DaoUtils.getEnumId(p.getType()))
				.bind("status", DaoUtils.getEnumId(p.getStatus()))
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
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Position> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	public List<List<PersonPositionHistory>> getPersonPositionHistory(List<String> foreignKeys) {
		return personPositionHistoryBatcher.getByForeignKeys(foreignKeys);
	}

	public List<List<Position>> getCurrentPersonForPosition(List<String> foreignKeys) {
		return currentPositionForPersonBatcher.getByForeignKeys(foreignKeys);
	}

	/*
	 * @return: number of rows updated. 
	 */
	@Override
	public int updateInternal(Position p) {
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try {
			return engine.getDbHandle().createUpdate("/* positionUpdate */ UPDATE positions SET name = :name, "
					+ "code = :code, \"organizationUuid\" = :organizationUuid, type = :type, status = :status, "
					+ "\"locationUuid\" = :locationUuid, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(p)
				.bind("updatedAt", DaoUtils.asLocalDateTime(p.getUpdatedAt()))
				.bind("type", DaoUtils.getEnumId(p.getType()))
				.bind("status", DaoUtils.getEnumId(p.getStatus()))
				.execute();
		} catch (UnableToExecuteStatementException e) {
			checkForUniqueCodeViolation(e);
			throw e;
		}
	}
	
	public int setPersonInPosition(String personUuid, String positionUuid) {
		return engine.executeInTransaction(this::setPersonInPositionTransactional, personUuid, positionUuid);
	}

	private int setPersonInPositionTransactional(String personUuid, String positionUuid) {
		Instant now = Instant.now();
		//If this person is in a position already, we need to remove them. 
		Position currPos = engine.getDbHandle().createQuery("/* positionSetPerson.find */ SELECT " + POSITIONS_FIELDS
				+ " FROM positions WHERE \"currentPersonUuid\" = :personUuid")
			.bind("personUuid", personUuid)
			.map(new PositionMapper())
			.findFirst().orElse(null);
		if (currPos != null) { 
			engine.getDbHandle().createUpdate("/* positionSetPerson.remove1 */ UPDATE positions set \"currentPersonUuid\" = null "
					+ "WHERE \"currentPersonUuid\" = :personUuid")
				.bind("personUuid", personUuid)
				.execute();
			
			engine.getDbHandle().createUpdate("/* positionSetPerson.remove2 */ INSERT INTO \"peoplePositions\" "
					+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
					+ "VALUES (:positionUuid, NULL, :createdAt)")
				.bind("positionUuid", currPos.getUuid())
				.bind("createdAt", DaoUtils.asLocalDateTime(now))
				.execute();
		}
		
		engine.getDbHandle().createUpdate("/* positionSetPerson.set1 */ UPDATE positions "
				+ "SET \"currentPersonUuid\" = :personUuid WHERE uuid = :positionUuid")
			.bind("personUuid", personUuid)
			.bind("positionUuid", positionUuid)
			.execute();
		// GraphQL mutations *have* to return something, so we return the number of inserted rows
		return engine.getDbHandle().createUpdate("/* positionSetPerson.set2 */ INSERT INTO \"peoplePositions\" "
				+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
				+ "VALUES (:positionUuid, :personUuid, :createdAt)")
			.bind("positionUuid", positionUuid)
			.bind("personUuid", personUuid)
			.bind("createdAt", DaoUtils.asLocalDateTime(now.plusMillis(1))) // Need to ensure this timestamp is greater than previous INSERT.
			.execute();
	}
	
	public int removePersonFromPosition(String positionUuid) {
		return engine.executeInTransaction(this::removePersonFromPositionTransactional, positionUuid);
	}

	private int removePersonFromPositionTransactional(String positionUuid) {
		Instant now = Instant.now();
		engine.getDbHandle().createUpdate("/* positionRemovePerson.update */ UPDATE positions "
				+ "SET \"currentPersonUuid\" = :personUuid, \"updatedAt\" = :updatedAt "
				+ "WHERE uuid = :positionUuid")
			.bind("personUuid", (Integer) null)
			.bind("updatedAt", DaoUtils.asLocalDateTime(now))
			.bind("positionUuid", positionUuid)
			.execute();
			
		String sql;
		if (DaoUtils.isMsSql(engine.getDbUrl())) {
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
		engine.getDbHandle().createUpdate(sql)
			.bind("positionUuid", positionUuid)
			.bind("createdAt", DaoUtils.asLocalDateTime(now))
			.execute();
	
		return engine.getDbHandle().createUpdate("/* positionRemovePerson.insert2 */ INSERT INTO \"peoplePositions\" "
				+ "(\"positionUuid\", \"personUuid\", \"createdAt\") "
				+ "VALUES (:positionUuid, null, :createdAt)")
			.bind("positionUuid", positionUuid)
			.bind("createdAt", DaoUtils.asLocalDateTime(now))
			.execute();
	}
	
	public Person getPersonInPositionNow(String personUuid) {
		if (personUuid == null) { return null; } //No person currently in position.
		List<Person> people = engine.getDbHandle().createQuery("/* positionFindCurrentPerson */ SELECT " + PersonDao.PERSON_FIELDS
				+ " FROM people WHERE uuid = :personUuid")
			.bind("personUuid", personUuid)
			.map(new PersonMapper())
			.list();
		if (people.size() == 0) { return null; }
		return people.get(0);
	}
	
	public Person getPersonInPosition(String positionUuid, Instant dtg) {
		String sql;
		if (DaoUtils.isMsSql(engine.getDbUrl())) {
			sql = "/* positionFindPerson */ SELECT TOP(1) " + PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON people.uuid = \"peoplePositions\".\"personUuid\" "
				+ "WHERE \"peoplePositions\".\"positionUuid\" = :positionUuid "
				+ "AND \"peoplePositions\".\"createdAt\" < :dtg "
				+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC";
		} else {
			sql = "/* positionFindPerson */ SELECT " + PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON people.uuid = \"peoplePositions\".\"personUuid\" "
				+ "WHERE \"peoplePositions\".\"positionUuid\" = :positionUuid "
				+ "AND \"peoplePositions\".\"createdAt\" < :dtg "
				+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC LIMIT 1";
		}
		List<Person> results = engine.getDbHandle().createQuery(sql)
			.bind("positionUuid", positionUuid)
			.bind("dtg", dtg)
			.map(new PersonMapper())
			.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	public List<Person> getPeoplePreviouslyInPosition(String positionUuid) {
		List<Person> people = engine.getDbHandle().createQuery("/* positionFindPreviousPeople */ SELECT " + PersonDao.PERSON_FIELDS
				+ "FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON \"peoplePositions\".\"personUuid\" = people.uuid "
				+ "WHERE \"peoplePositions\".\"positionUuid\" = :positionUuid "
				+ "AND \"peoplePositions\".\"personUuid\" IS NOT NULL "
				+ "ORDER BY \"createdAt\" DESC")
			.bind("positionUuid", positionUuid)
			.map(new PersonMapper())
			.list();
		//remove the last person, as that's the current position holder
		if (people.size() > 0) { people.remove(people.size() - 1); } 
		return people;
	}
	
	public Position getCurrentPositionForPerson(String personUuid) {
		List<Position> positions = engine.getDbHandle().createQuery("/* getCurrentPositionForPerson */ SELECT "
				+ POSITIONS_FIELDS + " FROM positions "
				+ "WHERE \"currentPersonUuid\" = :personUuid")
			.bind("personUuid", personUuid)
			.map(new PositionMapper())
			.list();
		if (positions.size() == 0) { return null; } 
		return positions.get(0);		
	}

	public List<Position> getAssociatedPositions(String positionUuid) {
		return engine.getDbHandle().createQuery("/* getAssociatedPositions */ SELECT "
				+ POSITIONS_FIELDS + " FROM positions "
				+ "WHERE positions.uuid IN "
				+ "(SELECT \"positionUuid_a\" FROM \"positionRelationships\" WHERE \"positionUuid_b\" = :positionUuid AND deleted = :deleted) "
				+ "OR positions.uuid IN "
				+ "(SELECT \"positionUuid_b\" FROM \"positionRelationships\" WHERE \"positionUuid_a\" = :positionUuid AND deleted = :deleted)")
			.bind("positionUuid", positionUuid)
			.bind("deleted", false)
			.map(new PositionMapper())
			.list();
	}

	public int associatePosition(String positionUuidA, String positionUuidB) {
		Instant now = Instant.now();
		final List<String> uuids = Arrays.asList(positionUuidA, positionUuidB);
		Collections.sort(uuids);
		return engine.getDbHandle().createUpdate("/* associatePosition */ INSERT INTO \"positionRelationships\" "
				+ "(\"positionUuid_a\", \"positionUuid_b\", \"createdAt\", \"updatedAt\", deleted) "
				+ "VALUES (:positionUuid_a, :positionUuid_b, :createdAt, :updatedAt, :deleted)")
			.bind("positionUuid_a", uuids.get(0))
			.bind("positionUuid_b", uuids.get(1))
			.bind("createdAt", DaoUtils.asLocalDateTime(now))
			.bind("updatedAt", DaoUtils.asLocalDateTime(now))
			.bind("deleted", false)
			.execute();
	}

	public int deletePositionAssociation(String positionUuidA, String positionUuidB) {
		final List<String> uuids = Arrays.asList(positionUuidA, positionUuidB);
		Collections.sort(uuids);
		return engine.getDbHandle().createUpdate("/* deletePositionAssociation */ UPDATE \"positionRelationships\" "
				+ "SET deleted = :deleted, \"updatedAt\" = :updatedAt "
				+ "WHERE ("
				+ "  (\"positionUuid_a\" = :positionUuid_a AND \"positionUuid_b\" = :positionUuid_b)"
				+ "OR "
				+ "  (\"positionUuid_a\" = :positionUuid_b AND \"positionUuid_b\" = :positionUuid_a)"
				+ ")")
			.bind("deleted", true)
			.bind("positionUuid_a", uuids.get(0))
			.bind("positionUuid_b", uuids.get(1))
			.bind("updatedAt", DaoUtils.asLocalDateTime(Instant.now()))
			.execute();
		
	}

	public List<Position> getEmptyPositions(PositionType type) {
		return engine.getDbHandle().createQuery("SELECT " + POSITIONS_FIELDS + " FROM positions "
				+ "WHERE \"currentPersonUuid\" IS NULL "
				+ "AND positions.type = :type")
			.bind("type", DaoUtils.getEnumId(type))
			.map(new PositionMapper())
			.list();
	}

	public List<Position> getByOrganization(String organizationUuid) {
		return engine.getDbHandle().createQuery("/* getPositionByOrg */ SELECT " + POSITIONS_FIELDS
				+ "FROM positions "
				+ "WHERE \"organizationUuid\" = :orgUuid")
			.bind("orgUuid", organizationUuid)
			.map(new PositionMapper())
			.list();
	}
	
	public AnetBeanList<Position> search(PositionSearchQuery query) {
		return engine.getSearcher()
				.getPositionSearcher().runSearch(query, engine.getDbHandle());
	}

	public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(Map<String, Object> context, String positionUuid) {
		return new ForeignKeyFetcher<PersonPositionHistory>()
				.load(context, "position.personPositionHistory", positionUuid)
				.thenApply(l ->
		{
			return PersonPositionHistory.getDerivedHistory(l);
		});
	}

	public CompletableFuture<Position> getCurrentPositionForPerson(Map<String, Object> context, String personUuid) {
		return new ForeignKeyFetcher<Position>()
				.load(context, "position.currentPositionForPerson", personUuid)
				.thenApply(l -> l.isEmpty() ? null : l.get(0));
	}

	public Boolean getIsApprover(String positionUuid) {
		Number count = (Number) engine.getDbHandle().createQuery("/* getIsApprover */ SELECT count(*) as ct from approvers where \"positionUuid\" = :positionUuid")
			.bind("positionUuid", positionUuid)
			.map(new MapMapper(false))
			.findOnly()
			.get("ct");
		
		return count.longValue() > 0;
	}

	@Override
	public int deleteInternal(String positionUuid) {
		//if this position has any history, we'll just delete it
		engine.getDbHandle().execute("DELETE FROM \"peoplePositions\" WHERE \"positionUuid\" = ?", positionUuid);
		
		//if this position is in an approval chain, we just delete it
		engine.getDbHandle().execute("DELETE FROM approvers WHERE \"positionUuid\" = ?", positionUuid);
		
		//if this position is in an organization, it'll be automatically removed. 
		
		//if this position has any associated positions, just remove them.
		engine.getDbHandle().execute("DELETE FROM \"positionRelationships\" WHERE \"positionUuid_a\" = ? OR \"positionUuid_b\"= ?", positionUuid, positionUuid);
		
		return engine.getDbHandle().createUpdate("DELETE FROM positions WHERE uuid = :positionUuid")
			.bind("positionUuid", positionUuid)
			.execute();
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
