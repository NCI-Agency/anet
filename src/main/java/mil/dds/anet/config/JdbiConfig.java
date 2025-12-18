package mil.dds.anet.config;

import java.util.stream.Stream;
import javax.sql.DataSource;
import liquibase.integration.spring.SpringLiquibase;
import org.jdbi.v3.core.ConnectionFactory;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.CaseStrategy;
import org.jdbi.v3.core.mapper.MapMappers;
import org.jdbi.v3.postgres.PostgresPlugin;
import org.jdbi.v3.spring.EnableJdbiRepositories;
import org.jdbi.v3.spring.SpringConnectionFactory;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.support.DatabaseStartupValidator;

@Configuration
@EnableJdbiRepositories
public class JdbiConfig {

  @Bean
  public Jdbi jdbi(DataSource dataSource) {
    final ConnectionFactory cf = new SpringConnectionFactory(dataSource);
    final Jdbi jdbi = Jdbi.create(cf);
    // Register our plugins
    jdbi.installPlugin(new PostgresPlugin());
    jdbi.installPlugin(new SqlObjectPlugin());
    // Don't map column names to lowercase
    jdbi.getConfig(MapMappers.class).setCaseChange(CaseStrategy.NOP);
    return jdbi;
  }

  @Bean
  public DatabaseStartupValidator databaseStartupValidator(DataSource dataSource) {
    var dsv = new DatabaseStartupValidator();
    dsv.setDataSource(dataSource);
    return dsv;
  }

  @Bean
  public static BeanFactoryPostProcessor dependsOnPostProcessor() {
    // Wait for database to be up before configuring Liquibase
    return bf -> Stream.of(bf.getBeanNamesForType(SpringLiquibase.class)).map(bf::getBeanDefinition)
        .forEach(bd -> bd.setDependsOn("databaseStartupValidator"));
  }

}
