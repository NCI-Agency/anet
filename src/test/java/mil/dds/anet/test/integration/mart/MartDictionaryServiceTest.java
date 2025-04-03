package mil.dds.anet.test.integration.mart;


import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import mil.dds.anet.services.IMartDictionaryService;
import mil.dds.anet.test.resources.AbstractResourceTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class MartDictionaryServiceTest extends AbstractResourceTest {

  @Autowired
  private IMartDictionaryService martDictionaryService;


  /**
   * Test proper MART dictionary is generated form TEST data
   *
   */
  @Test
  @SuppressWarnings("unchecked")
  void testMartDictionary() {
    Map<String, Object> dictionaryForMart = martDictionaryService.createDictionaryForMart();

    // Factors
    assertThat(dictionaryForMart.keySet()).contains("factors");
    List<Map<String, String>> factors =
        (List<Map<String, String>>) dictionaryForMart.get("factors");
    assertThat(factors).hasSize(1);
    assertThat(factors.get(0).get("guid")).isEqualTo("ec49de46-dd69-48c9-bde1-ecc69fa3befe");
    assertThat(factors.get(0).get("name")).isEqualTo("Factor1");

    // Domains
    assertThat(dictionaryForMart.keySet()).contains("domains");
    List<Map<String, String>> domains =
        (List<Map<String, String>>) dictionaryForMart.get("domains");
    assertThat(domains).hasSize(1);
    assertThat(domains.get(0).get("guid")).isEqualTo("4ac816ec-f379-4399-875c-67a9ec27d41b");
    assertThat(domains.get(0).get("name")).isEqualTo("Domain1");


    // Topics
    assertThat(dictionaryForMart.keySet()).contains("topics");
    List<Map<String, String>> topics = (List<Map<String, String>>) dictionaryForMart.get("topics");
    assertThat(topics).hasSize(1);
    assertThat(topics.get(0).get("guid")).isEqualTo("e1b614a0-d6a7-4300-9f0f-f9fcc245c04f");
    assertThat(topics.get(0).get("name")).isEqualTo("Topic1");

    // Commands
    assertThat(dictionaryForMart.keySet()).contains("commands");
    List<Map<String, Object>> commands =
        (List<Map<String, Object>>) dictionaryForMart.get("commands");
    assertThat(commands).hasSize(2);
    assertThat(commands.get(0).get("guid")).isEqualTo("790a79f4-27f0-4289-9756-b39adce92ca7");
    assertThat(commands.get(0).get("name")).isEqualTo("RC-E");
    List<Map<String, String>> reportingTeams =
        (List<Map<String, String>>) commands.get(0).get("reportingTeams");
    assertThat(reportingTeams).hasSize(1);
    assertThat(reportingTeams.get(0).get("guid")).isEqualTo("01336642-c566-4551-8342-3caea173ad71");
    assertThat(reportingTeams.get(0).get("name")).isEqualTo("RC-E-RLMT");

    // Municipalities
    assertThat(dictionaryForMart.keySet()).contains("municipalities");
    List<Map<String, Object>> municipalities =
        (List<Map<String, Object>>) dictionaryForMart.get("municipalities");
    assertThat(municipalities).hasSize(1);
    assertThat(municipalities.get(0).get("guid")).isEqualTo("9f83fe70-e9f5-4e92-ae48-5c4fd7076f46");
    assertThat(municipalities.get(0).get("municipalityAlbanian")).isEqualTo("Decan");
    assertThat(municipalities.get(0).get("municipalitySerbian")).isEqualTo("Decani");
    List<Map<String, String>> locations =
        (List<Map<String, String>>) municipalities.get(0).get("locations");
    assertThat(locations).hasSize(1);
    assertThat(locations.get(0).get("guid")).isEqualTo("178dfbba-f15a-400b-9135-6ff800246be0");
    assertThat(locations.get(0).get("townAlbanian")).isEqualTo("Baballoq");
    assertThat(locations.get(0).get("townSerbian")).isEqualTo("Babaloc");
    assertThat(locations.get(0).get("mgrs")).isEqualTo("34TDN46550404");
  }
}
