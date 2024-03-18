package mil.dds.anet;

import com.google.common.collect.ImmutableMap;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import org.eclipse.jetty.http.HttpStatus;

public class WebExceptionMapper implements ExceptionMapper<WebApplicationException> {
  @Override
  public Response toResponse(final WebApplicationException e) {
    // If the message did not come with a status, we'll default to an internal
    // server error status.
    int status = e.getResponse() == null ? 500 : e.getResponse().getStatus();

    // Get a nice human readable message for our status code if the exception
    // doesn't already have a message
    final String msg = e.getMessage() == null ? HttpStatus.getMessage(status) : e.getMessage();

    // Create a JSON response with the provided hashmap
    return Response.status(status).type(MediaType.APPLICATION_JSON_TYPE)
        .entity(ImmutableMap.of("error", msg)).build();
  }
}
