package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.SavedSearch;
import mil.dds.anet.beans.SavedSearch.SearchObjectType;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class SavedSearchMapper implements RowMapper<SavedSearch> {

  @Override
  public SavedSearch map(ResultSet rs, StatementContext ctx) throws SQLException {
    SavedSearch ss = new SavedSearch();
    MapperUtils.setCommonBeanFields(ss, rs, null);
    ss.setOwnerUuid(rs.getString("ownerUuid"));
    ss.setName(rs.getString("name"));
    ss.setObjectType(MapperUtils.getEnumIdx(rs, "objectType", SearchObjectType.class));
    ss.setQuery(rs.getString("query"));
    ss.setDisplayInHomepage(rs.getBoolean("displayInHomepage"));
    ss.setPriority(MapperUtils.getOptionalDouble(rs, "priority"));
    ss.setHomepagePriority(MapperUtils.getOptionalDouble(rs, "homepagePriority"));
    return ss;
  }

}
