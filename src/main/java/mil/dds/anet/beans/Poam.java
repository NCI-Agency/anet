package mil.dds.anet.beans;

import java.util.List;
import java.util.Objects;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLIgnore;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Poam extends AbstractAnetBean {

	public enum PoamStatus { ACTIVE, INACTIVE }
	
	String shortName;
	String longName;
	String category;
	Poam parentPoam;
	List<Poam> childrenPoams;
	
	PoamStatus status;
	
	Organization responsibleOrg;

	public String getShortName() {
		return shortName;
	}
	
	public void setShortName(String shortName) {
		this.shortName = Utils.trimStringReturnNull(shortName);
	}
	
	public String getLongName() {
		return longName;
	}
	
	public void setLongName(String longName) {
		this.longName = Utils.trimStringReturnNull(longName);
	}
	
	public String getCategory() {
		return category;
	}
	
	public void setCategory(String category) {
		this.category = Utils.trimStringReturnNull(category);
	}
	
	@GraphQLFetcher("parentPoam")
	public Poam loadParentPoam() {
		if (parentPoam == null || parentPoam.getLoadLevel() == null) { return parentPoam; }
		if (parentPoam.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.parentPoam = AnetObjectEngine.getInstance()
					.getPoamDao().getById(parentPoam.getId());
		}
		return parentPoam;
	}
	
	public void setParentPoam(Poam parent) {
		this.parentPoam = parent;
	}
	
	@GraphQLIgnore
	public Poam getParentPoam() { 
		return this.parentPoam;
	}
	
	@GraphQLFetcher("childrenPoams")
	public List<Poam> loadChildrenPoams() { 
		if (childrenPoams == null) { 
			childrenPoams = AnetObjectEngine.getInstance()
					.getPoamDao().getPoamsByParentId(this.getId());
		}
		return childrenPoams;
	}
	
	@GraphQLIgnore
	public List<Poam> getChildrenPoams() { 
		return childrenPoams;
	}
	
	public void setChildrenPoams(List<Poam> childrenPoams) { 
		this.childrenPoams = childrenPoams;
	}
	
	public PoamStatus getStatus() {
		return status;
	}

	public void setStatus(PoamStatus status) {
		this.status = status;
	}

	public void setResponsibleOrg(Organization org) { 
		this.responsibleOrg = org;
	}
	
	@GraphQLFetcher("responsibleOrg")
	public Organization loadResponsibleOrg() {
		if (responsibleOrg == null || responsibleOrg.getLoadLevel() == null) { return responsibleOrg; } 
		if (responsibleOrg.getLoadLevel().contains(LoadLevel.PROPERTIES) == false) { 
			this.responsibleOrg = AnetObjectEngine.getInstance()
					.getOrganizationDao().getById(responsibleOrg.getId());
		}
		return responsibleOrg;
	}
	
	@GraphQLIgnore
	public Organization getResponsibleOrg() { 
		return responsibleOrg;
	}
	
	public static Poam create(String shortName, String longName, String category) { 
		return create(shortName, longName, category, null, null, PoamStatus.ACTIVE);
	}
	
	public static Poam create(String shortName, String longName, String category, Poam parent, Organization responsibleOrg, PoamStatus status) { 
		Poam p = new Poam();
		p.setShortName(shortName);
		p.setLongName(longName);
		p.setCategory(category);
		p.setParentPoam(parent);
		p.setResponsibleOrg(responsibleOrg);
		p.setStatus(status);
		return p;
	}
	
	public static Poam createWithId(Integer id) { 
		Poam p = new Poam();
		p.setId(id);
		p.setLoadLevel(LoadLevel.ID_ONLY);
		return p;
	}
	
	@Override
	public boolean equals(Object o) { 
		if (o == null || o.getClass() != this.getClass()) { 
			return false;
		}
		Poam other = (Poam) o;
		return Objects.equals(other.getId(), id) 
				&& Objects.equals(other.getShortName(), shortName) 
				&& Objects.equals(other.getLongName(), longName) 
				&& Objects.equals(other.getCategory(), category) 
				&& idEqual(other.getParentPoam(), parentPoam);
	}
	
	@Override
	public int hashCode() { 
		return Objects.hash(id, shortName, longName, category, parentPoam);
	}
	
	@Override
	public String toString() { 
		return String.format("[id:%d shortName:%s category:%s parentPoam:%d]", id, shortName, category, DaoUtils.getId(parentPoam));
	}
	
}
