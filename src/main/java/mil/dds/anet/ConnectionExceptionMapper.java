package mil.dds.anet;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.ext.ExceptionMapper;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.jdbi.v3.core.ConnectionException;

public class ConnectionExceptionMapper implements ExceptionMapper<ConnectionException> {
  @Override
  public Response toResponse(final ConnectionException e) {
    final Map<String, Object> error = new HashMap<>();
    error.put("message", String.format("Problem when getting connection: %s", e.getMessage()));
    error.put("locations", Collections.emptyList());
    error.put("path", Collections.emptyList());
    error.put("extensions", Map.of("classification", "ConnectionException"));

    // Create a JSON response with the error
    return Response.status(Status.SERVICE_UNAVAILABLE).type(MediaType.APPLICATION_JSON_TYPE)
        .entity(Map.of("errors", List.of(error))).build();
  }
}
