package mil.dds.anet.commands;

import static mil.dds.anet.commands.Utils.ANET_COMMAND_GROUP;

import java.lang.invoke.MethodHandles;
import mil.dds.anet.config.AnetDictionary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.shell.core.command.annotation.Command;
import org.springframework.stereotype.Component;

@Component
public class AnetCheckCommand {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  /**
   * The dictionary is loaded and validated in {@link AnetDictionary#init()} and will either log the
   * dictionary when valid, or throw an Exception, in which case this code will never be reached and
   * the application will terminate abnormally.
   */
  @Command(group = ANET_COMMAND_GROUP, name = "check", description = "Checks the ANET dictionary")
  public void check() {
    // Dictionary is valid, ShellRunner will exit with success
    logger.info("ANET dictionary is valid");
  }

}
