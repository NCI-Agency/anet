package mil.dds.anet.commands;

import java.io.IOException;
import mil.dds.anet.config.AnetDictionary;
import org.springframework.context.ApplicationContext;
import org.springframework.shell.command.annotation.Command;
import org.springframework.shell.context.InteractionMode;
import org.springframework.shell.standard.ShellComponent;

@ShellComponent
@Command(group = "ANET commands")
public class AnetCheckCommand {

  private final ApplicationContext applicationContext;
  private final AnetDictionary dict;

  public AnetCheckCommand(ApplicationContext applicationContext, AnetDictionary dict) {
    this.applicationContext = applicationContext;
    this.dict = dict;
  }

  @Command(command = "check", description = "Checks the ANET dictionary",
      interactionMode = InteractionMode.NONINTERACTIVE)
  public void check() throws IOException {
    int exitCode = 1;
    try {
      if (dict.checkDictionary()) {
        exitCode = 0;
      }
    } finally {
      Utils.exit(applicationContext, exitCode);
    }
  }

}
