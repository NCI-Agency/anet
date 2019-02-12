package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.Query;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;
import mil.dds.anet.utils.DaoUtils;

@RegisterRowMapper(TagMapper.class)
public class TagDao extends AnetBaseDao<Tag> {

	private final IdBatcher<Tag> idBatcher;

	public TagDao(Handle h) {
		super(h, "Tags", "tags", "*", null);
		final String idBatcherSql = "/* batch.getTagsByUuids */ SELECT * from tags where uuid IN ( <uuids> )";
		this.idBatcher = new IdBatcher<Tag>(h, idBatcherSql, "uuids", new TagMapper());
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

		final Query query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Tag>(query, pageNum, pageSize, new TagMapper(), null);
	}

	public Tag getByUuid(String uuid) {
		return getByIds(Arrays.asList(uuid)).get(0);
	}

	@Override
	public List<Tag> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Tag insertInternal(Tag t) {
		dbHandle.createUpdate(
				"/* tagInsert */ INSERT INTO tags (uuid, name, description, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :description, :createdAt, :updatedAt)")
			.bindBean(t)
			.bind("createdAt", DaoUtils.asLocalDateTime(t.getCreatedAt()))
			.bind("updatedAt", DaoUtils.asLocalDateTime(t.getUpdatedAt()))
			.execute();
		return t;
	}

	@Override
	public int updateInternal(Tag t) {
		return dbHandle.createUpdate("/* updateTag */ UPDATE tags "
					+ "SET name = :name, description = :description, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(t)
				.bind("updatedAt", DaoUtils.asLocalDateTime(t.getUpdatedAt()))
				.execute();
	}

	@Override
	public int deleteInternal(String uuid) {
		throw new UnsupportedOperationException();
	}

	public AnetBeanList<Tag> search(TagSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getTagSearcher().runSearch(query, dbHandle);
	}

}
