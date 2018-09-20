package mil.dds.anet.database;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

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
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;

public class OrganizationDao extends AnetBaseDao<Organization> {

	private static String[] fields = {"id", "shortName", "longName", "status", "identificationCode", "type", "createdAt", "updatedAt", "parentOrgId"};
	private static String tableName = "organizations";
	public static String ORGANIZATION_FIELDS = DaoUtils.buildFieldAliases(tableName, fields);

	private final IdBatcher<Organization> idBatcher;
	private final ForeignKeyBatcher<Organization> personIdBatcher;

	public OrganizationDao(Handle dbHandle) { 
		super(dbHandle, "Orgs", tableName, ORGANIZATION_FIELDS, null);
		final String idBatcherSql = "/* batch.getOrgsByIds */ SELECT " + ORGANIZATION_FIELDS + " from organizations where id IN ( %1$s )";
		this.idBatcher = new IdBatcher<Organization>(dbHandle, idBatcherSql, new OrganizationMapper());

		final String personIdBatcherSql = "/* batch.getOrganizationForPerson */ SELECT positions.\"currentPersonId\" AS \"personId\", " + ORGANIZATION_FIELDS
					+ "FROM organizations, positions WHERE "
					+ "positions.\"currentPersonId\" IN ( %1$s ) AND positions.\"organizationId\" = organizations.id";
		this.personIdBatcher = new ForeignKeyBatcher<Organization>(dbHandle, personIdBatcherSql, new OrganizationMapper(), "personId");
	}
	
	public AnetBeanList<Organization> getAll(int pageNum, int pageSize) {
		Query<Organization> query = getPagedQuery(pageNum, pageSize, new OrganizationMapper());
		Long manualRowCount = getSqliteRowCount();
		return new AnetBeanList<Organization>(query, pageNum, pageSize, manualRowCount);
	}
	
	public Organization getById(int id) { 
		Query<Organization> query = dbHandle.createQuery(
				"/* getOrgById */ SELECT " + ORGANIZATION_FIELDS + " from organizations where id = :id")
			.bind("id",id)
			.map(new OrganizationMapper());
		List<Organization> results = query.list();
		return (results.size() == 0) ? null : results.get(0);
	}

	@Override
	public List<Organization> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	public List<List<Organization>> getOrganizations(List<Integer> foreignKeys) {
		return personIdBatcher.getByForeignKeys(foreignKeys);
	}

	public CompletableFuture<List<Organization>> getOrganizationsForPerson(Map<String, Object> context, Integer personId) {
		return new ForeignKeyFetcher<Organization>()
				.load(context, "person.organizations", personId);
	}

	public List<Organization> getTopLevelOrgs(OrganizationType type) { 
		return dbHandle.createQuery("/* getTopLevelOrgs */ SELECT " + ORGANIZATION_FIELDS
				+ " FROM organizations "
				+ "WHERE \"parentOrgId\" IS NULL "
				+ "AND status = :status "
				+ "AND type = :type")
			.bind("status", DaoUtils.getEnumId(OrganizationStatus.ACTIVE))
			.bind("type", DaoUtils.getEnumId(type))
			.map(new OrganizationMapper())
			.list();
	}

	@UseStringTemplate3StatementLocator
	public interface OrgListQueries {
		@Mapper(OrganizationMapper.class)
		@SqlQuery("SELECT id AS organizations_id"
				+ ", \"shortName\" AS organizations_shortName"
				+ ", \"longName\" AS organizations_longName"
				+ ", status AS organizations_status"
				+ ", \"identificationCode\" AS organizations_identificationCode"
				+ ", type AS organizations_type"
				+ ", \"parentOrgId\" AS organizations_parentOrgId"
				+ ", \"createdAt\" AS organizations_createdAt"
				+ ", \"updatedAt\" AS organizations_updatedAt"
				+ " FROM organizations WHERE \"shortName\" IN ( <shortNames> )")
		public List<Organization> getOrgsByShortNames(@BindIn("shortNames") List<String> shortNames);
	}

	public List<Organization> getOrgsByShortNames(List<String> shortNames) {
		if (Utils.isEmptyOrNull(shortNames)) {
			return Collections.emptyList();
		}
		return dbHandle.attach(OrgListQueries.class).getOrgsByShortNames(shortNames);
	}

	public Organization insert(Organization org) {
		org.setCreatedAt(DateTime.now());
		org.setUpdatedAt(org.getCreatedAt());
		
		GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
				"/* insertOrg */ INSERT INTO organizations (\"shortName\", \"longName\", status, \"identificationCode\", type, \"createdAt\", \"updatedAt\", \"parentOrgId\") "
				+ "VALUES (:shortName, :longName, :status, :identificationCode, :type, :createdAt, :updatedAt, :parentOrgId)")
			.bindFromProperties(org)
			.bind("status", DaoUtils.getEnumId(org.getStatus()))
			.bind("type", DaoUtils.getEnumId(org.getType()))
			.bind("parentOrgId", DaoUtils.getId(org.getParentOrg()))
			.executeAndReturnGeneratedKeys();
		
		org.setId(DaoUtils.getGeneratedId(keys));
		return org;
	}
	
	public int update(Organization org) {
		org.setUpdatedAt(DateTime.now());
		int numRows = dbHandle.createStatement("/* updateOrg */ UPDATE organizations "
				+ "SET \"shortName\" = :shortName, \"longName\" = :longName, status = :status, \"identificationCode\" = :identificationCode, type = :type, "
				+ "\"updatedAt\" = :updatedAt, \"parentOrgId\" = :parentOrgId where id = :id")
				.bindFromProperties(org)
				.bind("status", DaoUtils.getEnumId(org.getStatus()))
				.bind("type", DaoUtils.getEnumId(org.getType()))
				.bind("parentOrgId", DaoUtils.getId(org.getParentOrg()))
				.execute();
			
		return numRows;
	}

	public AnetBeanList<Organization> search(OrganizationSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher().getOrganizationSearcher()
				.runSearch(query, dbHandle);
	}
}
