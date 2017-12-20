package mil.dds.anet.test;

import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.RollupGraph;

public class TestData {

	public static RollupGraph createRollupGraph() {
		
		RollupGraph rollupGraph = new RollupGraph();
		rollupGraph.setCancelled(0);
		rollupGraph.setOrg(createOrganization());
		rollupGraph.setReleased(1);
		
		return rollupGraph;
	}

	public static Organization createOrganization() {
		Organization org = new Organization();
		
		org.setLongName("longName");
		
		return org;
	}

}
