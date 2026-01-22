package mil.dds.anet.commands;

import mil.dds.anet.config.AnetDictionary;
import org.springframework.context.ApplicationContext;
import org.springframework.shell.command.annotation.Command;
import org.springframework.shell.context.InteractionMode;
import org.springframework.shell.standard.ShellComponent;

@ShellComponent
@Command(group = "ANET commands")
public class AnetCheckCommand {

  private final ApplicationContext applicationContext;

  public AnetCheckCommand(ApplicationContext applicationContext) {
    this.applicationContext = applicationContext;
  }

  /**
   * The dictionary is loaded and validated in {@link AnetDictionary#init()} and will either log the
   * dictionary when valid, or throw an Exception, in which case this code will never be reached and
   * the application will terminate abnormally.
   */
  @Command(command = "check", description = "Checks the ANET dictionary",
      interactionMode = InteractionMode.NONINTERACTIVE)
  public void check() {
    // Dictionary is valid, exit with success
    Utils.exit(applicationContext, 0);
  }

}
