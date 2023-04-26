package mil.dds.anet;

import io.dropwizard.core.Application;
import io.dropwizard.core.cli.EnvironmentCommand;
import io.dropwizard.core.setup.Environment;
import java.util.List;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.ApprovalStep.ApprovalStepType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import net.sourceforge.argparse4j.impl.Arguments;
import net.sourceforge.argparse4j.inf.Namespace;
import net.sourceforge.argparse4j.inf.Subparser;

public class InitializationCommand extends EnvironmentCommand<AnetConfiguration> {

  protected InitializationCommand(Application<AnetConfiguration> application) {
    super(application, "init", "Initializes the ANET Database");
  }

  @Override
  public void configure(Subparser subparser) {
    subparser.addArgument("--adminOrgName").action(Arguments.store()).required(true)
        .help("set administrative organization name");
    subparser.addArgument("--adminPosName").action(Arguments.store()).required(true)
        .help("set administrative position name");
    subparser.addArgument("--adminFullName").action(Arguments.store()).required(true)
        .help("set administrator's full name; use format: LASTNAME, Firstname");
    subparser.addArgument("--adminDomainUsername").action(Arguments.store()).required(true)
        .help("set administrator's domain username");

    super.configure(subparser);
  }

  @Override
  protected void run(Environment environment, Namespace namespace, AnetConfiguration configuration)
      throws Exception {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();

    checkPreconditions(engine);
    final String defaultApprovalOrgUuid = createInitialAdministrator(namespace, engine);
    saveAdminSettings(engine, defaultApprovalOrgUuid);

    System.exit(0);
  }

  private void checkPreconditions(final AnetObjectEngine engine) {
    try {
      checkOrganizations(engine);
      checkPositions(engine);
      checkPeople(engine);
    } catch (Exception e) {
      exitWithError("ERROR: Could not query database: " + e.getMessage(),
          "\tDid you run all migrations?");
    }
  }

  private void checkOrganizations(final AnetObjectEngine engine) {
    if (!engine.getOrganizationDao().search(new OrganizationSearchQuery()).getList().isEmpty()) {
      exitWithError("ERROR: Existing organizations detected in database",
          "\tThis task can only be run on an otherwise empty database");
    }
  }

  private void checkPositions(final AnetObjectEngine engine) {
    if (!engine.getPositionDao().search(new PositionSearchQuery()).getList().isEmpty()) {
      exitWithError("ERROR: Existing positions detected in database",
          "\tThis task can only be run on an otherwise empty database");
    }
  }

  private void checkPeople(final AnetObjectEngine engine) {
    final List<Person> currPeople = engine.getPersonDao().search(new PersonSearchQuery()).getList();
    if (currPeople.isEmpty()) {
      exitWithError("ERROR: ANET Importer missing from database",
          "\tYou should run all migrations first");
    }
    // Only person should be "ANET Importer"
    if (currPeople.size() != 1 || !"ANET Importer".equals(currPeople.get(0).getName())) {
      exitWithError("ERROR: Other people besides ANET Importer detected in database",
          "\tThis task can only be run on an otherwise empty database");
    }
  }

  private void exitWithError(final String errorMessage, final String userHint) {
    System.err.println(errorMessage);
    System.err.println(userHint);
    System.exit(1);
  }

  private String createInitialAdministrator(Namespace namespace, AnetObjectEngine engine) {
    // Create admin organization
    Organization adminOrg = new Organization();
    adminOrg.setShortName(namespace.getString("adminOrgName"));
    adminOrg.setStatus(Organization.Status.ACTIVE);
    adminOrg = engine.getOrganizationDao().insert(adminOrg);

    // Create admin position
    Position adminPos = new Position();
    adminPos.setType(PositionType.ADMINISTRATOR);
    adminPos.setOrganizationUuid(adminOrg.getUuid());
    adminPos.setName(namespace.getString("adminPosName"));
    adminPos.setStatus(Position.Status.ACTIVE);
    adminPos.setRole(Position.PositionRole.MEMBER);
    adminPos = engine.getPositionDao().insert(adminPos);

    // Create admin user
    Person admin = new Person();
    admin.setName(namespace.getString("adminFullName"));
    admin.setDomainUsername(namespace.getString("adminDomainUsername"));
    admin = engine.getPersonDao().insert(admin);
    engine.getPositionDao().setPersonInPosition(admin.getUuid(), adminPos.getUuid());

    // Create default approval workflow
    final ApprovalStep defaultStep = new ApprovalStep();
    defaultStep.setName("Default Approver");
    defaultStep.setType(ApprovalStepType.REPORT_APPROVAL);
    defaultStep.setRelatedObjectUuid(adminOrg.getUuid());
    defaultStep.setApprovers(List.of(adminPos));
    engine.getApprovalStepDao().insert(defaultStep);

    return adminOrg.getUuid();
  }

  private void saveAdminSettings(final AnetObjectEngine engine,
      final String defaultApprovalOrgUuid) {
    // Set Default Approval Chain.
    saveAdminSetting(engine, AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION,
        defaultApprovalOrgUuid);

    // Set Classification String as default
    saveAdminSetting(engine, AdminSettingKeys.SECURITY_BANNER_CLASSIFICATION, "NATO UNCLASSIFIED");

    // Set Releasablility String as default
    saveAdminSetting(engine, AdminSettingKeys.SECURITY_BANNER_RELEASABILITY,
        "releasable to Finland and Sweden");

    // Set Classification Color as default
    saveAdminSetting(engine, AdminSettingKeys.SECURITY_BANNER_COLOR, "GREEN");

    // Set contact email as default
    saveAdminSetting(engine, AdminSettingKeys.CONTACT_EMAIL, "team-anet@example.com");

    // Set help link url as default
    saveAdminSetting(engine, AdminSettingKeys.HELP_LINK_URL, "http://google.com");

    // Set empty external documentation link text
    saveAdminSetting(engine, AdminSettingKeys.EXTERNAL_DOCUMENTATION_LINK_TEXT, "");

    // Set general banner level as default
    saveAdminSetting(engine, AdminSettingKeys.GENERAL_BANNER_LEVEL, "notice");

    // Set empty general banner text
    saveAdminSetting(engine, AdminSettingKeys.GENERAL_BANNER_TEXT, "");

    // Set general banner visibility as default
    saveAdminSetting(engine, AdminSettingKeys.GENERAL_BANNER_VISIBILITY, "1");

    // Set daily rollup max report age days as default
    saveAdminSetting(engine, AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, "14");
  }

  private void saveAdminSetting(final AnetObjectEngine engine, final AdminSettingKeys key,
      final String value) {
    final AdminSetting adminSetting = new AdminSetting();
    adminSetting.setKey(key.name());
    adminSetting.setValue(value);
    engine.getAdminDao().saveSetting(adminSetting);
  }

}
