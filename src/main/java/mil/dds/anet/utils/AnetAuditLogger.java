package mil.dds.anet.utils;

import java.lang.invoke.MethodHandles;
import mil.dds.anet.beans.AuditTrail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnetAuditLogger {
  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private AnetAuditLogger() {}

  public static void log(AuditTrail auditTrail) {
    final StringBuilder msg = new StringBuilder(
        auditTrail.getUpdateType() == null ? "-" : String.valueOf(auditTrail.getUpdateType()));
    if (auditTrail.getRelatedObjectType() != null) {
      msg.append(String.format(" %s", auditTrail.getRelatedObjectType()));
      if (auditTrail.getRelatedObjectUuid() != null) {
        msg.append(String.format(" row %s", auditTrail.getRelatedObjectUuid()));
      }
    }
    if (auditTrail.getObjectUuid() != null) {
      msg.append(String.format(" by user %s", auditTrail.getObjectUuid()));
    }
    if (!Utils.isEmptyOrNull(auditTrail.getUpdateDescription())) {
      msg.append(String.format(": %s", auditTrail.getUpdateDescription()));
    }
    if (!Utils.isEmptyOrNull(auditTrail.getUpdateDetails())) {
      msg.append(String.format(", with details: %s", auditTrail.getUpdateDetails()));
    }
    logger.info("{}", msg);
  }
}
