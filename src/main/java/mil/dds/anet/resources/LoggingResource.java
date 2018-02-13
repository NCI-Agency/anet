package mil.dds.anet.resources;

import java.util.List;

import javax.annotation.security.PermitAll;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;

import com.codahale.metrics.annotation.Timed;
import com.fasterxml.jackson.annotation.JsonProperty;

import io.dropwizard.auth.Auth;
import mil.dds.anet.beans.Person;

@Path("/api/logging")
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll

public class LoggingResource {

	static class LogEntry {
		@JsonProperty String severity;
		@JsonProperty String url;
		@JsonProperty String lineNr;
		@JsonProperty String message;
	  }

	private final Logger logger = Logger.getLogger(LoggingResource.class);
	
	/**
	 * Creates a log entry based on the following inputs
	 * - severity: one of 'DEBUG','ERROR','FATAL','INFO','WARN'
	 * - url: the context url
	 * - lineNr: line number of the error
	 * - message: The error/log message
	 */
	@POST
	@Timed
	@Path("/log")
	@PermitAll
	public void logMessage(final @Context HttpServletRequest requestContext, final @Auth Person user, final List<LogEntry> logEntries) {
		for (LogEntry logEntry : logEntries)
			{
			final StringBuilder messageBuilder = new StringBuilder();			
			messageBuilder.append(user.getId());
			messageBuilder.append(" ");
			messageBuilder.append(requestContext.getRemoteAddr());
			messageBuilder.append(" ");
			messageBuilder.append(logEntry.url);
			messageBuilder.append(" ");
			messageBuilder.append(logEntry.lineNr);
			messageBuilder.append(" ");
			messageBuilder.append(logEntry.message);
			logger.log(Level.toLevel(logEntry.severity), messageBuilder.toString());		
			}
		}
}
