package mil.dds.anet.test;

import com.graphql_java_generator.client.GraphqlClientUtils;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackageClasses = {SpringTestConfig.class, GraphqlClientUtils.class,
    QueryExecutor.class, MutationExecutor.class, GraphQLPluginConfiguration.class})
public class SpringTestConfig {
  public static void main(String[] args) {
    SpringApplication.run(SpringTestConfig.class, args);
  }
}
