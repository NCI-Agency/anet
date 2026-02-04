package mil.dds.anet.commands;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;

public class Utils {

  protected static final String ANET_COMMAND_GROUP = "ANET commands";

  private Utils() {}

  public static void exitWithSuccess(ApplicationContext applicationContext) {
    exit(applicationContext, 0);
  }

  public static void exitWithError(ApplicationContext applicationContext) {
    exit(applicationContext, 1);
  }

  public static void exit(ApplicationContext applicationContext, int exitCode) {
    SpringApplication.exit(applicationContext);
    System.exit(exitCode);
  }

}
