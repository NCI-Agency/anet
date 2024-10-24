package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.mappers.EmailAddressMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EmailAddressDao {

  public static final String[] fields =
      {"network", "address", "relatedObjectType", "relatedObjectUuid"};
  public static final String TABLE_NAME = "emailAddresses";
  public static final String EMAIL_ADDRESS_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, false);

  protected final DatabaseHandler databaseHandler;

  public EmailAddressDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  class EmailAddressesForRelatedObjectsBatcher extends ForeignKeyBatcher<EmailAddress> {
    private static final String SQL =
        "/* batch.getEmailAddressesForRelatedObject */ SELECT " + EMAIL_ADDRESS_FIELDS
            + "FROM \"emailAddresses\"" + " WHERE \"relatedObjectUuid\" IN ( <foreignKeys> )"
            + " ORDER BY \"relatedObjectType\", \"relatedObjectUuid\", \"network\", \"address\"";

    public EmailAddressesForRelatedObjectsBatcher() {
      super(databaseHandler, SQL, "foreignKeys", new EmailAddressMapper(), "relatedObjectUuid");
    }
  }

  public List<List<EmailAddress>> getEmailAddressesForRelatedObjects(List<String> foreignKeys) {
    return new EmailAddressesForRelatedObjectsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<EmailAddress>> getEmailAddressesForRelatedObject(
      GraphQLContext context, String relatedObjectUuid) {
    return new ForeignKeyFetcher<EmailAddress>().load(context,
        FkDataLoaderKey.EMAIL_ADDRESSES_FOR_RELATED_OBJECT, relatedObjectUuid);
  }

  public interface EmailAddressBatch {
    @SqlBatch("INSERT INTO \"emailAddresses\""
        + " (\"relatedObjectType\", \"relatedObjectUuid\", network, address)"
        + " VALUES (:relatedObjectType, :relatedObjectUuid, :network, :address)")
    void insertEmailAddresses(@Bind("relatedObjectType") String relatedObjectType,
        @Bind("relatedObjectUuid") String relatedObjectUuid,
        @BindBean List<EmailAddress> emailAddresses);

    @SqlUpdate("DELETE FROM \"emailAddresses\""
        + " WHERE \"relatedObjectType\" = :relatedObjectType"
        + " AND \"relatedObjectUuid\" = :relatedObjectUuid")
    void deleteEmailAddresses(@Bind("relatedObjectType") String relatedObjectType,
        @Bind("relatedObjectUuid") String relatedObjectUuid);
  }

  @Transactional
  public void updateEmailAddresses(String relatedObjectType, String relatedObjectUuid,
      List<EmailAddress> emailAddresses) {
    final Handle handle = getDbHandle();
    try {
      final EmailAddressBatch eab = handle.attach(EmailAddressBatch.class);
      // delete original emailAddresses
      eab.deleteEmailAddresses(relatedObjectType, relatedObjectUuid);
      if (emailAddresses != null) {
        // trim spaces
        emailAddresses.forEach(e -> e.setAddress(Utils.trimStringReturnNull(e.getAddress())));
        // filter on allowed networks and non-empty addresses
        @SuppressWarnings("unchecked")
        final List<String> emailNetworks = (List<String>) ApplicationContextProvider.getDictionary()
            .getDictionaryEntry("emailNetworks");
        final List<EmailAddress> filteredEmailAddresses = emailAddresses.stream()
            .filter(
                e -> emailNetworks.contains(e.getNetwork()) && !Utils.isEmptyOrNull(e.getAddress()))
            .toList();
        // insert new emailAddresses
        eab.insertEmailAddresses(relatedObjectType, relatedObjectUuid, filteredEmailAddresses);
      }
    } finally {
      closeDbHandle(handle);
    }
  }
}
