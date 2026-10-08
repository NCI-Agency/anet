package mil.dds.anet.database.mappers;

import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PhoneNumber;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.User;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

public class PersonMapper implements RowMapper<Person> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final ObjectMapper mapper = MapperUtils.getDefaultMapper();
  private static final TypeReference<List<PhoneNumber>> PHONE_NUMBER_LIST_TYPE =
      new TypeReference<>() {};

  @Override
  public Person map(ResultSet rs, StatementContext ctx) throws SQLException {
    Person p = fillInFields(new Person(), rs);

    if (MapperUtils.containsColumnNamed(rs, "positions_uuid")) {
      p.setPosition(PositionMapper.fillInFields(new Position(), rs));
    }

    if (MapperUtils.containsColumnNamed(rs, "users_uuid")) {
      p.setUsers(List.of(UserMapper.fillInFields(new User(), rs)));
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
    a.setFamilyName(MapperUtils.getOptionalString(rs, "people_familyName"));
    a.setGivenName(MapperUtils.getOptionalString(rs, "people_givenName"));
    a.setStatus(MapperUtils.getEnumIdx(rs, "people_status", Person.Status.class));
    a.setUser(MapperUtils.getOptionalBoolean(rs, "people_user"));
    a.setPhoneNumber(getPhoneNumbers(MapperUtils.getOptionalString(rs, "people_phoneNumber")));
    a.setObsoleteCountry(MapperUtils.getOptionalString(rs, "people_obsoleteCountry"));
    a.setCountryUuid(MapperUtils.getOptionalString(rs, "people_countryUuid"));
    a.setGender(MapperUtils.getOptionalString(rs, "people_gender"));
    a.setCode(MapperUtils.getOptionalString(rs, "people_code"));
    a.setEndOfTourDate(MapperUtils.getInstantAsLocalDateTime(rs, "people_endOfTourDate"));
    a.setRank(MapperUtils.getOptionalString(rs, "people_rank"));
    a.setBiography(MapperUtils.getOptionalString(rs, "people_biography"));
    a.setPendingVerification(MapperUtils.getOptionalBoolean(rs, "people_pendingVerification"));

    return a;
  }

  public static String getPhoneNumberJson(List<PhoneNumber> phoneNumbers) {
    if (Utils.isEmptyOrNull(phoneNumbers)) {
      return null;
    }
    try {
      return mapper.writeValueAsString(phoneNumbers);
    } catch (JacksonException e) {
      logger.error("Error mapping phone numbers", e);
      return null;
    }
  }

  public static List<PhoneNumber> getPhoneNumbers(String json) {
    if (Utils.isEmptyOrNull(json)) {
      return null;
    }
    try {
      return mapper.readValue(json, PHONE_NUMBER_LIST_TYPE);
    } catch (JacksonException e) {
      logger.error("Error mapping phone numbers", e);
      return null;
    }
  }
}
