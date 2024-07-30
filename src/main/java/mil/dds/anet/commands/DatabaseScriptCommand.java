package mil.dds.anet.commands;

import java.lang.invoke.MethodHandles;
import java.nio.file.Files;
import java.nio.file.Paths;
import mil.dds.anet.database.DatabaseHandler;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.shell.command.annotation.Command;
import org.springframework.shell.command.annotation.Option;
import org.springframework.shell.context.InteractionMode;
import org.springframework.shell.standard.ShellComponent;

@ShellComponent
@Command(group = "ANET commands")
public class DatabaseScriptCommand {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ApplicationContext applicationContext;
  private final DatabaseHandler databaseHandler;

  public DatabaseScriptCommand(ApplicationContext applicationContext,
      DatabaseHandler databaseHandler) {
    this.applicationContext = applicationContext;
    this.databaseHandler = databaseHandler;
  }

  protected Handle getDbHandle() {
    return databaseHandler.getHandle();
  }

  protected void closeDbHandle(Handle handle) {
    databaseHandler.closeHandle(handle);
  }

  @Command(command = "dbScript", description = "Executes a SQL script",
      interactionMode = InteractionMode.NONINTERACTIVE)
  public void dbScript(@Option(longNames = "sqlFile", shortNames = 'S',
      description = "the SQL file", required = true) String sqlFile) {
    int exitCode = 1;
    final Handle handle = getDbHandle();
    try {
      // scan:ignore — false positive, we *want* to run the user-provided SQL script
      final String sqlScript = new String(Files.readAllBytes(Paths.get(sqlFile)));
      logger.info("Running SQL script: {}", sqlFile);
      if (handle.createScript(sqlScript).execute() != null) {
        exitCode = 0;
      }
    } catch (Exception e) {
      logger.error("Error running SQL script", e);
    } finally {
      closeDbHandle(handle);
      Utils.exit(applicationContext, exitCode);
    }
  }

}
