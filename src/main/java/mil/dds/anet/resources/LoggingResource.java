package mil.dds.anet.resources;

import com.codahale.metrics.annotation.Timed;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.dropwizard.auth.Auth;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.lang.invoke.MethodHandles;
import java.util.List;
import mil.dds.anet.beans.Person;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@Path("/api/logging")
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
   * @param requestContext the HTTP request context (used for getting the remote address)
   * @param user the authenticated user logging the messages
   * @param logEntries a list of log entries
   */
  @POST
  @Timed
  @Path("/log")
  @Consumes(MediaType.APPLICATION_JSON)
  public void logMessage(final @Context HttpServletRequest requestContext, final @Auth Person user,
      final List<LogEntry> logEntries) {
    for (final LogEntry logEntry : logEntries) {

      final String message = String.format("%1$s %2$s %3$s %4$s %5$s", user,
          requestContext.getRemoteAddr(), logEntry.url, logEntry.lineNr, logEntry.message);

      switch (logEntry.severity) {
        case "DEBUG":
          logger.debug(message);
          break;
        case "FATAL":
          logger.error(message);
          break;
        case "INFO":
          logger.info(message);
          break;
        case "WARN":
          logger.warn(message);
          break;
        default:
          logger.error(message);
      }
    }
  }
}
