package mil.dds.anet.threads;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.base.Joiner;
import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import java.io.IOException;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.SendFailedException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.utils.DaoUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnetEmailWorker implements Runnable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static AnetEmailWorker instance;

  private EmailDao dao;
  private ObjectMapper mapper;
  private Properties props;
  private Authenticator auth;
  private String fromAddr;
  private String serverUrl;
  private final Map<String, Object> fields;
  private Configuration freemarkerConfig;
  private ScheduledExecutorService scheduler;
  private final String supportEmailAddr;
  private final DateTimeFormatter dtf;
  private final DateTimeFormatter dttf;
  private final boolean engagementsIncludeTimeAndDuration;
  private final DateTimeFormatter edtf;
  private final Integer nbOfHoursForStaleEmails;
  private final boolean disabled;

  @SuppressWarnings("unchecked")
  public AnetEmailWorker(EmailDao dao, AnetConfiguration config,
      ScheduledExecutorService scheduler) {
    this.dao = dao;
    this.scheduler = scheduler;
    this.mapper = MapperUtils.getDefaultMapper();
    this.fromAddr = config.getEmailFromAddr();
    this.serverUrl = config.getServerUrl();
    this.supportEmailAddr = (String) config.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
    this.dtf =
        DateTimeFormatter.ofPattern((String) config.getDictionaryEntry("dateFormats.email.date"))
            .withZone(DaoUtils.getDefaultZoneId());
    this.dttf = DateTimeFormatter
        .ofPattern((String) config.getDictionaryEntry("dateFormats.email.withTime"))
        .withZone(DaoUtils.getDefaultZoneId());
    engagementsIncludeTimeAndDuration = Boolean.TRUE
        .equals((Boolean) config.getDictionaryEntry("engagementsIncludeTimeAndDuration"));
    final String edtfPattern = (String) config
        .getDictionaryEntry(engagementsIncludeTimeAndDuration ? "dateFormats.email.withTime"
            : "dateFormats.email.date");
    this.edtf = DateTimeFormatter.ofPattern(edtfPattern).withZone(DaoUtils.getDefaultZoneId());
    this.fields = (Map<String, Object>) config.getDictionaryEntry("fields");
    instance = this;

    SmtpConfiguration smtpConfig = config.getSmtp();
    props = new Properties();
    props.put("mail.smtp.starttls.enable", smtpConfig.getStartTls().toString());
    props.put("mail.smtp.host", smtpConfig.getHostname());
    props.put("mail.smtp.port", smtpConfig.getPort().toString());
    auth = null;
    this.nbOfHoursForStaleEmails = smtpConfig.getNbOfHoursForStaleEmails();

    if (smtpConfig.getUsername() != null && smtpConfig.getUsername().trim().length() > 0) {
      props.put("mail.smtp.auth", "true");
      auth = new javax.mail.Authenticator() {
        protected PasswordAuthentication getPasswordAuthentication() {
          return new PasswordAuthentication(smtpConfig.getUsername(), smtpConfig.getPassword());
        }
      };
    }

    disabled = smtpConfig.isDisabled();

    freemarkerConfig = new Configuration(Configuration.getVersion());
    // auto-escape HTML in our .ftlh templates
    freemarkerConfig.setRecognizeStandardFileExtensions(true);
    freemarkerConfig
        .setObjectWrapper(new DefaultObjectWrapperBuilder(Configuration.getVersion()).build());
    freemarkerConfig.loadBuiltInEncodingMap();
    freemarkerConfig.setDefaultEncoding(StandardCharsets.UTF_8.name());
    freemarkerConfig.setClassForTemplateLoading(this.getClass(), "/");
    freemarkerConfig.setAPIBuiltinEnabled(true);
  }

  @Override
  public void run() {
    logger.debug("AnetEmailWorker waking up to send emails!");
    try {
      runInternal();
    } catch (Throwable e) {
      // Cannot let this thread die, otherwise ANET will stop sending emails until you reboot the
      // server :(
      logger.error("Exception in run()", e);
    }
  }

  private void runInternal() {
    // check the database for any emails we need to send.
    final List<AnetEmail> emails = dao.getAll();

    // Send the emails!
    final List<Integer> processedEmails = new LinkedList<Integer>();
    for (final AnetEmail email : emails) {
      Map<String, Object> context = null;

      try {
        context = buildContext(email);
        logger.info("{} Sending email to {} re: {}", disabled ? "[Disabled] " : "",
            email.getToAddresses(), email.getAction().getSubject(context));

        if (!disabled) {
          sendEmail(email, context);
        }

        processedEmails.add(email.getId());
      } catch (Throwable t) {
        logger.error("Error sending email", t);

        // Process stale emails
        if (this.nbOfHoursForStaleEmails != null && email.getCreatedAt().isBefore(Instant.now()
            .atZone(DaoUtils.getDefaultZoneId()).minusHours(nbOfHoursForStaleEmails).toInstant())) {
          String message = "Purging stale email to ";
          try {
            message += email.getToAddresses();
            message += email.getAction().getSubject(context);
          } finally {
            logger.info(message);
            processedEmails.add(email.getId());
          }
        }
      }
    }

    // Update the database.
    dao.deletePendingEmails(processedEmails);
  }

  private Map<String, Object> buildContext(final AnetEmail email) {
    AnetObjectEngine engine = AnetObjectEngine.getInstance();
    Map<String, Object> context = new HashMap<String, Object>();
    context.put("context", engine.getContext());
    context.put("serverUrl", serverUrl);
    context.put(AdminSettingKeys.SECURITY_BANNER_TEXT.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
    context.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
    context.put("SUPPORT_EMAIL_ADDR", supportEmailAddr);
    context.put("dateFormatter", dtf);
    context.put("dateTimeFormatter", dttf);
    context.put("engagementsIncludeTimeAndDuration", engagementsIncludeTimeAndDuration);
    context.put("engagementDateFormatter", edtf);
    context.put("fields", fields);

    return email.getAction().buildContext(context);
  }

  private void sendEmail(final AnetEmail email, final Map<String, Object> context)
      throws MessagingException, IOException, TemplateException {
    // Remove any null email addresses
    email.getToAddresses().removeIf(s -> Objects.equals(s, null));
    if (email.getToAddresses().size() == 0) {
      // This email will never get sent... just kill it off
      // log.error("Unable to send email of subject {}, because there are no valid to email
      // addresses");
      return;
    }

    StringWriter writer = new StringWriter();
    Template temp = freemarkerConfig.getTemplate(email.getAction().getTemplateName());
    temp.process(context, writer);

    Session session = Session.getInstance(props, auth);
    Message message = new MimeMessage(session);
    message.setFrom(new InternetAddress(fromAddr));
    String toAddress = Joiner.on(", ").join(email.getToAddresses());
    message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toAddress));
    message.setSubject(email.getAction().getSubject(context));
    message.setContent(writer.toString(), "text/html; charset=utf-8");

    try {
      Transport.send(message);
    } catch (SendFailedException e) {
      // The server rejected this... we'll log it and then not try again.
      logger.error("Send failed", e);
      return;
    }
    // Other errors are intentially thrown, as we want ANET to try again.
  }


  public static void sendEmailAsync(AnetEmail email) {
    instance.internal_sendEmailAsync(email);
  }

  private synchronized void internal_sendEmailAsync(AnetEmail email) {
    // Insert the job spec into the database.
    try {
      String jobSpec = mapper.writeValueAsString(email);
      dao.createPendingEmail(jobSpec);
    } catch (JsonProcessingException jsonError) {
      throw new WebApplicationException(jsonError);
    }

    // poke the worker thread so it wakes up.
    scheduler.schedule(this, 1, TimeUnit.SECONDS);
  }
}
