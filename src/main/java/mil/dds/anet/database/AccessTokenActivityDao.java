package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.AccessTokenActivity;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.mappers.AccessTokenActivityMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AccessTokenActivityDao extends AbstractDao {

  public static final String TABLE_NAME = "accessTokenActivities";

  private final AnetDictionary dict;

  public AccessTokenActivityDao(DatabaseHandler databaseHandler, AnetDictionary dict) {
    super(databaseHandler);
    this.dict = dict;
  }

  @Transactional
  public int insert(final AccessTokenActivity accessTokenActivity) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("INSERT INTO \"" + TABLE_NAME
              + "\" (\"accessTokenUuid\", \"visitedAt\", \"remoteAddress\") "
              + "VALUES (:accessTokenUuid, :visitedAt, :remoteAddress) ON CONFLICT DO NOTHING")
          .bindBean(accessTokenActivity)
          .bind("visitedAt", DaoUtils.asLocalDateTime(accessTokenActivity.getVisitedAt()))
          .execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<AccessTokenActivity>> getAccessTokenActivities(
      GraphQLContext context, String accessTokenUuid) {
    return new ForeignKeyFetcher<AccessTokenActivity>().load(context,
        FkDataLoaderKey.ACCESS_TOKEN_ACTIVITY_ACCESS_TOKEN, accessTokenUuid);
  }

  class AccessTokenActivityBatcher extends ForeignKeyBatcher<AccessTokenActivity> {
    private static final String SQL = "/* batch.getAccessTokenActivity */ WITH ata AS ("
        + "SELECT *,"
        + " ROW_NUMBER() OVER (PARTITION BY \"accessTokenUuid\" ORDER BY \"visitedAt\" DESC) AS rn"
        + " FROM \"" + TABLE_NAME + "\""
        + ") SELECT * FROM ata WHERE \"accessTokenUuid\" IN ( <foreignKeys> ) AND rn <= %d";

    public AccessTokenActivityBatcher() {
      super(AccessTokenActivityDao.this.databaseHandler,
          String.format(SQL, (Integer) dict.getDictionaryEntry("maxShownAccessTokenActivities")),
          "foreignKeys", new AccessTokenActivityMapper(), "accessTokenUuid");
    }
  }

  public List<List<AccessTokenActivity>> getAccessTokenActivity(List<String> foreignKeys) {
    return new AccessTokenActivityBatcher().getByForeignKeys(foreignKeys);
  }
}
