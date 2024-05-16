package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class PersonMapper implements RowMapper<Person> {

  @Override
  public Person map(ResultSet rs, StatementContext ctx) throws SQLException {
    Person p = fillInFields(new Person(), rs);

    if (MapperUtils.containsColumnNamed(rs, "positions_uuid")) {
      p.setPosition(PositionMapper.fillInFields(new Position(), rs));
    }

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }
    return p;
  }

  public static <T extends Person> T fillInFields(T a, ResultSet rs) throws SQLException {
    // This hits when we do a join but there's no Person record.
    if (rs.getObject("people_uuid") == null) {
      return null;
    }
    MapperUtils.setCustomizableBeanFields(a, rs, "people");
    a.setName(MapperUtils.getOptionalString(rs, "people_name"));
    a.setStatus(MapperUtils.getEnumIdx(rs, "people_status", Person.Status.class));
    a.setUser(MapperUtils.getOptionalBoolean(rs, "people_user"));
    a.setAvatarUuid(MapperUtils.getOptionalString(rs, "people_avatarUuid"));
    a.setPhoneNumber(MapperUtils.getOptionalString(rs, "people_phoneNumber"));
    a.setObsoleteCountry(MapperUtils.getOptionalString(rs, "people_obsoleteCountry"));
    a.setCountryUuid(MapperUtils.getOptionalString(rs, "people_countryUuid"));
    a.setGender(MapperUtils.getOptionalString(rs, "people_gender"));
    a.setCode(MapperUtils.getOptionalString(rs, "people_code"));
    a.setEndOfTourDate(MapperUtils.getInstantAsLocalDateTime(rs, "people_endOfTourDate"));
    a.setRank(MapperUtils.getOptionalString(rs, "people_rank"));
    a.setBiography(MapperUtils.getOptionalString(rs, "people_biography"));
    a.setDomainUsername(MapperUtils.getOptionalString(rs, "people_domainUsername"));
    a.setOpenIdSubject(MapperUtils.getOptionalString(rs, "people_openIdSubject"));
    a.setPendingVerification(MapperUtils.getOptionalBoolean(rs, "people_pendingVerification"));

    return a;
  }
}
