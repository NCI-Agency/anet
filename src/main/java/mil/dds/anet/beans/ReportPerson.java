package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({ "_loaded" })
public class ReportPerson extends Person {

	boolean primary;

	public ReportPerson() { 
		this.primary = false; // Default
	}
	
	public boolean isPrimary() {
		return primary;
	}

	public void setPrimary(boolean primary) {
		this.primary = primary;
	}
	
	@Override
	public boolean equals(Object o) { 
		if (o == null || getClass() != o.getClass()) { 
			return false;
		}
		ReportPerson rp = (ReportPerson) o;
		return super.equals(o) 
			&& primary == rp.isPrimary();
	}
	
	@Override
	public int hashCode() { 
		return super.hashCode() * ((primary) ? 7 : -7);
	}

	public static ReportPerson createWithUuid(String uuid) {
		final ReportPerson rp = new ReportPerson();
		rp.setUuid(uuid);
		rp.setLoadLevel(LoadLevel.ID_ONLY);
		return rp;
	}

}
