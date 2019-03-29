package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnetAuditLogger {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static void log(String message, Object... args) {
    logger.info(message, args);
  }
}
