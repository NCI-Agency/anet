package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.User;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.UserMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UserDao extends AnetBaseDao<User, AbstractSearchQuery<?>> {
  public static final String[] fields =
      {"uuid", "domainUsername", "personUuid", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "users";
  public static final String USER_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);
  private static final String DUPLICATE_USER_DOMAIN_USERNAME =
      "Another user is already using domain username \"%s\".";

  public UserDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public User getByUuid(String uuid) {
    throw new UnsupportedOperationException();
  }

  @Override
  public List<User> getByIds(List<String> uuids) {
    throw new UnsupportedOperationException();
  }

  @Transactional
  public User insertInternal(User u) {
    final Handle handle = getDbHandle();
    try {
      final String sql =
          "/* userInsert */ INSERT INTO users (uuid, \"domainUsername\", \"personUuid\", "
              + "\"createdAt\", \"updatedAt\") "
              + "VALUES (:uuid, :domainUsername, :personUuid, :createdAt, :updatedAt)";
      handle.createUpdate(sql).bindBean(u)
          .bind("createdAt", DaoUtils.asLocalDateTime(u.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(u.getUpdatedAt())).execute();
      return u;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e,
          String.format(DUPLICATE_USER_DOMAIN_USERNAME, u.getDomainUsername()));
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int updateInternal(User u) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateUser */ UPDATE users "
              + "SET \"domainUsername\" = :domainUsername, \"personUuid\" = :personUuid, "
              + "\"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(u).bind("updatedAt", DaoUtils.asLocalDateTime(u.getUpdatedAt())).execute();
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e,
          String.format(DUPLICATE_USER_DOMAIN_USERNAME, u.getDomainUsername()));
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int deleteInternal(String uuid) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* deleteUser */ DELETE FROM users WHERE uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void updateUsers(Person person, List<User> users) {
    final Person existing = engine().getPersonDao().getByUuid(person.getUuid());
    Utils.updateElementsByUuid(existing.loadUsers(engine().getContext()).join(),
        Utils.orIfNull(users, List.of()),
        // Create new user:
        newUser -> {
          if (!Utils.isEmptyOrNull(newUser.getDomainUsername())) {
            newUser.setPersonUuid(person.getUuid());
            insert(newUser);
          }
        },
        // Delete old user:
        oldUser -> delete(DaoUtils.getUuid(oldUser)),
        // Update existing user:
        updatedUser -> {
          if (Utils.isEmptyOrNull(updatedUser.getDomainUsername())) {
            delete(DaoUtils.getUuid(updatedUser));
          } else {
            updatedUser.setPersonUuid(person.getUuid());
            update(updatedUser);
          }
        });
  }

  public CompletableFuture<List<User>> getUsersForPerson(GraphQLContext context,
      String personUuid) {
    return new ForeignKeyFetcher<User>().load(context, FkDataLoaderKey.USER_PERSON, personUuid);
  }

  class UsersBatcher extends ForeignKeyBatcher<User> {
    private static final String SQL = "/* batch.getUsersForPerson */ SELECT " + USER_FIELDS
        + "FROM users WHERE users.\"personUuid\" IN ( <foreignKeys> ) ORDER BY \"domainUsername\"";

    public UsersBatcher() {
      super(UserDao.this.databaseHandler, SQL, "foreignKeys", new UserMapper(), "users_personUuid");
    }
  }

  public List<List<User>> getUsers(List<String> foreignKeys) {
    return new UserDao.UsersBatcher().getByForeignKeys(foreignKeys);
  }
}
