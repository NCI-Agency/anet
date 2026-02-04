package mil.dds.anet.commands;

import static mil.dds.anet.commands.Utils.ANET_COMMAND_GROUP;

import java.lang.invoke.MethodHandles;
import java.nio.file.Files;
import java.nio.file.Paths;
import mil.dds.anet.database.DatabaseHandler;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.shell.core.command.annotation.Command;
import org.springframework.shell.core.command.annotation.Option;
import org.springframework.stereotype.Component;

@Component
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

  @Command(group = ANET_COMMAND_GROUP, name = "dbScript", description = "Executes a SQL script")
  public void dbScript(@Option(longName = "sqlFile", shortName = 'S', description = "the SQL file",
      required = true) String sqlFile) {
    final Handle handle = getDbHandle();
    try {
      // scan:ignore — false positive, we *want* to run the user-provided SQL script
      final String sqlScript = new String(Files.readAllBytes(Paths.get(sqlFile)));
      logger.info("Running SQL script: {}", sqlFile);
      handle.createScript(sqlScript).execute();
    } catch (Exception e) {
      logger.error("Error running SQL script", e);
      Utils.exitWithError(applicationContext);
    } finally {
      closeDbHandle(handle);
    }
  }

}
