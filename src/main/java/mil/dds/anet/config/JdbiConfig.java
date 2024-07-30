package mil.dds.anet.config;

import javax.sql.DataSource;
import org.jdbi.v3.core.ConnectionFactory;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.CaseStrategy;
import org.jdbi.v3.core.mapper.MapMappers;
import org.jdbi.v3.spring5.EnableJdbiRepositories;
import org.jdbi.v3.spring5.SpringConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableJdbiRepositories
public class JdbiConfig {

  @Bean
  public Jdbi jdbi(DataSource dataSource) {
    final ConnectionFactory cf = new SpringConnectionFactory(dataSource);
    final Jdbi jdbi = Jdbi.create(cf);
    // Auto-register (a.o.) the SqlObjectPlugin
    jdbi.installPlugins();
    // Don't map column names to lowercase
    jdbi.getConfig(MapMappers.class).setCaseChange(CaseStrategy.NOP);
    return jdbi;
  }
}
