package mil.dds.anet.database;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.TagList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(TagMapper.class)
public class TagDao implements IAnetDao<Tag> {

	private Handle dbHandle;

	public TagDao(Handle h) {
		this.dbHandle = h;
	}

	public TagList getAll(int pageNum, int pageSize) {
		String sql;
		if (DaoUtils.isMsSql(dbHandle)) {
			sql = "/* getAllTags */ SELECT tags.*, COUNT(*) OVER() AS totalCount "
					+ "FROM tags ORDER BY name ASC "
					+ "OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY";
		} else {
			sql = "/* getAllTags */ SELECT * from tags "
					+ "ORDER BY name ASC LIMIT :limit OFFSET :offset";
		}

		final Query<Tag> query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum)
				.map(new TagMapper());
		return TagList.fromQuery(query, pageNum, pageSize);
	}

	public Tag getByUuid(String uuid) {
		return dbHandle.createQuery("/* getTagByUuid */ SELECT * from tags where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new TagMapper())
				.first();
	}

	public Tag insert(Tag t) {
		DaoUtils.setInsertFields(t);
		dbHandle.createStatement(
				"/* tagInsert */ INSERT INTO tags (uuid, name, description, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :description, :createdAt, :updatedAt)")
			.bindFromProperties(t)
			.execute();
		return t;
	}

	public int update(Tag t) {
		DaoUtils.setUpdateFields(t);
		return dbHandle.createStatement("/* updateTag */ UPDATE tags "
					+ "SET name = :name, description = :description, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindFromProperties(t)
				.execute();
	}

	public TagList search(TagSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getTagSearcher().runSearch(query, dbHandle);
	}

}
