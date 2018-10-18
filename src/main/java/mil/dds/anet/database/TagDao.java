package mil.dds.anet.database;

import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.GeneratedKeys;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.Query;
import org.skife.jdbi.v2.sqlobject.Bind;
import org.skife.jdbi.v2.sqlobject.customizers.RegisterMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterMapper(TagMapper.class)
public class TagDao implements IAnetDao<Tag> {

	private final Handle dbHandle;
	private final IdBatcher<Tag> idBatcher;

	public TagDao(Handle h) {
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getTagsByIds */ SELECT * from tags where id IN ( %1$s )";
		this.idBatcher = new IdBatcher<Tag>(h, idBatcherSql, new TagMapper());
	}

	public AnetBeanList<Tag> getAll(int pageNum, int pageSize) {
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
		return new AnetBeanList<Tag>(query, pageNum, pageSize, null);
	}

	@Override
	public Tag getById(@Bind("id") int id) {
		final Query<Tag> query = dbHandle.createQuery("/* getTagById */ SELECT * from tags where id = :id")
			.bind("id", id)
			.map(new TagMapper());
		final List<Tag> results = query.list();
		if (results.size() == 0) { return null; }
		return results.get(0);
	}

	@Override
	public List<Tag> getByIds(List<Integer> ids) {
		return idBatcher.getByIds(ids);
	}

	@Override
	public Tag insert(Tag t) {
		t.setCreatedAt(DateTime.now());
		t.setUpdatedAt(DateTime.now());
		final GeneratedKeys<Map<String,Object>> keys = dbHandle.createStatement(
				"/* tagInsert */ INSERT INTO tags (name, description, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:name, :description, :createdAt, :updatedAt)")
			.bind("name", t.getName())
				.bind("description", t.getDescription())
			.bind("createdAt", t.getCreatedAt())
			.bind("updatedAt", t.getUpdatedAt())
			.executeAndReturnGeneratedKeys();
		t.setId(DaoUtils.getGeneratedId(keys));
		return t;
	}

	@Override
	public int update(Tag t) {
		return dbHandle.createStatement("/* updateTag */ UPDATE tags "
					+ "SET name = :name, description = :description, \"updatedAt\" = :updatedAt WHERE id = :id")
				.bind("id", t.getId())
				.bind("name", t.getName())
				.bind("description", t.getDescription())
				.bind("updatedAt", DateTime.now())
				.execute();
	}

	public AnetBeanList<Tag> search(TagSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getTagSearcher().runSearch(query, dbHandle);
	}

}
