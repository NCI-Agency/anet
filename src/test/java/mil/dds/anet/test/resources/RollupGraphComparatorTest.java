package mil.dds.anet.test.resources;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.resources.ReportResource.RollupGraphComparator;
import mil.dds.anet.test.TestData;
import org.junit.jupiter.api.Test;

public class RollupGraphComparatorTest {

  @Test
  public void performComparisonTest() {

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

    Collections.sort(rollupGraphs,
        new RollupGraphComparator(Arrays.asList("c name", "xxx", "yyy", "b name")));

    assertEquals("incorrect name", "c name", rollupGraphs.get(0).getOrg().getShortName());
    assertEquals("incorrect name", "b name", rollupGraphs.get(1).getOrg().getShortName());
    assertEquals("incorrect name", "a name", rollupGraphs.get(2).getOrg().getShortName());
    assertEquals("incorrect name", "d name", rollupGraphs.get(3).getOrg().getShortName());

  }

  @Test
  public void performComparisonTestNullOrgs() {

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

    Collections.sort(rollupGraphs,
        new RollupGraphComparator(Arrays.asList("c name", "xxx", "yyy", "b name")));

    assertEquals("incorrect name", "c name", rollupGraphs.get(0).getOrg().getShortName());
    assertEquals("incorrect name", "a name", rollupGraphs.get(1).getOrg().getShortName());
    assertNull("incorrect org", rollupGraphs.get(2).getOrg());
    assertNull("incorrect org", rollupGraphs.get(3).getOrg());

  }

  @Test
  public void performComparisonTestEmptyList() {

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

    Collections.sort(rollupGraphs, new RollupGraphComparator(new ArrayList<>()));

    assertEquals("incorrect name", "a name", rollupGraphs.get(0).getOrg().getShortName());
    assertEquals("incorrect name", "b name", rollupGraphs.get(1).getOrg().getShortName());
    assertEquals("incorrect name", "c name", rollupGraphs.get(2).getOrg().getShortName());

  }
}
