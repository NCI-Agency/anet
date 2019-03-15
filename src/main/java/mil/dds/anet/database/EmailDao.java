package mil.dds.anet.database;

import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.database.mappers.AnetEmailMapper;
import mil.dds.anet.utils.DaoUtils;

public class EmailDao {

	private static final Logger logger = LoggerFactory.getLogger(EmailDao.class);

	private AnetObjectEngine engine;
	private AnetEmailMapper emailMapper;

	public EmailDao(AnetObjectEngine engine) {
		this.engine = engine;
		this.emailMapper = new AnetEmailMapper();
	}

	public List<AnetEmail> getAll() {
		return engine.getDbHandle().createQuery("/* PendingEmailCheck */ SELECT * FROM \"pendingEmails\" ORDER BY \"createdAt\" ASC")
			.map(emailMapper)
			.list();
	}

	public void deletePendingEmails(List<Integer> processedEmails) {
		if (!processedEmails.isEmpty()) {
			final String emailIds = Joiner.on(", ").join(processedEmails);
			engine.getDbHandle().createUpdate("/* PendingEmailDelete*/ DELETE FROM \"pendingEmails\" WHERE id IN (" + emailIds + ")").execute();
		}
	}

	public void createPendingEmail(String jobSpec) {
		logger.debug("Running execute on {}", engine.getDbHandle());
		engine.getDbHandle().createUpdate("/* SendEmailAsync */ INSERT INTO \"pendingEmails\" (\"jobSpec\", \"createdAt\") VALUES (:jobSpec, :createdAt)")
			.bind("jobSpec", jobSpec)
			.bind("createdAt", DaoUtils.asLocalDateTime(Instant.now()))
			.execute();
	}
}
