package mil.dds.anet.test;

import com.graphql_java_generator.client.GraphqlClientUtils;
import mil.dds.anet.AnetApplication;
import mil.dds.anet.test.client.util.MutationExecutor;
import mil.dds.anet.test.client.util.QueryExecutor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackageClasses = {GraphqlClientUtils.class, QueryExecutor.class,
    MutationExecutor.class})
public class SpringTestConfig extends AnetApplication {

  public static void main(String[] args) {
    SpringApplication.run(SpringTestConfig.class, args);
  }

}
