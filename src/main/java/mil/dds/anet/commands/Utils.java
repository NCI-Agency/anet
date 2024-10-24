package mil.dds.anet.commands;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;

public class Utils {

  private Utils() {}

  public static void exit(ApplicationContext applicationContext, int exitCode) {
    SpringApplication.exit(applicationContext);
    System.exit(exitCode);
  }

}
