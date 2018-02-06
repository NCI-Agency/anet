package mil.dds.anet.beans;

import java.util.LinkedList;
import java.util.List;

import org.joda.time.DateTime;

import mil.dds.anet.emails.AnetEmailAction;

public class AnetEmail {
	Integer id;
	AnetEmailAction action;
	List<String> toAddresses;
	DateTime createdAt;
	String comment;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public AnetEmailAction getAction() {
		return action;
	}

	public void setAction(AnetEmailAction action) {
		this.action = action;
	}

	public List<String> getToAddresses() {
		return toAddresses;
	}

	public void setToAddresses(List<String> toAddresses) {
		this.toAddresses = toAddresses;
	}

	public void addToAddress(String toAddress) {
		if (toAddresses == null) { toAddresses = new LinkedList<String>(); }
		toAddresses.add(toAddress);
	}

	public DateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(DateTime createdAt) {
		this.createdAt = createdAt;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}
}
