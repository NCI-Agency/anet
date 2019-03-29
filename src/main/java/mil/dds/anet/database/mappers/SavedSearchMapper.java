package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.beans.search.SavedSearch.SearchObjectType;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class SavedSearchMapper implements RowMapper<SavedSearch> {

  @Override
  public SavedSearch map(ResultSet rs, StatementContext ctx) throws SQLException {
    SavedSearch ss = new SavedSearch();
    DaoUtils.setCommonBeanFields(ss, rs, null);
    ss.setOwnerUuid(rs.getString("ownerUuid"));
    ss.setName(rs.getString("name"));
    ss.setObjectType(MapperUtils.getEnumIdx(rs, "objectType", SearchObjectType.class));
    ss.setQuery(rs.getString("query"));
    return ss;
  }

}
