package mil.dds.anet.config;

import mil.dds.anet.commands.CustomNonInteractiveShellRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.shell.core.ShellRunner;
import org.springframework.shell.core.command.CommandParser;
import org.springframework.shell.core.command.CommandRegistry;
import org.springframework.stereotype.Component;

@Component
public class ShellConfig {

  private final CommandParser commandParser;
  private final CommandRegistry commandRegistry;
  private final ApplicationContext applicationContext;

  public ShellConfig(CommandParser commandParser, CommandRegistry commandRegistry,
      ApplicationContext applicationContext) {
    this.commandParser = commandParser;
    this.commandRegistry = commandRegistry;
    this.applicationContext = applicationContext;
  }

  @Bean
  public ShellRunner shellRunner() {
    return new CustomNonInteractiveShellRunner(commandParser, commandRegistry, applicationContext);
  }

}
