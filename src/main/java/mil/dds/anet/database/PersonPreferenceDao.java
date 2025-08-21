package mil.dds.anet.database;

import mil.dds.anet.beans.PersonPreference;
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
   * @param personPreference the personPreference
   * @return number of rows inserted/updated
   */
  @Transactional
  public int upsert(final PersonPreference personPreference) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* upsertPersonPreference */ INSERT INTO \"peoplePreferences\" "
          + "(\"preferenceUuid\", \"personUuid\", value, \"createdAt\", " + "\"updatedAt\") "
          + "VALUES (:preferenceUuid, :personUuid, :value, :createdAt, " + ":updatedAt) "
          + "ON CONFLICT (\"preferenceUuid\", \"personUuid\") DO UPDATE " + "SET value = :value")
          .bindBean(personPreference).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

}
