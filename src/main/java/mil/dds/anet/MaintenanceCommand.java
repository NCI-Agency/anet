package mil.dds.anet;

import io.dropwizard.core.Application;
import io.dropwizard.core.cli.EnvironmentCommand;
import io.dropwizard.core.setup.Environment;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.PendingAssessmentsHelper.AssessmentDates;
import mil.dds.anet.utils.PendingAssessmentsHelper.Recurrence;
import net.sourceforge.argparse4j.impl.Arguments;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MaintenanceCommand extends EnvironmentCommand<AnetConfiguration> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public MaintenanceCommand(Application<AnetConfiguration> application) {
    super(application, "maintenance", "Various helpful maintenance commands for the ANET Database");
  }

  @Override
  public void configure(Subparser subparser) {
    subparser.addArgument("-ceb", "--clearEmptyBiographies").action(Arguments.storeTrue())
        .required(false).help(
            "Clears empty biographies (blank or empty HTML tags) by replacing them with a NULL value");
    subparser.addArgument("-ddn", "--deleteDanglingNotes").action(Arguments.storeTrue())
        .required(false)
        .help("Delete dangling notes (either report assessments for reports that have been deleted,"
            + " or notes pointing to objects that no longer exist)");

    super.configure(subparser);
  }

  @Override
  protected void run(Environment environment, Namespace namespace, AnetConfiguration configuration)
      throws Exception {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();

    if (Boolean.TRUE.equals(namespace.getBoolean("clearEmptyBiographies"))) {
      clearEmptyBiographies(engine);
    }

    if (Boolean.TRUE.equals(namespace.getBoolean("deleteDanglingNotes"))) {
      deleteDanglingNotes(engine);
    }

    if (!configuration.isTestMode()) {
      // Only exit when not in testMode, or the Command tests won't run
      System.exit(0);
    }
  }

  private void clearEmptyBiographies(AnetObjectEngine engine) {
    logger.info("Clearing empty biographies");
    engine.getPersonDao().clearEmptyBiographies();
  }

  private void deleteDanglingNotes(AnetObjectEngine engine) {
    logger.info("Deleting dangling assessments and notes");
    engine.getNoteDao().deleteDanglingNotes();
  }

  public static String getPeriodStart(final String recurrence, final Instant instant) {
    final AssessmentDates assessmentDates =
        new AssessmentDates(instant, Recurrence.valueOfRecurrence(recurrence));
    return DateTimeFormatter.ISO_LOCAL_DATE
        .format(assessmentDates.getNotificationDate().atZone(DaoUtils.getServerNativeZoneId()));
  }
}
