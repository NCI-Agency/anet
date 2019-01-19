package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.emails.FutureEngagementUpdated;
import mil.dds.anet.utils.DaoUtils;

public class FutureEngagementWorker implements Runnable {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
	
	private ReportDao dao;

	public FutureEngagementWorker(ReportDao dao) {
		this.dao = dao;
	}
	
	@Override
	public void run() {
		logger.debug("Future Engagement Worker waking up to check for Future Engagements");
		try {
			runInternal();
		} catch (Throwable e) { 
			//CAnnot let this thread die. Otherwise ANET will stop checking for future engagements. 
			logger.error("Exception in run()", e);
		}
	}
	
	private void runInternal() { 
		//Get a list of all FUTURE and engagementDate < today reports, and their authors
		ReportSearchQuery query = new ReportSearchQuery();
		query.setPageSize(Integer.MAX_VALUE);
		query.setState(Collections.singletonList(ReportState.FUTURE));
		Instant endOfToday = Instant.now().atZone(DaoUtils.getDefaultZoneId()).withHour(23).withMinute(59).withSecond(59).withNano(999999999).toInstant();
		query.setEngagementDateEnd(endOfToday);
		List<Report> reports = AnetObjectEngine.getInstance().getReportDao().search(query).getList();
		
		//send them all emails to let them know we updated their report. 
		for (Report r : reports) { 
			try { 
				AnetEmail email = new AnetEmail();
				FutureEngagementUpdated action = new FutureEngagementUpdated();
				action.setReport(r);
				email.setAction(action);
				try {
					email.addToAddress(r.loadAuthor(AnetObjectEngine.getInstance().getContext()).get().getEmailAddress());
					AnetEmailWorker.sendEmailAsync(email);
					dao.updateToDraftState(r);
				} catch (InterruptedException | ExecutionException e) {
					logger.error("failed to load Author", e);
				}
			} catch (Exception e) { 
				logger.error("Exception when updating", e);
			}
		}
		
	}

}
