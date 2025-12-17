package mil.dds.anet.services;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.LogDto;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;
import mil.dds.anet.database.MartImportedReportDao;
import mil.dds.anet.database.mappers.MapperUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.cfg.DateTimeFeature;

@Component
public class MartTransmissionLogImporterService implements IMartTransmissionLogImporterService {

  protected final Logger logger = LoggerFactory.getLogger(this.getClass());

  private final ObjectMapper ignoringMapper = MapperUtils.getDefaultMapper().rebuild()
      .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
      .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS).build();

  private final MartImportedReportDao martImportedReportDao;

  public MartTransmissionLogImporterService(MartImportedReportDao martImportedReportDao) {
    this.martImportedReportDao = martImportedReportDao;
  }

  @Override
  public void processTransmissionLog(FileAttachment martTransmissionLogAttachment) {
    try {
      // Get the transmission log JSON from the attachment
      martTransmissionLogAttachment.load();
      final List<LogDto> transmissionLog = ignoringMapper.readValue(
          new String(martTransmissionLogAttachment.getContent(), StandardCharsets.UTF_8),
          new TypeReference<>() {});
      final MartImportedReportSearchQuery query = new MartImportedReportSearchQuery();
      query.setSequences(transmissionLog.stream().map(LogDto::getSequence).toList());
      final AnetBeanList<MartImportedReport> existingMartImportedReports =
          martImportedReportDao.search(query);
      if (transmissionLog.size() != existingMartImportedReports.getTotalCount()) {
        // We are missing sequences!
        final List<Long> presentSequences = existingMartImportedReports.getList().stream()
            .map(MartImportedReport::getSequence).toList();
        final List<LogDto> missing = transmissionLog.stream()
            .filter(logDto -> !presentSequences.contains(logDto.getSequence())).toList();
        // For each missing sequence create a Mart Imported Report
        for (final LogDto logDto : missing) {
          final MartImportedReport martImportedReport = new MartImportedReport();
          martImportedReport.setSequence(logDto.getSequence());
          martImportedReport.setState(MartImportedReport.State.NOT_RECEIVED);
          martImportedReport.setSubmittedAt(logDto.getSubmittedAt());
          martImportedReport.setReceivedAt(Instant.now());
          martImportedReport.setReportUuid(logDto.getReportUuid());
          if (logDto.getState() == LogDto.LogState.FAILED_TO_SEND_EMAIL.getCode()) {
            martImportedReport.setErrors(
                String.format("MART was unable to send this report: %s due to this error: %s",
                    logDto.getReportUuid(), logDto.getErrors()));
          } else {
            martImportedReport.setErrors(
                String.format("This report was lost in transmission: %s", logDto.getReportUuid()));
          }
          martImportedReportDao.insert(martImportedReport);
        }
      }
    } catch (Exception e) {
      logger.error("Could not load transmission log from email", e);
    }
  }
}
