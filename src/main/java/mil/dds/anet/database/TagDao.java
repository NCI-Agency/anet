package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.database.mappers.TagMapper;

public class TagDao extends AnetBaseDao<Tag, TagSearchQuery> {

  public static final String TABLE_NAME = "tags";

  @Override
  public Tag getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Tag> {
    private static final String sql =
        "/* batch.getTagsByUuids */ SELECT * from tags where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new TagMapper());
    }
  }

  @Override
  public List<Tag> getByIds(List<String> uuids) {
    final IdBatcher<Tag> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Tag insertInternal(Tag t) {
    throw new UnsupportedOperationException();
  }

  @Override
  public int updateInternal(Tag t) {
    throw new UnsupportedOperationException();
  }

  @Override
  public AnetBeanList<Tag> search(TagSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getTagSearcher().runSearch(query);
  }

}
