package mil.dds.anet.ws;

import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.services.IMartDictionaryService;
import mil.dds.anet.utils.Utils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping(MartWebService.MART_WEB_SERVICE)
@EnableMethodSecurity
public class MartWebService {
  public static final String MART_WEB_SERVICE = "/martWebService";

  private final AnetDictionary dict;
  private final IMartDictionaryService martDictionaryService;

  public MartWebService(AnetDictionary dict, IMartDictionaryService martDictionaryService) {
    this.martDictionaryService = martDictionaryService;
    this.dict = dict;
  }

  @PreAuthorize("hasAuthority('SCOPE_MART')")
  @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<StreamingResponseBody> getMartDictionary() {
    if (Boolean.FALSE.equals(dict.getDictionaryEntry("featureMartGuiEnabled"))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "featureMartGuiEnabled is not enabled");
    }

    final HttpHeaders headers = new HttpHeaders();
    headers.setContentDisposition(
        ContentDisposition.attachment().filename("anet-dictionary.yml").build());

    return ResponseEntity.ok().contentType(MediaType.APPLICATION_YAML).headers(headers)
        .body(Utils.toYamlStream(martDictionaryService.createDictionaryForMart()));
  }
}
