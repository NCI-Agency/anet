package mil.dds.anet;

import com.google.common.collect.ImmutableList;
import io.dropwizard.Application;
import io.dropwizard.cli.EnvironmentCommand;
import io.dropwizard.setup.Environment;
import java.util.List;
import java.util.Scanner;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import net.sourceforge.argparse4j.inf.Namespace;

public class InitializationCommand extends EnvironmentCommand<AnetConfiguration> {

  private final Application<AnetConfiguration> application;

  protected InitializationCommand(Application<AnetConfiguration> application) {
    super(application, "init", "Initializes the ANET Database");
    this.application = application;
  }

  @Override
  protected void run(Environment environment, Namespace namespace, AnetConfiguration configuration)
      throws Exception {
    final String dbUrl = configuration.getDataSourceFactory().getUrl();
    final AnetObjectEngine engine = new AnetObjectEngine(dbUrl, application);

    System.out.println("-------- WELCOME TO ANET! --------");
    System.out.println("We're going to ask you a few questions to get ANET set up.");
    System.out.println();
    System.out.println("Detecting state of database...");

    final PersonSearchQuery psq = new PersonSearchQuery();
    final List<Person> currPeople = engine.getPersonDao().search(psq).getList();
    if (!currPeople.isEmpty()) {
      System.out.println("ERROR: Data detected in database");
      System.out.println("\tThis task can only be run on an empty database");
      System.exit(1);
      return;
    }
    System.out.println("OK!");
    System.out.println();
    System.out.println("Please provide the following information:");
    Scanner scanner = new Scanner(System.in);

    // Set Classification String
    System.out.print("Classification String >>");
    AdminSetting classifString = new AdminSetting();
    classifString.setKey(AdminSettingKeys.SECURITY_BANNER_TEXT.name());
    classifString.setValue(scanner.nextLine());
    engine.getAdminDao().saveSetting(classifString);
    System.out.println("... Saved!");

    // Set Classification Color
    System.out.print("Classification Color >>");
    AdminSetting classifColor = new AdminSetting();
    classifColor.setKey(AdminSettingKeys.SECURITY_BANNER_COLOR.name());
    classifColor.setValue(scanner.nextLine());
    engine.getAdminDao().saveSetting(classifColor);
    System.out.println("... Saved!");

    // Create First Organization
    System.out.print("Name of Administrator Organization >>");
    Organization adminOrg = new Organization();
    adminOrg.setType(OrganizationType.ADVISOR_ORG);
    adminOrg.setShortName(scanner.nextLine());
    adminOrg.setStatus(Organization.OrganizationStatus.ACTIVE);
    adminOrg = engine.getOrganizationDao().insert(adminOrg);
    System.out.println("... Organization " + adminOrg.getUuid() + " Saved!");

    // Create First Position
    System.out.print("Name of Administrator Position >>");
    Position adminPos = new Position();
    adminPos.setType(PositionType.ADMINISTRATOR);
    adminPos.setOrganizationUuid(adminOrg.getUuid());
    adminPos.setName(scanner.nextLine());
    adminPos.setStatus(Position.PositionStatus.ACTIVE);
    adminPos = engine.getPositionDao().insert(adminPos);
    System.out.println("... Position " + adminPos.getUuid() + " Saved!");

    // Create First User
    System.out.print("Your Name [LAST NAME, First name(s)] >>");
    Person admin = new Person();
    admin.setName(scanner.nextLine());
    System.out.print("Your Domain Username >>");
    admin.setDomainUsername(scanner.nextLine());
    admin.setRole(Role.ADVISOR);
    admin.setStatus(PersonStatus.ACTIVE);
    admin = engine.getPersonDao().insert(admin);
    engine.getPositionDao().setPersonInPosition(admin.getUuid(), adminPos.getUuid());
    System.out.println("... Person " + admin.getUuid() + " Saved!");

    // Set Default Approval Chain.
    System.out.println("Setting you as the default approver...");
    AdminSetting defaultOrg = new AdminSetting();
    defaultOrg.setKey(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION.name());
    defaultOrg.setValue(adminOrg.getUuid());
    engine.getAdminDao().saveSetting(defaultOrg);

    ApprovalStep defaultStep = new ApprovalStep();
    defaultStep.setName("Default Approver");
    defaultStep.setAdvisorOrganizationUuid(adminOrg.getUuid());
    defaultStep.setApprovers(ImmutableList.of(adminPos));
    engine.getApprovalStepDao().insert(defaultStep);
    System.out.println("DONE!");

    AdminSetting contactEmail = new AdminSetting();
    contactEmail.setKey(AdminSettingKeys.CONTACT_EMAIL.name());
    contactEmail.setValue("");
    engine.getAdminDao().saveSetting(contactEmail);

    AdminSetting helpUrl = new AdminSetting();
    helpUrl.setKey(AdminSettingKeys.HELP_LINK_URL.name());
    helpUrl.setValue("");
    engine.getAdminDao().saveSetting(helpUrl);

    System.out.println();
    System.out.println("All Done! You should be able to start the server now and log in");

    scanner.close();
    System.exit(0);
  }

}
