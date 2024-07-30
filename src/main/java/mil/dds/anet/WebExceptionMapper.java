package mil.dds.anet;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice
public class WebExceptionMapper extends ResponseEntityExceptionHandler {

  @ExceptionHandler(value = ResponseStatusException.class)
  protected ResponseEntity<Object> handleResponseStatusException(final ResponseStatusException e,
      final WebRequest request) {
    // Create a JSON response with the error
    final String msg = e.getReason() == null ? e.getMessage() : e.getReason();
    return ResponseEntity.status(e.getStatusCode()).contentType(MediaType.APPLICATION_JSON)
        .body(getErrors(msg));
  }

  @ExceptionHandler(
      value = {CannotGetJdbcConnectionException.class, CannotCreateTransactionException.class})
  protected ResponseEntity<Object> handleConnectionException(final RuntimeException e,
      final WebRequest request) {
    // Create a JSON response with the error
    final String msg = String.format("Problem when getting connection: %s", e.getMessage());
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .contentType(MediaType.APPLICATION_JSON).body(getErrors(msg));
  }

  private static Map<String, List<Map<String, String>>> getErrors(String msg) {
    return Map.of("errors", List.of(Map.of("message", msg)));
  }

}
