package mil.dds.anet.test;

import static org.assertj.core.api.Assertions.assertThat;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.DaoUtils.DbType;
import org.junit.Test;

/**
 * Tests for unit-testable methods of DaoUtils.
 */
public class DaoUtilsTest {

  @Test
  public void testBuildPagedGetAllSql() {
    String orderBy = "\"noSuchColumn\"";
    String fakeFieldList = "FILED LIST";
    String fakeTableName = "fakeTableName";
    String sqliteSql = DaoUtils.buildPagedGetAllSql(DbType.SQLITE, "Fakery", fakeTableName,
        fakeFieldList, orderBy);
    assertThat(sqliteSql).as("Generated SQL for SQLite").contains("/* getAllFakery */")
        .contains("SELECT " + fakeFieldList + " FROM " + fakeTableName).doesNotContain("OVER ()")
        .contains(" ORDER BY ").contains("LIMIT :limit OFFSET :offset");
    String pgSql = DaoUtils.buildPagedGetAllSql(DbType.POSTGRESQL, "Fakery", fakeTableName,
        fakeFieldList, orderBy);
    assertThat(pgSql).as("Generated SQL for Posgresql").contains("/* getAllFakery */")
        .contains(" SELECT " + fakeFieldList + " ").contains(" FROM " + fakeTableName + " ")
        .contains(" over() AS \"totalCount\" ").contains(" ORDER BY ")
        .contains("LIMIT :limit OFFSET :offset");
    String mssqlSql =
        DaoUtils.buildPagedGetAllSql(DbType.MSSQL, "Fakery", fakeTableName, fakeFieldList, orderBy);
    assertThat(mssqlSql).as("Generated SQL for MS SQL Server").contains("/* getAllFakery */")
        .contains("SELECT " + fakeFieldList).contains(" FROM " + fakeTableName)
        .contains(" over() AS \"totalCount\" ").contains(" OFFSET :offset ").contains(" ORDER BY ")
        .contains("FETCH NEXT :limit ROWS ONLY");
  }

  @Test
  public void testDbTypeFromTag() {
    assertThat(DbType.fromTag("sqlserver")).isEqualTo(DbType.MSSQL);
    assertThat(DbType.fromTag("sqlite")).isEqualTo(DbType.SQLITE);
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
