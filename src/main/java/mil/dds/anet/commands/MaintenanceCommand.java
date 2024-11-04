package mil.dds.anet.commands;

import java.lang.invoke.MethodHandles;
import mil.dds.anet.AnetObjectEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.shell.command.annotation.Command;
import org.springframework.shell.context.InteractionMode;
import org.springframework.shell.standard.ShellComponent;

@ShellComponent
@Command(group = "ANET commands", command = "maintenance",
    description = "Various helpful maintenance commands for the ANET Database")
public class MaintenanceCommand {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ApplicationContext applicationContext;
  private final AnetObjectEngine engine;

  public MaintenanceCommand(ApplicationContext applicationContext, AnetObjectEngine engine) {
    this.applicationContext = applicationContext;
    this.engine = engine;
  }

  @Command(command = "clearEmptyBiographies",
      description = "Clears empty biographies (blank or empty HTML tags) by replacing them with a NULL value",
      interactionMode = InteractionMode.NONINTERACTIVE)
  public void clearEmptyBiographies() {
    int exitCode = 1;
    try {
      logger.info("Clearing empty biographies");
      engine.getPersonDao().clearEmptyBiographies();
      exitCode = 0;
    } finally {
      Utils.exit(applicationContext, exitCode);
    }
  }

  @Command(command = "deleteDanglingNotes",
      description = "Deletes dangling notes (either report assessments for reports that have been deleted,"
          + " or notes pointing to objects that no longer exist)",
      interactionMode = InteractionMode.NONINTERACTIVE)
  public void deleteDanglingNotes() {
    int exitCode = 1;
    try {
      logger.info("Deleting dangling assessments and notes");
      engine.getNoteDao().deleteDanglingNotes();
      exitCode = 0;
    } finally {
      Utils.exit(applicationContext, exitCode);
    }
  }

}
