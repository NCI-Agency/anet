package mil.dds.anet.threads.mart;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import microsoft.exchange.webservices.data.core.service.item.EmailMessage;
import microsoft.exchange.webservices.data.property.complex.FileAttachment;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.services.IMailReceiver;
import mil.dds.anet.services.IMartReportImporterService;
import mil.dds.anet.services.IMartTransmissionLogImporterService;
import mil.dds.anet.threads.AbstractWorker;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false} and not ${anet.mart.disabled:true}")
public class MartImporterWorker extends AbstractWorker {

  public static final String REPORT_JSON_ATTACHMENT = "mart_report.json";
  public static final String TRANSMISSION_LOG_ATTACHMENT = "mart_transmission_log.json";

  private final IMailReceiver mailReceiver;
  private final IMartReportImporterService reportImporter;
  private final IMartTransmissionLogImporterService transmissionLogImporter;

  public MartImporterWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao,
      IMailReceiver mailReceiver, IMartReportImporterService reportImporter,
      IMartTransmissionLogImporterService transmissionLogImporter) {
    super(dict, jobHistoryDao, "MartReportImporterWorker waking up to get MART reports!");
    this.mailReceiver = mailReceiver;
    this.reportImporter = reportImporter;
    this.transmissionLogImporter = transmissionLogImporter;
  }

  private List<EmailMessage> messages;

  @Scheduled(initialDelay = 35, fixedDelayString = "${anet.mart.mail-polling-delay-in-seconds:10}",
      timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    this.messages = mailReceiver.downloadEmails();
    if (!this.messages.isEmpty()) {
      super.run();
    }
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    try {
      for (final EmailMessage email : this.messages) {
        processEmailMessage(email);
      }
      // If we get here transaction was successful, post-process emails
      mailReceiver.postProcessEmails(this.messages);
    } catch (Exception e) {
      logger.error("Exception processing MART email messages", e);
    }
  }

  private void processEmailMessage(EmailMessage email) {
    final List<FileAttachment> attachments = new ArrayList<>();
    try {
      email.load();
      logger.debug("Processing e-mail sent on: {}", email.getDateTimeCreated());

      // Get all attachments
      for (final microsoft.exchange.webservices.data.property.complex.Attachment attachment : email
          .getAttachments()) {
        if (attachment instanceof FileAttachment fileAttachment) {
          attachments.add(fileAttachment);
        }
      }
      // Process mart report in email
      reportImporter.processMartReport(attachments);
      // If transmission log in email process
      attachments.stream()
          .filter(attachment -> attachment.getName().equalsIgnoreCase(TRANSMISSION_LOG_ATTACHMENT))
          .findFirst().ifPresent(this.transmissionLogImporter::processTransmissionLog);
    } catch (Exception e) {
      logger.error("Could not load information from email", e);
    }
  }
}
