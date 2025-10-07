package mil.dds.anet.database;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPreference;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PersonPreferenceDao extends AbstractDao {

  public PersonPreferenceDao(final DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  /**
   * Inserts or updates personPreference in the database
   *
   * @param user the user updating their preferences
   * @param personPreference the personPreference
   * @return number of rows inserted/updated
   */
  @Transactional
  public int upsert(Person user, final PersonPreference personPreference) {
    final Handle handle = getDbHandle();
    try {
      DaoUtils.setInsertFields(personPreference);
      return handle
          .createUpdate("/* upsertPersonPreference */ INSERT INTO \"peoplePreferences\" "
              + "(\"preferenceUuid\", \"personUuid\", value, \"createdAt\", \"updatedAt\") "
              + "VALUES (:preferenceUuid, :personUuid, :value, :createdAt, :updatedAt) "
              + "ON CONFLICT (\"preferenceUuid\", \"personUuid\") DO "
              + "UPDATE SET value = :value, \"updatedAt\" = :updatedAt")
          .bindBean(personPreference)
          .bind("createdAt", DaoUtils.asLocalDateTime(personPreference.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(personPreference.getUpdatedAt()))
          .bind("personUuid", DaoUtils.getUuid(user)).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

}
