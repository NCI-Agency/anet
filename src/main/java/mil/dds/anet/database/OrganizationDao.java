package mil.dds.anet.database;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

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

	private static String[] fields = {"uuid", "shortName", "longName", "status", "identificationCode", "type", "createdAt", "updatedAt", "parentOrgUuid"};
	private static String tableName = "organizations";
	public static String ORGANIZATION_FIELDS = DaoUtils.buildFieldAliases(tableName, fields, true);
	
	private final IdBatcher<Organization> idBatcher;
	private final ForeignKeyBatcher<Organization> personIdBatcher;

	public OrganizationDao(Handle dbHandle) { 
		super(dbHandle, "Organizations", tableName, ORGANIZATION_FIELDS, null);
		final String idBatcherSql = "/* batch.getOrgsByUuids */ SELECT " + ORGANIZATION_FIELDS + " from organizations where uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Organization>(dbHandle, idBatcherSql, "uuids", new OrganizationMapper());

		final String personIdBatcherSql = "/* batch.getOrganizationForPerson */ SELECT positions.\"currentPersonUuid\" AS \"personUuid\", " + ORGANIZATION_FIELDS
					+ "FROM organizations, positions WHERE "
					+ "positions.\"currentPersonUuid\" IN ( <foreignKeys> ) AND positions.\"organizationUuid\" = organizations.uuid";
		this.personIdBatcher = new ForeignKeyBatcher<Organization>(dbHandle, personIdBatcherSql, "foreignKeys", new OrganizationMapper(), "personUuid");
	}
	
	public AnetBeanList<Organization> getAll(int pageNum, int pageSize) {
		final Query query = getPagedQuery(pageNum, pageSize);
		Long manualRowCount = getSqliteRowCount();
		return new AnetBeanList<Organization>(query, pageNum, pageSize, new OrganizationMapper(), manualRowCount);
	}

	public Organization getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Organization> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	public List<List<Organization>> getOrganizations(List<String> foreignKeys) {
		return personIdBatcher.getByForeignKeys(foreignKeys);
	}

	public CompletableFuture<List<Organization>> getOrganizationsForPerson(Map<String, Object> context, String personUuid) {
		return new ForeignKeyFetcher<Organization>()
				.load(context, "person.organizations", personUuid);
	}

	public List<Organization> getTopLevelOrgs(OrganizationType type) { 
		return dbHandle.createQuery("/* getTopLevelOrgs */ SELECT " + ORGANIZATION_FIELDS
				+ " FROM organizations "
				+ "WHERE \"parentOrgUuid\" IS NULL "
				+ "AND status = :status "
				+ "AND type = :type")
			.bind("status", DaoUtils.getEnumId(OrganizationStatus.ACTIVE))
			.bind("type", DaoUtils.getEnumId(type))
			.map(new OrganizationMapper())
			.list();
	}

	public interface OrgListQueries {
		@RegisterRowMapper(OrganizationMapper.class)
		@SqlQuery("SELECT uuid AS organizations_uuid"
				+ ", uuid AS uuid"
				+ ", \"shortName\" AS organizations_shortName"
				+ ", \"longName\" AS organizations_longName"
				+ ", status AS organizations_status"
				+ ", \"identificationCode\" AS organizations_identificationCode"
				+ ", type AS organizations_type"
				+ ", \"parentOrgUuid\" AS organizations_parentOrgUuid"
				+ ", \"createdAt\" AS organizations_createdAt"
				+ ", \"updatedAt\" AS organizations_updatedAt"
				+ " FROM organizations WHERE \"shortName\" IN ( <shortNames> )")
		public List<Organization> getOrgsByShortNames(@BindList("shortNames") List<String> shortNames);
	}

	public List<Organization> getOrgsByShortNames(List<String> shortNames) {
		if (Utils.isEmptyOrNull(shortNames)) {
			return Collections.emptyList();
		}
		return dbHandle.attach(OrgListQueries.class).getOrgsByShortNames(shortNames);
	}

	@Override
	public Organization insertInternal(Organization org) {
		dbHandle.createUpdate(
				"/* insertOrg */ INSERT INTO organizations (uuid, \"shortName\", \"longName\", status, \"identificationCode\", type, \"createdAt\", \"updatedAt\", \"parentOrgUuid\") "
				+ "VALUES (:uuid, :shortName, :longName, :status, :identificationCode, :type, :createdAt, :updatedAt, :parentOrgUuid)")
			.bindBean(org)
			.bind("createdAt", DaoUtils.asLocalDateTime(org.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(org.getUpdatedAt()))
			.bind("status", DaoUtils.getEnumId(org.getStatus()))
			.bind("type", DaoUtils.getEnumId(org.getType()))
			.bind("parentOrgUuid", DaoUtils.getUuid(org.getParentOrg()))
			.execute();
		return org;
	}

	@Override
	public int updateInternal(Organization org) {
		return dbHandle.createUpdate("/* updateOrg */ UPDATE organizations "
				+ "SET \"shortName\" = :shortName, \"longName\" = :longName, status = :status, \"identificationCode\" = :identificationCode, type = :type, "
				+ "\"updatedAt\" = :updatedAt, \"parentOrgUuid\" = :parentOrgUuid where uuid = :uuid")
				.bindBean(org)
				.bind("updatedAt", DaoUtils.asLocalDateTime(org.getUpdatedAt()))
				.bind("status", DaoUtils.getEnumId(org.getStatus()))
				.bind("type", DaoUtils.getEnumId(org.getType()))
				.bind("parentOrgUuid", DaoUtils.getUuid(org.getParentOrg()))
				.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		throw new UnsupportedOperationException();
	}

	public AnetBeanList<Organization> search(OrganizationSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher().getOrganizationSearcher()
				.runSearch(query, dbHandle);
	}
}
