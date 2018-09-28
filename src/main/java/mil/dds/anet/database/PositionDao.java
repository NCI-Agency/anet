package mil.dds.anet.database;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
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
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PersonPositionHistoryMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.ForeignKeyFetcher;

public class PositionDao extends AnetBaseDao<Position> {

	private static String[] fields = {"id", "name", "code", "createdAt", 
			"updatedAt", "organizationId", "currentPersonId", "type", 
			"status", "locationId" };
	private static String tableName = "positions";
	public static String POSITIONS_FIELDS  = DaoUtils.buildFieldAliases(tableName, fields);

	private final IdBatcher<Position> idBatcher;
	private final ForeignKeyBatcher<PersonPositionHistory> personPositionHistoryBatcher;

	public PositionDao(Handle h) { 
		super(h, "positions", tableName, POSITIONS_FIELDS, null);
		final String idBatcherSql = "/* batch.getPositionsByIds */ SELECT " + POSITIONS_FIELDS + ", " + PersonDao.PERSON_FIELDS
				+ "FROM positions LEFT JOIN people ON positions.\"currentPersonId\" = people.id "
				+ "WHERE positions.id IN ( %1$s )";
		this.idBatcher = new IdBatcher<Position>(h, idBatcherSql, new PositionMapper());

		final String personPositionHistoryBatcherSql = "/* batch.getPositionHistory */ SELECT \"peoplePositions\".\"positionId\" AS \"positionId\", "
				+ "\"peoplePositions\".\"personId\" AS \"personId\", "
				+ "\"peoplePositions\".\"createdAt\" AS pph_createdAt, "
				+ PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON \"peoplePositions\".\"personId\" = people.id "
				+ "WHERE \"positionId\" IN ( %1$s ) ORDER BY \"peoplePositions\".\"createdAt\" ASC";
		this.personPositionHistoryBatcher = new ForeignKeyBatcher<PersonPositionHistory>(h, personPositionHistoryBatcherSql, new PersonPositionHistoryMapper(), "positionId");
	}
	
	public AnetBeanList<Position> getAll(int pageNum, int pageSize) {
		Query<Position> query = getPagedQuery(pageNum, pageSize, new PositionMapper());
		Long manualRowCount = getSqliteRowCount();
		return new AnetBeanList<Position>(query, pageNum, pageSize, manualRowCount);
	}
	
	public Position insert(Position p) {
		p.setCreatedAt(DateTime.now());
		p.setUpdatedAt(p.getCreatedAt());
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try { 
			GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
					"/* positionInsert */ INSERT INTO positions (name, code, type, "
					+ "status, \"organizationId\", \"locationId\", \"createdAt\", \"updatedAt\") "
					+ "VALUES (:name, :code, :type, :status, :organizationId, :locationId, :createdAt, :updatedAt)")
				.bindFromProperties(p)
				.bind("type", DaoUtils.getEnumId(p.getType()))
				.bind("organizationId", DaoUtils.getId(p.getOrganization()))
				.bind("status", DaoUtils.getEnumId(p.getStatus()))
				.bind("locationId", DaoUtils.getId(p.getLocation()))
				.executeAndReturnGeneratedKeys();
			p.setId(DaoUtils.getGeneratedId(keys));
		
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
				if (cause.getMessage().contains("UniquePositionCodes")) { 
					throw new WebApplicationException("Another position is already using this "
							+ "code and each position must have its own code. "
							+ "Please double check that you entered the right code. ", Status.CONFLICT);	
				}
			}
		}
	}
	
	public Position getById(int id) { 
		Query<Position> query = dbHandle.createQuery("/* positionGetById */ SELECT " + POSITIONS_FIELDS + ", " + PersonDao.PERSON_FIELDS
				+ "FROM positions LEFT JOIN people ON positions.\"currentPersonId\" = people.id "
				+ "WHERE positions.id = :id")
			.bind("id", id)
			.map(new PositionMapper());
		List<Position> positions = query.list();
		if (positions.size() == 0) { return null; } 
		return positions.get(0);
	}

	@Override
	public List<Position> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	public List<List<PersonPositionHistory>> getPersonPositionHistory(List<Integer> foreignKeys) {
		return personPositionHistoryBatcher.getByForeignKeys(foreignKeys);
	}

	/*
	 * @return: number of rows updated. 
	 */
	public int update(Position p) { 
		p.setUpdatedAt(DateTime.now());
		//prevent code conflicts
		if (p.getCode() != null && p.getCode().trim().length() == 0) { p.setCode(null); }
		
		try {
			return dbHandle.createStatement("/* positionUpdate */ UPDATE positions SET name = :name, "
					+ "code = :code, \"organizationId\" = :organizationId, type = :type, status = :status, "
					+ "\"locationId\" = :locationId, \"updatedAt\" = :updatedAt WHERE id = :id")
				.bindFromProperties(p)
				.bind("type", DaoUtils.getEnumId(p.getType()))
				.bind("organizationId", DaoUtils.getId(p.getOrganization()))
				.bind("status", DaoUtils.getEnumId(p.getStatus()))
				.bind("locationId", DaoUtils.getId(p.getLocation()))
				.execute();
		} catch (UnableToExecuteStatementException e) {
			checkForUniqueCodeViolation(e);
			throw e;
		}
	}
	
	public int setPersonInPosition(Person person, Position position) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				DateTime now = DateTime.now();
				//If this person is in a position already, we need to remove them. 
				Position currPos = dbHandle.createQuery("/* positionSetPerson.find */ SELECT " + POSITIONS_FIELDS 
						+ " FROM positions WHERE \"currentPersonId\" = :personId")
					.bind("personId", person.getId())
					.map(new PositionMapper())
					.first();
				if (currPos != null) { 
					dbHandle.createStatement("/* positionSetPerson.remove1 */ UPDATE positions set \"currentPersonId\" = null "
							+ "WHERE \"currentPersonId\" = :personId")
						.bind("personId", person.getId())
						.execute();
					
					dbHandle.createStatement("/* positionSetPerson.remove2 */ INSERT INTO \"peoplePositions\" "
							+ "(\"positionId\", \"personId\", \"createdAt\") "
							+ "VALUES (:positionId, NULL, :createdAt)")
						.bind("positionId", currPos.getId())
						.bind("createdAt", now)
						.execute();
				}
				
				dbHandle.createStatement("/* positionSetPerson.set1 */ UPDATE positions "
						+ "SET \"currentPersonId\" = :personId WHERE id = :positionId")
					.bind("personId", person.getId())
					.bind("positionId", position.getId())
					.execute();
				// GraphQL mutations *have* to return something, so we return the number of inserted rows
				return dbHandle.createStatement("/* positionSetPerson.set2 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionId\", \"personId\", \"createdAt\") "
						+ "VALUES (:positionId, :personId, :createdAt)")
					.bind("positionId", position.getId())
					.bind("personId", person.getId())
					.bind("createdAt", now.plusMillis(1)) // Need to ensure this timestamp is greater than previous INSERT. 
					.execute();
			}
		});
		
	}
	
	public int removePersonFromPosition(Position position) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				DateTime now = DateTime.now();
				dbHandle.createStatement("/* positionRemovePerson.update */ UPDATE positions "
						+ "SET \"currentPersonId\" = :personId, \"updatedAt\" = :updatedAt "
						+ "WHERE id = :positionId")
					.bind("personId", (Integer) null)
					.bind("updatedAt", now)
					.bind("positionId", position.getId())
					.execute();
					
				String sql;
				if (DaoUtils.isMsSql(dbHandle)) { 
					sql = "/* positionRemovePerson.insert1 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionId\", \"personId\", \"createdAt\") "
						+ "VALUES(null, " 
							+ "(SELECT TOP(1)\"personId\" FROM \"peoplePositions\" "
							+ "WHERE \"positionId\" = :positionId ORDER BY \"createdAt\" DESC), "
						+ ":createdAt)";
				} else { 
					sql = "/* positionRemovePerson.insert1 */ INSERT INTO \"peoplePositions\" "
							+ "(\"positionId\", \"personId\", \"createdAt\") "
						+ "VALUES(null, " 
							+ "(SELECT \"personId\" FROM \"peoplePositions\" WHERE \"positionId\" = :positionId "
							+ "ORDER BY \"createdAt\" DESC LIMIT 1), "
						+ ":createdAt)";
				}
				dbHandle.createStatement(sql)
					.bind("positionId", position.getId())
					.bind("createdAt", now)
					.execute();
			
				return dbHandle.createStatement("/* positionRemovePerson.insert2 */ INSERT INTO \"peoplePositions\" "
						+ "(\"positionId\", \"personId\", \"createdAt\") "
						+ "VALUES (:positionId, null, :createdAt)")
					.bind("positionId", position.getId())
					.bind("createdAt", now)
					.execute();
			}
		});
	}
	
	public Person getPersonInPositionNow(Position p) { 
		if (p.getPerson() == null) { return null; } //No person currently in position.
		List<Person> people = dbHandle.createQuery("/* positionFindCurrentPerson */ SELECT " + PersonDao.PERSON_FIELDS
				+ " FROM people WHERE id = :personId")
			.bind("personId", p.getPerson().getId())
			.map(new PersonMapper())
			.list();
		if (people.size() == 0) { return null; }
		return people.get(0);
	}
	
	public Person getPersonInPosition(Position b, DateTime dtg) { 
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* positionFindPerson */ SELECT TOP(1) " + PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ " LEFT JOIN people ON people.id = \"peoplePositions\".\"personId\" "
				+ "WHERE \"peoplePositions\".\"positionId\" = :positionId "
				+ "AND \"peoplePositions\".\"createdAt\" < :dtg "
				+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC";
		} else {
			sql = "/* positionFindPerson */ SELECT " + PersonDao.PERSON_FIELDS + " FROM \"peoplePositions\" "
				+ " LEFT JOIN people ON people.id = \"peoplePositions\".\"personId\" "
				+ "WHERE \"peoplePositions\".\"positionId\" = :positionId "
				+ "AND \"peoplePositions\".\"createdAt\" < :dtg "
				+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC LIMIT 1";
		}
		Query<Person> query = dbHandle.createQuery(sql)
			.bind("positionId", b.getId())
			.bind("dtg", dtg)
			.map(new PersonMapper());
		List<Person> results = query.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	public List<Person> getPeoplePreviouslyInPosition(Position p) { 
		List<Person> people = dbHandle.createQuery("/* positionFindPreviousPeople */ SELECT " + PersonDao.PERSON_FIELDS
				+ "FROM \"peoplePositions\" "
				+ "LEFT JOIN people ON \"peoplePositions\".\"personId\" = people.id "
				+ "WHERE \"peoplePositions\".\"positionId\" = :positionId "
				+ "AND \"peoplePositions\".\"personId\" IS NOT NULL "
				+ "ORDER BY \"createdAt\" DESC")
			.bind("positionId", p.getId())
			.map(new PersonMapper())
			.list();
		//remove the last person, as that's the current position holder
		if (people.size() > 0) { people.remove(people.size() - 1); } 
		return people;
	}
	
	public Position getCurrentPositionForPerson(Person p) {
		List<Position> positions = dbHandle.createQuery("/* getCurrentPositionForPerson */ SELECT " 
				+ POSITIONS_FIELDS + " FROM positions "
				+ "WHERE \"currentPersonId\" = :personId")
			.bind("personId", p.getId())
			.map(new PositionMapper())
			.list();
		if (positions.size() == 0) { return null; } 
		return positions.get(0);		
	}

	public List<Position> getAssociatedPositions(Position p) {
		Query<Position> query = dbHandle.createQuery("/* getAssociatedPositions */ SELECT " 
				+ POSITIONS_FIELDS + ", people.* FROM positions "
				+ "LEFT JOIN people ON positions.\"currentPersonId\" = people.id "
				+ "WHERE positions.id IN "
				+ "(SELECT \"positionId_a\" FROM \"positionRelationships\" WHERE \"positionId_b\" = :positionId AND deleted = :deleted) "
				+ "OR positions.id IN (SELECT \"positionId_b\" FROM \"positionRelationships\" WHERE \"positionId_a\" = :positionId AND deleted = :deleted)")
			.bind("positionId", p.getId())
			.bind("deleted", false)
			.map(new PositionMapper());
		return query.list();
	}

	public int associatePosition(Position a, Position b) {
		DateTime now = DateTime.now();
		Integer idOne = Math.min(a.getId(), b.getId());
		Integer idTwo = Math.max(a.getId(), b.getId());
		return dbHandle.createStatement("/* associatePosition */ INSERT INTO \"positionRelationships\" "
				+ "(\"positionId_a\", \"positionId_b\", \"createdAt\", \"updatedAt\", deleted) "
				+ "VALUES (:positionId_a, :positionId_b, :createdAt, :updatedAt, :deleted)")
			.bind("positionId_a", idOne)
			.bind("positionId_b", idTwo)
			.bind("createdAt", now)
			.bind("updatedAt", now)
			.bind("deleted", false)
			.execute();
	}

	public int deletePositionAssociation(Position a, Position b) {
		Integer idOne = Math.min(a.getId(), b.getId());
		Integer idTwo = Math.max(a.getId(), b.getId());
		return dbHandle.createStatement("/* deletePositionAssociation */ UPDATE \"positionRelationships\" "
				+ "SET deleted = :deleted, \"updatedAt\" = :updatedAt "
				+ "WHERE \"positionId_a\" = :positionId_a AND \"positionId_b\" = :positionId_b")
			.bind("deleted", true)
			.bind("positionId_a", idOne)
			.bind("positionId_b", idTwo)
			.bind("updatedAt", DateTime.now())
			.execute();
		
	}

	public List<Position> getEmptyPositions(PositionType type) {
		return dbHandle.createQuery("SELECT " + POSITIONS_FIELDS + " FROM positions "
				+ "WHERE \"currentPersonId\" IS NULL "
				+ "AND positions.type = :type")
			.bind("type", DaoUtils.getEnumId(type))
			.map(new PositionMapper())
			.list();
	}

	public List<Position> getByOrganization(Organization organization) {
		return dbHandle.createQuery("/* getPositionByOrg */ SELECT " + POSITIONS_FIELDS 
				+ ", people.* from positions "
				+ "LEFT JOIN people ON positions.\"currentPersonId\" = people.id "
				+ "WHERE \"organizationId\" = :orgId")
			.bind("orgId", organization.getId())
			.map(new PositionMapper())
			.list();
	}
	
	public AnetBeanList<Position> search(PositionSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getPositionSearcher().runSearch(query, dbHandle);
	}

	public CompletableFuture<List<PersonPositionHistory>> getPositionHistory(Map<String, Object> context, Position position) {
		return new ForeignKeyFetcher<PersonPositionHistory>()
				.load(context, "position.personPositionHistory", position.getId())
				.thenApply(l ->
		{
			return PersonPositionHistory.getDerivedHistory(l);
		});
	}

	public Boolean getIsApprover(Position position) {
		Number count = (Number) dbHandle.createQuery("/* getIsApprover */ SELECT count(*) as ct from approvers where \"positionId\" = :positionId")
			.bind("positionId", position.getId())
			.first()
			.get("ct");
		
		return count.longValue() > 0;
	}

	public int deletePosition(final Position p) {
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				//if this position has any history, we'll just delete it
				dbHandle.execute("DELETE FROM \"peoplePositions\" WHERE \"positionId\" = ?", p.getId());
				
				//if this position is in an approval chain, we just delete it
				dbHandle.execute("DELETE FROM approvers WHERE \"positionId\" = ?", p.getId());
				
				//if this position is in an organization, it'll be automatically removed. 
				
				//if this position has any associated positions, just remove them.
				dbHandle.execute("DELETE FROM \"positionRelationships\" WHERE \"positionId_a\" = ? OR \"positionId_b\"= ?", p.getId(), p.getId());
				
				return dbHandle.createStatement("DELETE FROM positions WHERE id = :positionId")
					.bind("positionId", p.getId())
					.execute();
			}
		});
	}

	public static String generateCurrentPositionFilter(String personJoinColumn, String dateFilterColumn, String placeholderName) {
		// it is possible this would be better implemented using WHERE NOT EXISTS instead of the left join
		return String.format("JOIN \"peoplePositions\" pp ON pp.\"personId\" = %1$s  AND pp.\"createdAt\" <= %2$s "
				+ " LEFT JOIN \"peoplePositions\" maxPp ON"
				+ "   maxPp.\"positionId\" = pp.\"positionId\" AND maxPp.\"createdAt\" > pp.\"createdAt\" AND maxPp.\"createdAt\" <= %2$s "
				+ " WHERE pp.\"positionId\" = :%3$s "
				+ " AND maxPp.\"createdAt\" IS NULL ",
				personJoinColumn, dateFilterColumn, placeholderName);
	}
}
