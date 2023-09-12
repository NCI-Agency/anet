package mil.dds.anet;

import com.google.common.collect.ImmutableMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import org.eclipse.jetty.http.HttpStatus;
import org.jdbi.v3.core.ConnectionException;

public class ConnectionExceptionMapper implements ExceptionMapper<ConnectionException> {
  @Override
  public Response toResponse(final ConnectionException e) {

    int status = 503;

    final String msg = "Problem when getting connection: " + e.getMessage();
    // Wrapper object to include all errors
    Map<String, Object> responseMap = new HashMap<>();
    Map<String, Object> error = new HashMap<>();
    Map<String, Object> childExtensions = new HashMap<>();

    childExtensions.put("classification", "ConnectionException");

    error.put("message", msg);
    error.put("locations", new ArrayList<String>());
    error.put("path", new ArrayList<>());
    error.put("extensions", childExtensions);

    // Put error objects to a list
    List<Map<String, Object>> errorList = new ArrayList<Map<String, Object>>();
    errorList.add(error);

    responseMap.put("errors", errorList);

    // Create a JSON response with the provided hashmap
    return Response.status(status).type(MediaType.APPLICATION_JSON_TYPE).entity(responseMap)
        .build();
  }
}
