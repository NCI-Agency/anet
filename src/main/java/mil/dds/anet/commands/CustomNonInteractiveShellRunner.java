package mil.dds.anet.commands;

import org.springframework.context.ApplicationContext;
import org.springframework.shell.core.NonInteractiveShellRunner;
import org.springframework.shell.core.command.CommandParser;
import org.springframework.shell.core.command.CommandRegistry;
import org.springframework.util.ObjectUtils;

public class CustomNonInteractiveShellRunner extends NonInteractiveShellRunner {

  private final ApplicationContext applicationContext;

  public CustomNonInteractiveShellRunner(CommandParser commandParser,
      CommandRegistry commandRegistry, ApplicationContext applicationContext) {
    super(commandParser, commandRegistry);
    this.applicationContext = applicationContext;
  }

  @Override
  public void run(String[] args) throws Exception {
    // Only run a command when we actually have one (if not, our Spring Boot application will run)
    if (!ObjectUtils.isEmpty(args)) {
      super.run(args);
      // Command completed successfully, exit with success
      Utils.exitWithSuccess(applicationContext);
    }
  }
}
