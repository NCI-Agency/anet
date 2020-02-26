package mil.dds.anet.test;

import static org.assertj.core.api.Assertions.assertThat;

import mil.dds.anet.utils.DaoUtils.DbType;
import org.junit.jupiter.api.Test;

/**
 * Tests for unit-testable methods of DaoUtils.
 */
public class DaoUtilsTest {

  @Test
  public void testDbTypeFromTag() {
    assertThat(DbType.fromTag("sqlserver")).isEqualTo(DbType.MSSQL);
    assertThat(DbType.fromTag("postgresql")).isEqualTo(DbType.POSTGRESQL);
    try {
      DbType.fromTag(null);
    } catch (Exception e) {
      assertThat(e).isExactlyInstanceOf(IllegalArgumentException.class)
          .hasMessageStartingWith("No database type");
    }
    try {
      DbType.fromTag("nopenopenope");
    } catch (Exception e) {
      assertThat(e).isExactlyInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("nopenopenope").hasMessageStartingWith("No database type");
    }
  }
}
