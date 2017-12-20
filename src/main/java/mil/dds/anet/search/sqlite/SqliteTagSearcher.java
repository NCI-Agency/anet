package mil.dds.anet.search.sqlite;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.lists.AbstractAnetBeanList.TagList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteTagSearcher implements ITagSearcher {

	@Override
	public TagList runSearch(TagSearchQuery query, Handle dbHandle) {
		final TagList result = new TagList();
		result.setPageNum(query.getPageNum());
		result.setPageSize(query.getPageSize());
		final String text = query.getText();
		if (text == null || text.trim().length() == 0) {
			return result;
		}

		result.setList(dbHandle.createQuery("/* SqliteTagSearch */ SELECT * FROM tags "
				+ "WHERE name LIKE '%' || :text || '%' "
				+ "OR description LIKE '%' || :text || '%' "
				+ "ORDER BY name ASC LIMIT :limit OFFSET :offset")
			.bind("text", Utils.getSqliteFullTextQuery(text))
			.bind("offset", query.getPageSize() * query.getPageNum())
			.bind("limit", query.getPageSize())
			.map(new TagMapper())
			.list());
		result.setTotalCount(result.getList().size()); // Sqlite cannot do true total counts, so this is a crutch.
		return result;
	}

}
