package mil.dds.anet.graphql.outputtransformers;

import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.resources.GraphQLResource;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

public class ResourceTransformers {

  public static final String APPLICATION_XLSX_VALUE =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  public static final MediaType APPLICATION_XLSX = MediaType.parseMediaType(APPLICATION_XLSX_VALUE);

  private ResourceTransformers() {}

  public abstract static class ResourceTransformer<T>
      implements Function<Map<String, Object>, ResponseEntity<T>> {
    public final String outputType;
    public final MediaType mediaType;

    protected ResourceTransformer(String outputType, MediaType mediaType) {
      this.outputType = outputType;
      this.mediaType = mediaType;
    }
  }

  public static final ResourceTransformer<Map<String, Object>> jsonTransformer =
      new ResourceTransformer<>("json", MediaType.APPLICATION_JSON) {
        @Override
        public ResponseEntity<Map<String, Object>> apply(Map<String, Object> json) {
          return ResponseEntity.ok().contentType(this.mediaType).body(json);
        }
      };

  public static final ResourceTransformer<StreamingResponseBody> xlsxTransformer =
      new ResourceTransformer<>("xlsx", APPLICATION_XLSX) {
        final JsonToXlsxTransformer xlsxTransformer =
            new JsonToXlsxTransformer(ApplicationContextProvider.getDictionary());

        @Override
        public ResponseEntity<StreamingResponseBody> apply(final Map<String, Object> json) {
          final HttpHeaders headers = new HttpHeaders();
          headers.setContentDisposition(
              ContentDisposition.attachment().filename("anet_export.xlsx").build());
          return ResponseEntity.ok().contentType(this.mediaType).headers(headers)
              .body(out -> writeWorkbook(out, json));
        }

        private void writeWorkbook(final OutputStream output, final Map<String, Object> json) {
          try (final XSSFWorkbook workbook = xlsxTransformer.apply(json)) {
            workbook.write(output);
          } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error writing XLSX", e);
          }
        }
      };

  public static final ResourceTransformer<String> xmlTransformer =
      new ResourceTransformer<>("xml", MediaType.APPLICATION_XML) {
        final JsonToXmlTransformer jsonToXmlTransformer = new JsonToXmlTransformer();

        @Override
        public ResponseEntity<String> apply(final Map<String, Object> json) {
          return ResponseEntity.ok().contentType(this.mediaType)
              .body(jsonToXmlTransformer.apply(json));
        }
      };

  public static final ResourceTransformer<String> nvgTransformer =
      new ResourceTransformer<>("nvg", MediaType.APPLICATION_XML) {
        final JsonToXmlTransformer jsonToXmlTransformer = new JsonToXmlTransformer();
        final XsltXmlTransformer xsltXmlTransformer = new XsltXmlTransformer(
            GraphQLResource.class.getResourceAsStream("/stylesheets/nvg.xslt"));

        @Override
        public ResponseEntity<String> apply(final Map<String, Object> json) {
          return ResponseEntity.ok().contentType(this.mediaType)
              .body(xsltXmlTransformer.apply(jsonToXmlTransformer.apply(json)));
        }
      };

  public static final ResourceTransformer<String> kmlTransformer =
      new ResourceTransformer<>("kml", MediaType.APPLICATION_XML) {
        final JsonToXmlTransformer jsonToXmlTransformer = new JsonToXmlTransformer();
        final XsltXmlTransformer xsltXmlTransformer = new XsltXmlTransformer(
            GraphQLResource.class.getResourceAsStream("/stylesheets/kml.xslt"));

        @Override
        public ResponseEntity<String> apply(final Map<String, Object> json) {
          return ResponseEntity.ok().contentType(this.mediaType)
              .body(xsltXmlTransformer.apply(jsonToXmlTransformer.apply(json)));
        }
      };

  public static final List<ResourceTransformer<String>> xmlTransformers =
      List.of(xmlTransformer, nvgTransformer, kmlTransformer);

}
