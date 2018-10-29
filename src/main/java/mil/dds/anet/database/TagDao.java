package mil.dds.anet.database;

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
public class TagDao implements IAnetDao<Tag> {

	private final Handle dbHandle;
	private final IdBatcher<Tag> idBatcher;

	public TagDao(Handle h) {
		this.dbHandle = h;
		final String idBatcherSql = "/* batch.getTagsByUuids */ SELECT * from tags where uuid IN ( %1$s )";
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

		final Query query = dbHandle.createQuery(sql)
				.bind("limit", pageSize)
				.bind("offset", pageSize * pageNum);
		return new AnetBeanList<Tag>(query, pageNum, pageSize, new TagMapper(), null);
	}

	public Tag getByUuid(String uuid) {
		return dbHandle.createQuery("/* getTagByUuid */ SELECT * from tags where uuid = :uuid")
				.bind("uuid", uuid)
				.map(new TagMapper())
				.findFirst().orElse(null);
	}

	@Override
	public List<Tag> getByIds(List<String> uuids) {
		return idBatcher.getByIds(uuids);
	}

	@Override
	public Tag insert(Tag t) {
		DaoUtils.setInsertFields(t);
		dbHandle.createUpdate(
				"/* tagInsert */ INSERT INTO tags (uuid, name, description, \"createdAt\", \"updatedAt\") "
					+ "VALUES (:uuid, :name, :description, :createdAt, :updatedAt)")
			.bindBean(t)
			.execute();
		return t;
	}

	public int update(Tag t) {
		DaoUtils.setUpdateFields(t);
		return dbHandle.createUpdate("/* updateTag */ UPDATE tags "
					+ "SET name = :name, description = :description, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
				.bindBean(t)
				.execute();
	}

	public AnetBeanList<Tag> search(TagSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher()
				.getTagSearcher().runSearch(query, dbHandle);
	}

}
