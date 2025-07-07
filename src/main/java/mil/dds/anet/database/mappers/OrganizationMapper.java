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
    org.setApp6context(MapperUtils.getOptionalString(r, "organizations_app6context"));
    org.setApp6standardIdentity(
        MapperUtils.getOptionalString(r, "organizations_app6standardIdentity"));
    org.setApp6symbolSet(MapperUtils.getOptionalString(r, "organizations_app6symbolSet"));
    org.setApp6hq(MapperUtils.getOptionalString(r, "organizations_app6hq"));
    org.setApp6amplifier(MapperUtils.getOptionalString(r, "organizations_app6amplifier"));
    org.setApp6entity(MapperUtils.getOptionalString(r, "organizations_app6entity"));
    org.setApp6entityType(MapperUtils.getOptionalString(r, "organizations_app6entityType"));
    org.setApp6entitySubtype(MapperUtils.getOptionalString(r, "organizations_app6entitySubtype"));
    org.setApp6sectorOneModifier(
        MapperUtils.getOptionalString(r, "organizations_app6sectorOneModifier"));
    org.setApp6sectorTwoModifier(
        MapperUtils.getOptionalString(r, "organizations_app6sectorTwoModifier"));
    org.setParentOrgUuid(r.getString("organizations_parentOrgUuid"));
    org.setLocationUuid(r.getString("organizations_locationUuid"));

    if (MapperUtils.containsColumnNamed(r, "totalCount")) {
      ctx.define("totalCount", r.getInt("totalCount"));
    }

    return org;
  }

}
