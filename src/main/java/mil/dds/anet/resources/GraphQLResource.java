package mil.dds.anet.resources;

import graphql.GraphQL;
import io.leangen.graphql.spqr.spring.web.dto.ExecutorParams;
import io.leangen.graphql.spqr.spring.web.dto.GraphQLRequest;
import io.leangen.graphql.spqr.spring.web.dto.TransportType;
import java.security.Principal;
import java.util.Map;
import mil.dds.anet.graphql.outputtransformers.ResourceTransformers;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/graphql")
public class GraphQLResource {

  private final GraphQL graphQL;
  private final GraphQLExecutor executor;

  public GraphQLResource(final GraphQL graphQL, final GraphQLExecutor executor) {
    this.graphQL = graphQL;
    this.executor = executor;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, Object>> graphqlPostJson(final Principal principal,
      @RequestBody GraphQLRequest requestBody,
      @RequestParam(name = "output", required = false) String ignoredOutput,
      NativeWebRequest request) {
    if (requestBody == null) {
      // Empty body, possibly after re-authentication; user will have to try again
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("error", "Request failed, please try again or refresh your browser window"));
    }

    return ResourceTransformers.jsonTransformer.apply(graphql(principal, requestBody, request));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_XML_VALUE)
  public ResponseEntity<String> graphqlPostXml(final Principal principal,
      @RequestBody GraphQLRequest requestBody,
      @RequestParam(name = "output", required = false) String output) {
    final var transformer = ResourceTransformers.xmlTransformers.stream()
        .filter(t -> t.outputType.equals(output)).findFirst();
    return transformer
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown XML output type"))
        .apply(graphql(principal, requestBody, null));
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = ResourceTransformers.APPLICATION_XLSX_VALUE)
  public ResponseEntity<StreamingResponseBody> graphqlPostXlsx(final Principal principal,
      @RequestBody GraphQLRequest requestBody,
      @RequestParam(name = "output", required = false) String ignoredOutput) {
    return ResourceTransformers.xlsxTransformer.apply(graphql(principal, requestBody, null));
  }

  public Map<String, Object> graphql(final GraphQLRequest requestBody,
      final NativeWebRequest request) {

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
          "Must provide a valid Web Service Access Token");
    }
    return executor.execute((Principal) auth.getPrincipal(), this.graphQL,
        getExecutorParams(requestBody, request));
  }

  public Map<String, Object> graphql(final Principal principal, final GraphQLRequest requestBody,
      final NativeWebRequest request) {
    return executor.execute(principal, this.graphQL, getExecutorParams(requestBody, request));
  }

  private ExecutorParams<NativeWebRequest> getExecutorParams(final GraphQLRequest requestBody,
      final NativeWebRequest request) {
    return new ExecutorParams<>(
        new GraphQLRequest(requestBody.getId(), requestBody.getQuery(),
            requestBody.getOperationName(), requestBody.getVariables()),
        request, TransportType.HTTP);
  }

}
