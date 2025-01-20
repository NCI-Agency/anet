package mil.dds.anet.database;

import org.jdbi.v3.core.Handle;

public abstract class AbstractDao {

  protected final DatabaseHandler databaseHandler;

  public AbstractDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

}
