package mil.dds.anet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.shell.command.annotation.CommandScan;

@SpringBootApplication
@CommandScan
public class AnetApplication {

  public static final freemarker.template.Version FREEMARKER_VERSION =
      freemarker.template.Configuration.VERSION_2_3_33;

  public static void main(String[] args) {
    SpringApplication.run(AnetApplication.class, args);
  }

}
