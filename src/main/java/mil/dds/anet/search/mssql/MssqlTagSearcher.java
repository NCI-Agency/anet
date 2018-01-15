package mil.dds.anet.search.mssql;

import java.util.HashMap;
import java.util.Map;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TagList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlTagSearcher implements ITagSearcher {

	@Override
	public TagList runSearch(TagSearchQuery query, Handle dbHandle) {
		final TagList result = new TagList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		final String text = query.getText();
		if (text == null || text.trim().length() == 0) {
			return result;
		}

		final StringBuilder sql = new StringBuilder(
				"/* MssqlTagSearch */ SELECT *, count(*) over() as totalCount "
						+ "FROM tags "
						+ "WHERE CONTAINS((name, description), :containsQuery) "
						+ "OR FREETEXT((name, description), :freetextQuery) "
						+ "ORDER BY name ASC, id ASC");
		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
		sqlArgs.put("freetextQuery", text);

		final Query<Tag> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new TagMapper());
		return TagList.fromQuery(sqlQuery, query.getPageNum(), query.getPageSize());
	}

}
