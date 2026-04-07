package mil.dds.anet.test.ws;

import static mil.dds.anet.test.ws.security.BearerToken.VALID_MART_TOKEN;
import static mil.dds.anet.test.ws.security.BearerToken.VALID_NVG_TOKEN;
import static org.assertj.core.api.Assertions.assertThat;

import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.ws.MartWebService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

class MARTWebServiceTest extends AbstractResourceTest {

  @Autowired
  private MartWebService martWebService;

  @AfterEach
  void clearSecurity() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void testWithValidToken() {
    setAuthentication(VALID_MART_TOKEN);
    ResponseEntity<StreamingResponseBody> response = martWebService.getMartDictionary();
    // Assert status and headers
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getHeaders()).isNotNull();
    assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_YAML);
    assertThat(response.getHeaders().getContentDisposition().getFilename())
        .contains("anet-dictionary.yml");
  }

  @Test
  void testWithWrongToken() {
    try {
      setAuthentication(VALID_NVG_TOKEN);
      martWebService.getMartDictionary();
    } catch (Exception expectedException) {
      assertThat(expectedException).hasMessage("Access Denied");
    }
  }
}
