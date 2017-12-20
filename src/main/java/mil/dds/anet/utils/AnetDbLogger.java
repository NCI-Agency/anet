package mil.dds.anet.utils;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.log4j.Priority;
import org.skife.jdbi.v2.DBI;
import org.skife.jdbi.v2.logging.FormattedLog;

import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.ReportSensitiveInformationDao;

/**
 * This Logger is mostly a copy of the default logger except it specifically looks for the very long column definitions that ANET2 uses
 * and will replace them in the log with a shortened version.  This just makes the logs easier to read and debug.
 */
public class AnetDbLogger extends FormattedLog {
	private final Logger log;
	private final Priority level;

	/**
	 * Logs to org.skife.jdbi.v2 logger at the debug level.
	 */
	public AnetDbLogger() {
		this(Logger.getLogger(DBI.class));
	}

	/**
	 * Use an arbitrary logger to log to at the debug level.
	 */
	public AnetDbLogger(Logger log) {
		this(log, Level.DEBUG);
	}

	/**
	 * Specify both the logger and the priority to log at.
	 * @param log The logger to log to
	 * @param level the priority to log at
	 */
	public AnetDbLogger(Logger log, Priority level) {
		this.log = log;
		this.level = level;
	}

	@Override
	protected boolean isEnabled() {
		return log.isEnabledFor(level);
	}

	@Override
	protected void log(String msg) {
		msg = msg.replace(PersonDao.PERSON_FIELDS, " <PERSON_FIELDS> ")
				.replace(PositionDao.POSITIONS_FIELDS, " <POSITION_FIELDS> ")
				.replace(OrganizationDao.ORGANIZATION_FIELDS, " <ORGANIZATION_FIELDS> ")
				.replace(ReportDao.REPORT_FIELDS, " <REPORT_FIELDS> ")
				.replace(ReportSensitiveInformationDao.REPORTS_SENSITIVE_INFORMATION_FIELDS, " <REPORTS_SENSITIVE_INFORMATION_FIELDS> ");
		log.log(level, msg);
	}
}
