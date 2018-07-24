package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.SavedSearch;
import mil.dds.anet.beans.search.SavedSearch.SearchObjectType;
import mil.dds.anet.utils.DaoUtils;

public class SavedSearchMapper implements ResultSetMapper<SavedSearch> {

	@Override
	public SavedSearch map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		SavedSearch ss = new SavedSearch();
		DaoUtils.setCommonBeanFields(ss, rs, null);
		ss.setOwner(Person.createWithUuid(rs.getString("ownerUuid")));
		ss.setName(rs.getString("name"));
		ss.setObjectType(MapperUtils.getEnumIdx(rs, "objectType", SearchObjectType.class));
		ss.setQuery(rs.getString("query"));
		return ss;
	}

}