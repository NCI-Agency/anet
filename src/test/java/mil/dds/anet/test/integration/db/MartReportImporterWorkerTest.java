package mil.dds.anet.test.integration.db;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.threads.MartReportImporterWorker;
import org.junit.jupiter.api.Test;

class MartReportImporterWorkerTest {

  @Test
  void testReportDueInFuture() throws JsonProcessingException {
    String jsonMessage = "{\"recommendations\":\"<p>TEST</p>\\n\",\"comments\":\"<p>TEST</p>\\n\",\"attitude\":\"<p>TEST</p>\\n\",\"description\":\"<p>TEST</p>\\n\"," +
            "\"contacts\":[{\"firstName\":\"John\",\"lastName\":\"Smith\",\"nationality\":\"Denmark\",\"position\":\"POS\",\"organisation\":\"ORG\"," +
            "\"extraInformation\":\"TEST\"}],\"topics\":[\"Crime\",\"Decentralisation\"],\"eventHeadline\":\"TEST\"," +
            "\"submittedTime\":\"2024-11-05T12:36:45.021325440Z\",\"grid\":\"34TEN33360518\",\"location\":\"6d90aacb-0108-4c0e-b6d8-079c808d4857\"," +
            "\"municipality\":\"Gnjilane Gjilan\",\"reportingTeam\":\"E3\",\"command\":\"JRD(E)\",\"uuid\":\"c9ed9d24-a16b-491d-86a3-99c1f32098f4\"," +
            "\"lastModificationTime\":\"2024-11-05T12:36:33.141447Z\",\"eventDate\":\"2024-11-05T23:00:00Z\",\"eventEndDate\":null," +
            "\"sender\":\"authorized@test.com\",\"factors\":[\"Radicalism\",\"Unilateralism\"],\"domains\":[\"Economy\",\"Social\"],\"images\":[]}";
    ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    MartReportImporterWorker.MartReport martReport =
            ignoringMapper.readValue(jsonMessage, MartReportImporterWorker.MartReport.class);
    System.out.println(martReport);
  }


}
