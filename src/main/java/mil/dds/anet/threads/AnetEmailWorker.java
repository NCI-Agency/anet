package mil.dds.anet.threads;

import java.io.IOException;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.SQLException;
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

import org.joda.time.DateTime;
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.joda.JodaModule;
import com.google.common.base.Joiner;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.emails.AnetEmailAction;

public class AnetEmailWorker implements Runnable {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private static AnetEmailWorker instance;

	private Handle handle;
	private ObjectMapper mapper;
	private AnetEmailMapper emailMapper;
	private Properties props;
	private Authenticator auth;
	private String fromAddr;
	private String serverUrl;
	private Configuration freemarkerConfig;
	private ScheduledExecutorService scheduler;
	private final String supportEmailAddr;
	private final boolean disabled;
	
	public AnetEmailWorker(Handle dbHandle, AnetConfiguration config, ScheduledExecutorService scheduler) { 
		this.handle = dbHandle;
		this.scheduler = scheduler;
		this.mapper = new ObjectMapper();
		mapper.registerModule(new JodaModule());
		//mapper.enableDefaultTyping();
		this.emailMapper = new AnetEmailMapper();
		this.fromAddr = config.getEmailFromAddr();
		this.serverUrl = config.getServerUrl();
		this.supportEmailAddr = (String) config.getDictionary().get("supportEmailAddr");
		instance = this;
		
		SmtpConfiguration smtpConfig = config.getSmtp();
		props = new Properties();
		props.put("mail.smtp.starttls.enable", smtpConfig.getStartTls().toString());
		props.put("mail.smtp.host", smtpConfig.getHostname());
		props.put("mail.smtp.port", smtpConfig.getPort().toString());
		auth = null;
		
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
		freemarkerConfig.setObjectWrapper(new DefaultObjectWrapperBuilder(Configuration.getVersion()).build());
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
			//Cannot let this thread die, otherwise ANET will stop sending emails until you reboot the server :(
			logger.error("Exception in run()", e);
		}
	}
	
	private void runInternal() {
		//check the database for any emails we need to send. 
		List<AnetEmail> emails = handle.createQuery("/* PendingEmailCheck */ SELECT * FROM pendingEmails ORDER BY createdAt ASC")
				.map(emailMapper)
				.list();
		
		//Send the emails!
		List<Integer> sentEmails = new LinkedList<Integer>();
		for (AnetEmail email : emails) { 
			try {
				if (disabled) {
					logger.info("Disabled, not sending email to {} re: {}",email.getToAddresses(), email.getAction().getSubject());
				} else {
					logger.info("Sending email to {} re: {}",email.getToAddresses(), email.getAction().getSubject());
					sendEmail(email);
				}
				sentEmails.add(email.getId());
			} catch (Exception e) { 
				logger.error("Error sending email", e);
			}
		}
		
		//Update the database.
		if (sentEmails.size() > 0) {
			String emailIds = Joiner.on(", ").join(sentEmails);
			handle.createStatement("/* PendingEmailDelete*/ DELETE FROM pendingEmails WHERE id IN (" + emailIds + ")").execute();
		}
	}

	private void sendEmail(AnetEmail email) throws MessagingException, IOException, TemplateException {
		//Remove any null email addresses
		email.getToAddresses().removeIf(s -> Objects.equals(s, null));
		if (email.getToAddresses().size() == 0) { 
			//This email will never get sent... just kill it off
			//log.error("Unable to send email of subject {}, because there are no valid to email addresses");
			return;
		}
		
		Map<String,Object> context;
		try { 
			context = email.getAction().execute();
		} catch (Throwable t) { 
			//This email will never complete, just kill it. 
			logger.error("Error execution action", t);
			return;
		}
		
		AnetObjectEngine engine = AnetObjectEngine.getInstance();
		
		StringWriter writer = new StringWriter();
		try { 
			context.put("serverUrl", serverUrl);
			context.put(AdminSettingKeys.SECURITY_BANNER_TEXT.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
			context.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
			context.put("SUPPORT_EMAIL_ADDR", supportEmailAddr);
			Template temp = freemarkerConfig.getTemplate(email.getAction().getTemplateName());
			
			temp.process(context, writer);
		} catch (Exception e) { 
			//Exceptions thrown while processing the template are unlikely to ever get fixed, so we just log this and drop the email. 
			logger.error("Error when processing template", e);
			return;
		}
		
		Session session = Session.getInstance(props, auth);
		Message message = new MimeMessage(session);
		message.setFrom(new InternetAddress(fromAddr));
		String toAddress = Joiner.on(", ").join(email.getToAddresses());
		message.setRecipients(Message.RecipientType.TO,
			InternetAddress.parse(toAddress));
		message.setSubject(email.getAction().getSubject());
		message.setContent(writer.toString(), "text/html; charset=utf-8");

		try { 
			Transport.send(message);
		} catch (SendFailedException e) { 
			//The server rejected this... we'll log it and then not try again. 
			logger.error("Send failed", e);
			return;
		}
		//Other errors are intentially thrown, as we want ANET to try again. 
	}
	
	
	public static void sendEmailAsync(AnetEmail email) {
		instance.internal_sendEmailAsync(email);
	}
	
	private synchronized void internal_sendEmailAsync(AnetEmail email) { 
		//Insert the job spec into the database.
		try { 
			String jobSpec = mapper.writeValueAsString(email);
			handle.createStatement("/* SendEmailAsync */ INSERT INTO pendingEmails (jobSpec, createdAt) VALUES (:jobSpec, :createdAt)")
				.bind("jobSpec", jobSpec)
				.bind("createdAt", new DateTime())
				.execute();
		} catch (JsonProcessingException jsonError) { 
			throw new WebApplicationException(jsonError);
		}
		
		//poke the worker thread so it wakes up. 
		scheduler.schedule(this, 1, TimeUnit.SECONDS);
	} 
	
	public static class AnetEmail { 
		Integer id;
		AnetEmailAction action;
		List<String> toAddresses;
		DateTime createdAt;
		String comment;
		
		public Integer getId() {
			return id;
		}
		
		public void setId(Integer id) {
			this.id = id;
		}
		
		public AnetEmailAction getAction() {
			return action;
		}
		
		public void setAction(AnetEmailAction action) {
			this.action = action;
		}
		
		public List<String> getToAddresses() {
			return toAddresses;
		}
		
		public void setToAddresses(List<String> toAddresses) {
			this.toAddresses = toAddresses;
		}
		
		public void addToAddress(String toAddress) { 
			if (toAddresses == null) { toAddresses = new LinkedList<String>(); } 
			toAddresses.add(toAddress);
		}
		
		public DateTime getCreatedAt() {
			return createdAt;
		}
		
		public void setCreatedAt(DateTime createdAt) {
			this.createdAt = createdAt;
		}

		public String getComment() {
			return comment;
		}

		public void setComment(String comment) {
			this.comment = comment;
		}
	}
	
	public static class AnetEmailMapper implements ResultSetMapper<AnetEmail> {

		ObjectMapper mapper;
		
		public AnetEmailMapper() { 
			this.mapper = new ObjectMapper();
			mapper.registerModule(new JodaModule());
			//mapper.enableDefaultTyping();
		}
		
		@Override
		public AnetEmail map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
			String jobSpec = rs.getString("jobSpec");
			try { 
				AnetEmail email = mapper.readValue(jobSpec, AnetEmail.class);
				
				email.setId(rs.getInt("id"));
				email.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
				return email;
			} catch (Exception e) { 
				logger.error("Error mapping email", e);
			}
			return null;			
		} 
		
	}
	
}
