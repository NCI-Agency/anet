package mil.dds.anet.database;

import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.spring.JdbiUtil;
import org.springframework.stereotype.Component;

@Component
public class DatabaseHandler {

  private final Jdbi jdbi;

  public DatabaseHandler(Jdbi jdbi) {
    this.jdbi = jdbi;
  }

  public Handle getHandle() {
    return JdbiUtil.getHandle(jdbi);
  }

  public void closeHandle(Handle handle) {
    JdbiUtil.closeIfNeeded(handle);
  }
}
