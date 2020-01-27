package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class OrganizationMapper implements RowMapper<Organization> {

  @Override
  public Organization map(ResultSet r, StatementContext ctx) throws SQLException {
    Organization org = new Organization();
    MapperUtils.setCommonBeanFields(org, r, "organizations");
    org.setShortName(r.getString("organizations_shortName"));
    org.setLongName(r.getString("organizations_longName"));
    org.setStatus(MapperUtils.getEnumIdx(r, "organizations_status", OrganizationStatus.class));
    org.setIdentificationCode(r.getString("organizations_identificationCode"));
    org.setType(MapperUtils.getEnumIdx(r, "organizations_type", OrganizationType.class));
    org.setParentOrgUuid(r.getString("organizations_parentOrgUuid"));

    if (MapperUtils.containsColumnNamed(r, "totalCount")) {
      ctx.define("totalCount", r.getInt("totalCount"));
    }

    return org;
  }


}
