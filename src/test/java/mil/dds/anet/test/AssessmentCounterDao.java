package mil.dds.anet.test;

import java.util.Map;
import java.util.Optional;
import mil.dds.anet.database.DatabaseHandler;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.mapper.MapMapper;
import org.jdbi.v3.core.statement.Query;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

@Controller
public class AssessmentCounterDao {

  protected final DatabaseHandler databaseHandler;

  AssessmentCounterDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  // Used by {@link mil.dds.anet.test.resources.AssessmentResourceTest}
  @Transactional
  public int countAssessments() {
    final Handle handle = getDbHandle();
    try {
      final Query q = handle.createQuery("SELECT COUNT(*) as ct FROM assessments");
      final Optional<Map<String, Object>> result = q.map(new MapMapper()).findFirst();
      return ((Number) result.get().get("ct")).intValue();
    } finally {
      closeDbHandle(handle);
    }
  }
}
