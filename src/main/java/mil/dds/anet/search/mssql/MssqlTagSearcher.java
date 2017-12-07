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
		if (text == null || text.trim().isEmpty()) {
			return result;
		}

		final Map<String,Object> sqlArgs = new HashMap<String,Object>();
		final StringBuilder sql = new StringBuilder(
				"/* MssqlTagSearch */ SELECT tags.*"
						+ ", count(*) over() as totalCount FROM tags"
						+ " LEFT JOIN CONTAINSTABLE (tags, (name, description), :containsQuery) c_tags"
						+ " ON tags.id = c_tags.[Key]"
						+ " LEFT JOIN FREETEXTTABLE(tags, (name, description), :freetextQuery) f_tags"
						+ " ON tags.id = f_tags.[Key]"
						+ " WHERE (c_tags.rank IS NOT NULL"
						+ " OR f_tags.rank IS NOT NULL)"
						+ " ORDER BY tags.name ASC, tags.id ASC");
		sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
		sqlArgs.put("freetextQuery", text);

		final Query<Tag> sqlQuery = MssqlSearcher.addPagination(query, dbHandle, sql, sqlArgs)
			.map(new TagMapper());
		return TagList.fromQuery(sqlQuery, query.getPageNum(), query.getPageSize());
	}

}
