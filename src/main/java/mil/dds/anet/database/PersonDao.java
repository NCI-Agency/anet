package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.TransactionCallback;
import org.skife.jdbi.v2.TransactionStatus;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PersonList;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.utils.DaoUtils;

public class PersonDao extends AnetBaseDao<Person> {

	private static String[] fields = {"id","name","status","role",
			"emailAddress","phoneNumber","rank","biography",
			"country", "gender", "endOfTourDate",
			"domainUsername","pendingVerification","createdAt",
			"updatedAt"};
	private static String tableName = "people";
	public static String PERSON_FIELDS = DaoUtils.buildFieldAliases(tableName, fields);
	
	public PersonDao(Handle h) { 
		super(h, "Person", tableName, PERSON_FIELDS, null);
	}
	
	public PersonList getAll(int pageNum, int pageSize) {
		Query<Person> query = getPagedQuery(pageNum, pageSize, new PersonMapper());
		Long manualCount = getSqliteRowCount();
		return PersonList.fromQuery(query, pageNum, pageSize, manualCount);
	}

	public Person getById(int id) { 
		Query<Person> query = dbHandle.createQuery("/* personGetById */ SELECT " + PERSON_FIELDS + " FROM people WHERE id = :id")
				.bind("id",  id)
				.map(new PersonMapper());
		List<Person> rs = query.list();
		if (rs.size() == 0) { return null; } 
		return rs.get(0);
	}
	
	public Person insert(Person p) {
		p.setCreatedAt(DateTime.now());
		p.setUpdatedAt(DateTime.now());
		StringBuilder sql = new StringBuilder();
		sql.append("/* personInsert */ INSERT INTO people " 
				+ "(name, status, role, \"emailAddress\", \"phoneNumber\", rank, \"pendingVerification\", "
				+ "gender, country, \"endOfTourDate\", biography, \"domainUsername\", \"createdAt\", \"updatedAt\") "
				+ "VALUES (:name, :status, :role, :emailAddress, :phoneNumber, :rank, :pendingVerification, "
				+ ":gender, :country, ");
		if (DaoUtils.isMsSql(dbHandle)) {
			//MsSql requires an explicit CAST when datetime2 might be NULL. 
			sql.append("CAST(:endOfTourDate AS datetime2), ");
		} else {
			sql.append(":endOfTourDate, ");
		}
		sql.append(":biography, :domainUsername, :createdAt, :updatedAt);");

		GeneratedKeys<Map<String, Object>> keys = dbHandle.createStatement(sql.toString())
			.bindFromProperties(p)
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.bind("role", DaoUtils.getEnumId(p.getRole()))
			.executeAndReturnGeneratedKeys();
		p.setId(DaoUtils.getGeneratedId(keys));
		return p;
	}
	
	public int update(Person p) {
		p.setUpdatedAt(DateTime.now());
		StringBuilder sql = new StringBuilder("/* personUpdate */ UPDATE people "
				+ "SET name = :name, status = :status, role = :role, "
				+ "gender = :gender, country = :country,  \"emailAddress\" = :emailAddress, "
				+ "\"phoneNumber\" = :phoneNumber, rank = :rank, biography = :biography, "
				+ "\"pendingVerification\" = :pendingVerification, \"domainUsername\" = :domainUsername, "
				+ "\"updatedAt\" = :updatedAt, ");
		if (DaoUtils.isMsSql(dbHandle)) {
			//MsSql requires an explicit CAST when datetime2 might be NULL. 
			sql.append("\"endOfTourDate\" = CAST(:endOfTourDate AS datetime2) ");
		} else {
			sql.append("\"endOfTourDate\" = :endOfTourDate ");
		}
		sql.append("WHERE id = :id");
		return dbHandle.createStatement(sql.toString())
			.bindFromProperties(p)
			.bind("status", DaoUtils.getEnumId(p.getStatus()))
			.bind("role", DaoUtils.getEnumId(p.getRole()))
			.execute();
	}
	
	public PersonList search(PersonSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getPersonSearcher().runSearch(query, dbHandle);
	}
	
	public Organization getOrganizationForPerson(int personId) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql = "/* getOrganizationForPerson */ SELECT TOP(1) " + OrganizationDao.ORGANIZATION_FIELDS 
					+ "FROM organizations, positions, \"peoplePositions\" WHERE "
					+ "\"peoplePositions\".\"personId\" = :personId AND \"peoplePositions\".\"positionId\" = positions.id "
					+ "AND positions.\"organizationId\" = organizations.id "
					+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC";
		} else { 
			sql = "/* getOrganizationForPerson */ SELECT " + OrganizationDao.ORGANIZATION_FIELDS
					+ "FROM organizations, positions, \"peoplePositions\" WHERE "
					+ "\"peoplePositions\".\"personId\" = :personId AND \"peoplePositions\".\"positionId\" = positions.id "
					+ "AND positions.\"organizationId\" = organizations.id "
					+ "ORDER BY \"peoplePositions\".\"createdAt\" DESC LIMIT 1";
		}
		
		Query<Organization> query = dbHandle.createQuery(sql)
			.bind("personId", personId)
			.map(new OrganizationMapper());
		List<Organization> rs = query.list();
		if (rs.size() == 0) { return null; } 
		return rs.get(0);
	}

	public List<Person> findByDomainUsername(String domainUsername) {
		return dbHandle.createQuery("/* findByDomainUsername */ SELECT " + PERSON_FIELDS + "," + PositionDao.POSITIONS_FIELDS 
				+ "FROM people LEFT JOIN positions ON people.id = positions.\"currentPersonId\" "
				+ "WHERE people.\"domainUsername\" = :domainUsername "
				+ "AND people.status != :inactiveStatus")
			.bind("domainUsername", domainUsername)
			.bind("inactiveStatus", DaoUtils.getEnumId(PersonStatus.INACTIVE))
			.map(new PersonMapper())
			.list();
	}

	public List<Person> getRecentPeople(Person author, int maxResults) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getRecentPeople */ SELECT " + PersonDao.PERSON_FIELDS
				+ "FROM people WHERE people.id IN ( "
					+ "SELECT top(:maxResults) \"reportPeople\".\"personId\" "
					+ "FROM reports JOIN \"reportPeople\" ON reports.id = \"reportPeople\".\"reportId\" "
					+ "WHERE \"authorId\" = :authorId "
					+ "AND \"personId\" != :authorId "
					+ "GROUP BY \"personId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC"
				+ ")";
		} else {
			sql = "/* getRecentPeople */ SELECT " + PersonDao.PERSON_FIELDS
				+ "FROM people WHERE people.id IN ( "
					+ "SELECT \"reportPeople\".\"personId\" "
					+ "FROM reports JOIN \"reportPeople\" ON reports.id = \"reportPeople\".\"reportId\" "
					+ "WHERE \"authorId\" = :authorId "
					+ "AND \"personId\" != :authorId "
					+ "GROUP BY \"personId\" "
					+ "ORDER BY MAX(reports.\"createdAt\") DESC "
					+ "LIMIT :maxResults"
				+ ")";
		}
		return dbHandle.createQuery(sql)
				.bind("authorId", author.getId())
				.bind("maxResults", maxResults)
				.map(new PersonMapper())
				.list();
	}

	public boolean mergePeople(Person winner, Person loser, Boolean copyPosition) {
		dbHandle.inTransaction(new TransactionCallback<Void>() {
			public Void inTransaction(Handle conn, TransactionStatus status) throws Exception {
				//delete duplicates where other is primary, or where neither is primary
				dbHandle.createStatement("DELETE FROM \"reportPeople\" WHERE ("
						+ "\"personId\" = :loserId AND \"reportId\" IN ("
							+ "SELECT \"reportId\" FROM \"reportPeople\" WHERE \"personId\" = :winnerId AND \"isPrimary\" = :isPrimary"
						+ ")) OR ("
						+ "\"personId\" = :winnerId AND \"reportId\" IN ("
							+ "SELECT \"reportId\" FROM \"reportPeople\" WHERE \"personId\" = :loserId AND \"isPrimary\" = :isPrimary"
						+ ")) OR ("
						+ "\"personId\" = :loserId AND \"isPrimary\" != :isPrimary AND \"reportId\" IN ("
							+ "SELECT \"reportId\" FROM \"reportPeople\" WHERE \"personId\" = :winnerId AND \"isPrimary\" != :isPrimary"
						+ "))")
					.bind("winnerId", winner.getId())
					.bind("loserId", loser.getId())
					.bind("isPrimary", true)
					.execute();
				//update report attendance, should now be unique
				dbHandle.createStatement("UPDATE \"reportPeople\" SET \"personId\" = :winnerId WHERE \"personId\" = :loserId")
					.bind("winnerId", winner.getId())
					.bind("loserId", loser.getId())
					.execute();
				
				// update approvals this person might have done
				dbHandle.createStatement("UPDATE \"approvalActions\" SET \"personId\" = :winnerId WHERE \"personId\" = :loserId")
					.bind("winnerId", winner.getId())
					.bind("loserId", loser.getId())
					.execute();
				
				// report author update
				dbHandle.createStatement("UPDATE reports SET \"authorId\" = :winnerId WHERE \"authorId\" = :loserId")
					.bind("winnerId", winner.getId())
					.bind("loserId", loser.getId())
					.execute();
			
				// comment author update
				dbHandle.createStatement("UPDATE comments SET \"authorId\" = :winnerId WHERE \"authorId\" = :loserId")
					.bind("winnerId", winner.getId())
					.bind("loserId", loser.getId())
					.execute();
				
				// update position history
				dbHandle.createStatement("UPDATE \"peoplePositions\" SET \"personId\" = :winnerId WHERE \"personId\" = :loserId")
					.bind("winnerId", winner.getId())
					.bind("loserId", loser.getId())
					.execute();
		
				//delete the person!
				dbHandle.createStatement("DELETE FROM people WHERE id = :loserId")
					.bind("loserId", loser.getId())
					.execute();
				
				return null;
			}
		});
		return true;	
	}
	
}
