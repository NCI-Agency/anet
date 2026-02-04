package mil.dds.anet.commands;

import static mil.dds.anet.commands.Utils.ANET_COMMAND_GROUP;

import java.lang.invoke.MethodHandles;
import mil.dds.anet.AnetObjectEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.shell.core.command.annotation.Command;
import org.springframework.stereotype.Component;

@Component
public class MaintenanceCommand {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String MAINTENANCE_COMMAND = "maintenance";

  private final AnetObjectEngine engine;

  public MaintenanceCommand(AnetObjectEngine engine) {
    this.engine = engine;
  }

  @Command(group = ANET_COMMAND_GROUP, name = {MAINTENANCE_COMMAND, "clearEmptyBiographies"},
      description = "Clears empty biographies (blank or empty HTML tags) by replacing them with a NULL value")
  public void clearEmptyBiographies() {
    logger.info("Clearing empty biographies");
    engine.getPersonDao().clearEmptyBiographies();
  }

  @Command(group = ANET_COMMAND_GROUP, name = {MAINTENANCE_COMMAND, "deleteDanglingAssessments"},
      description = "Deletes dangling assessments (either report assessments for reports that have been deleted,"
          + " or assessments pointing to objects that no longer exist)")
  public void deleteDanglingAssessments() {
    logger.info("Deleting dangling assessments");
    engine.getAssessmentDao().deleteDanglingAssessments();
  }

  @Command(group = ANET_COMMAND_GROUP, name = {MAINTENANCE_COMMAND, "deleteDanglingNotes"},
      description = "Deletes dangling notes (notes pointing to objects that no longer exist)")
  public void deleteDanglingNotes() {
    logger.info("Deleting dangling notes");
    engine.getNoteDao().deleteDanglingNotes();
  }

}
