package mil.dds.anet.test.beans;

import com.google.common.collect.ImmutableList;
import mil.dds.anet.beans.ApprovalStep;
import org.junit.Test;

public class ApprovalStepTest extends BeanTester<ApprovalStep> {

  // DON'T USE THIS ANYWHERE ELSE!!
  // It has all the foreign keys filled it and is dangerous!
  private static ApprovalStep getTestApprovalStep() {
    ApprovalStep as = new ApprovalStep();
    as.setUuid("42");
    as.setAdvisorOrganizationUuid("22");
    as.setApprovers(ImmutableList.of());
    as.setNextStepUuid("9292");
    return as;
  }

  @Test
  public void serializesToJson() throws Exception {
    serializesToJson(getTestApprovalStep(), "testJson/approvalSteps/testStep.json");
  }

  @Test
  public void deserializesFromJson() throws Exception {
    deserializesFromJson(getTestApprovalStep(), "testJson/approvalSteps/testStep.json");
  }

}
