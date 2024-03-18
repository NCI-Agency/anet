package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.resources.ReportResource.RollupGraphComparator;
import mil.dds.anet.test.TestData;
import org.junit.jupiter.api.Test;

class RollupGraphComparatorTest {

  @Test
  void performComparisonTest() {

    List<RollupGraph> rollupGraphs = new ArrayList<>();

    RollupGraph rollupGraph1 = TestData.createRollupGraph();
    rollupGraph1.getOrg().setShortName("d name");
    rollupGraphs.add(rollupGraph1);

    RollupGraph rollupGraph2 = TestData.createRollupGraph();
    rollupGraph2.getOrg().setShortName("b name");
    rollupGraphs.add(rollupGraph2);

    RollupGraph rollupGraph3 = TestData.createRollupGraph();
    rollupGraph3.getOrg().setShortName("c name");
    rollupGraphs.add(rollupGraph3);

    RollupGraph rollupGraph4 = TestData.createRollupGraph();
    rollupGraph4.getOrg().setShortName("a name");
    rollupGraphs.add(rollupGraph4);

    rollupGraphs.sort(new RollupGraphComparator(Arrays.asList("c name", "xxx", "yyy", "b name")));

    assertThat(rollupGraphs.get(0).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("c name");
    assertThat(rollupGraphs.get(1).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("b name");
    assertThat(rollupGraphs.get(2).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("a name");
    assertThat(rollupGraphs.get(3).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("d name");
  }

  @Test
  void performComparisonTestNullOrgs() {

    List<RollupGraph> rollupGraphs = new ArrayList<>();

    RollupGraph rollupGraph1 = TestData.createRollupGraph();
    rollupGraph1.setOrg(null);
    rollupGraphs.add(rollupGraph1);

    RollupGraph rollupGraph2 = TestData.createRollupGraph();
    rollupGraph2.setOrg(null);
    rollupGraphs.add(rollupGraph2);

    RollupGraph rollupGraph3 = TestData.createRollupGraph();
    rollupGraph3.getOrg().setShortName("c name");
    rollupGraphs.add(rollupGraph3);

    RollupGraph rollupGraph4 = TestData.createRollupGraph();
    rollupGraph4.getOrg().setShortName("a name");
    rollupGraphs.add(rollupGraph4);

    rollupGraphs.sort(new RollupGraphComparator(Arrays.asList("c name", "xxx", "yyy", "b name")));

    assertThat(rollupGraphs.get(0).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("c name");
    assertThat(rollupGraphs.get(1).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("a name");
    assertThat(rollupGraphs.get(2).getOrg()).withFailMessage("incorrect org").isNull();
    assertThat(rollupGraphs.get(3).getOrg()).withFailMessage("incorrect org").isNull();
  }

  @Test
  void performComparisonTestEmptyList() {

    List<RollupGraph> rollupGraphs = new ArrayList<>();

    RollupGraph rollupGraph1 = TestData.createRollupGraph();
    rollupGraph1.getOrg().setShortName("a name");
    rollupGraphs.add(rollupGraph1);

    RollupGraph rollupGraph2 = TestData.createRollupGraph();
    rollupGraph2.getOrg().setShortName("c name");
    rollupGraphs.add(rollupGraph2);

    RollupGraph rollupGraph3 = TestData.createRollupGraph();
    rollupGraph3.getOrg().setShortName("b name");
    rollupGraphs.add(rollupGraph3);

    rollupGraphs.sort(new RollupGraphComparator(new ArrayList<>()));

    assertThat(rollupGraphs.get(0).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("a name");
    assertThat(rollupGraphs.get(1).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("b name");
    assertThat(rollupGraphs.get(2).getOrg().getShortName()).withFailMessage("incorrect name")
        .isEqualTo("c name");
  }
}
