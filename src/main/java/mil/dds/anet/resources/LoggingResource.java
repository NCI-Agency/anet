package mil.dds.anet.resources;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import java.lang.invoke.MethodHandles;
import java.security.Principal;
import java.util.List;
import mil.dds.anet.beans.Person;
import mil.dds.anet.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/logging")
public class LoggingResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  static class LogEntry {
    /** one of 'DEBUG','ERROR','FATAL','INFO','WARN'. */
    @JsonProperty
    String severity;
    /** the context url. */
    @JsonProperty
    String url;
    /** line number of the error. */
    @JsonProperty
    String lineNr;
    /** the error/log message. */
    @JsonProperty
    String message;
  }

  /**
   * Create a log entry based on the input.
   * 
   * @param principal the authenticated user logging the messages
   * @param logEntries a list of log entries
   * @param requestContext the HTTP request context (used for getting the remote address)
   */
  @PostMapping(path = "/log", consumes = MediaType.APPLICATION_JSON_VALUE)
  public void logMessage(final Principal principal, final HttpServletRequest requestContext,
      final List<LogEntry> logEntries) {
    final Person user = SecurityUtils.getPersonFromPrincipal(principal);
    for (final LogEntry logEntry : logEntries) {

      final String message = String.format("%1$s %2$s %3$s %4$s %5$s", user,
          requestContext.getRemoteAddr(), logEntry.url, logEntry.lineNr, logEntry.message);

      switch (logEntry.severity) {
        case "DEBUG":
          logger.debug(message);
          break;
        case "INFO":
          logger.info(message);
          break;
        case "WARN":
          logger.warn(message);
          break;
        case "FATAL":
        default:
          logger.error(message);
      }
    }
  }
}
