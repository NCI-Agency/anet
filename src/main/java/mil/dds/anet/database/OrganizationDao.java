package mil.dds.anet.database;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.SqlQuery;
import org.skife.jdbi.v2.sqlobject.customizers.Mapper;
import org.skife.jdbi.v2.sqlobject.stringtemplate.UseStringTemplate3StatementLocator;
import org.skife.jdbi.v2.unstable.BindIn;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.OrganizationList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.utils.DaoUtils;

public class OrganizationDao implements IAnetDao<Organization> {

	private static String[] fields = {"id", "shortName", "longName", "identificationCode", "type", "createdAt", "updatedAt", "parentOrgId"};
	private static String tableName = "organizations";
	public static String ORGANIZATION_FIELDS = DaoUtils.buildFieldAliases(tableName, fields);
	
	Handle dbHandle;
	
	public OrganizationDao(Handle dbHandle) { 
		this.dbHandle = dbHandle;
	}
	
	public OrganizationList getAll(int pageNum, int pageSize) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) { 
			sql = "/* getAllOrgs */ SELECT " + ORGANIZATION_FIELDS + ", count(*) over() AS totalCount "
					+ "FROM organizations ORDER BY createdAt ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else { 
			sql = "/* getAllOrgs */ SELECT " + ORGANIZATION_FIELDS + " from organizations ORDER BY createdAt ASC LIMIT :limit OFFSET :offset";
		}
		
		Query<Organization> query = dbHandle.createQuery(sql)
			.bind("limit", pageSize)
			.bind("offset", pageSize * pageNum)
			.map(new OrganizationMapper());
		return OrganizationList.fromQuery(query, pageNum, pageSize);
	}
	
	public Organization getById(int id) { 
		Query<Organization> query = dbHandle.createQuery(
				"/* getOrgById */ SELECT " + ORGANIZATION_FIELDS + " from organizations where id = :id")
			.bind("id",id)
			.map(new OrganizationMapper());
		List<Organization> results = query.list();
		return (results.size() == 0) ? null : results.get(0);
	}
	
	public List<Organization> getTopLevelOrgs(OrganizationType type) { 
		return dbHandle.createQuery("/* getTopLevelOrgs */ SELECT " + ORGANIZATION_FIELDS
				+ " FROM organizations "
				+ "WHERE parentOrgId IS NULL "
				+ "AND type = :type")
			.bind("type", DaoUtils.getEnumId(type))
			.map(new OrganizationMapper())
			.list();
	}

	@UseStringTemplate3StatementLocator
	public interface OrgListQueries {
		@Mapper(OrganizationMapper.class)
		@SqlQuery("SELECT id AS organizations_id" +
				", shortName AS organizations_shortName" +
				", longName AS organizations_longName" +
				", identificationCode AS organizations_identificationCode" +
				", type AS organizations_type" +
				", parentOrgId AS organizations_parentOrgId" +
				", createdAt AS organizations_createdAt" +
				", updatedAt AS organizations_updatedAt" +
				" FROM organizations WHERE shortName IN ( <shortNames> )")
		public List<Organization> getOrgsByShortNames(@BindIn("shortNames") List<String> shortNames);
	}

	public List<Organization> getOrgsByShortNames(List<String> shortNames) {
		if (shortNames == null || shortNames.isEmpty()) {
			return Collections.emptyList();
		}
		return dbHandle.attach(OrgListQueries.class).getOrgsByShortNames(shortNames);
	}

	public Organization insert(Organization org) {
		org.setCreatedAt(DateTime.now());
		org.setUpdatedAt(org.getCreatedAt());
		
		GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
				"/* insertOrg */ INSERT INTO organizations (shortName, longName, identificationCode, type, createdAt, updatedAt, parentOrgId) "
				+ "VALUES (:shortName, :longName, :identificationCode, :type, :createdAt, :updatedAt, :parentOrgId)")
			.bindFromProperties(org)
			.bind("type", DaoUtils.getEnumId(org.getType()))
			.bind("parentOrgId", DaoUtils.getId(org.getParentOrg()))
			.executeAndReturnGeneratedKeys();
		
		org.setId(DaoUtils.getGeneratedId(keys));
		return org;
	}
	
	public int update(Organization org) {
		org.setUpdatedAt(DateTime.now());
		int numRows = dbHandle.createStatement("/* updateOrg */ UPDATE organizations "
				+ "SET shortName = :shortName, longName = :longName, identificationCode = :identificationCode, type = :type, "
				+ "updatedAt = :updatedAt, parentOrgid = :parentOrgId where id = :id")
				.bindFromProperties(org)
				.bind("type", DaoUtils.getEnumId(org.getType()))
				.bind("parentOrgId", DaoUtils.getId(org.getParentOrg()))
				.execute();
			
		return numRows;
	}

	public OrganizationList search(OrganizationSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher().getOrganizationSearcher()
				.runSearch(query, dbHandle);
	} 
}
