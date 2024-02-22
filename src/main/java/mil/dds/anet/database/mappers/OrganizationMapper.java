package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Organization;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class OrganizationMapper implements RowMapper<Organization> {

  @Override
  public Organization map(ResultSet r, StatementContext ctx) throws SQLException {
    Organization org = new Organization();
    MapperUtils.setCustomizableBeanFields(org, r, "organizations");
    org.setShortName(r.getString("organizations_shortName"));
    org.setLongName(r.getString("organizations_longName"));
    org.setStatus(MapperUtils.getEnumIdx(r, "organizations_status", Organization.Status.class));
    org.setIdentificationCode(r.getString("organizations_identificationCode"));
    org.setProfile(MapperUtils.getOptionalString(r, "organizations_profile"));
    org.setParentOrgUuid(r.getString("organizations_parentOrgUuid"));
    org.setLocationUuid(r.getString("organizations_locationUuid"));

    if (MapperUtils.containsColumnNamed(r, "totalCount")) {
      ctx.define("totalCount", r.getInt("totalCount"));
    }

    return org;
  }

}
