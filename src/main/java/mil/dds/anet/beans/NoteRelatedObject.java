package mil.dds.anet.beans;

import java.time.Instant;
import java.util.List;

import io.leangen.graphql.annotations.GraphQLIgnore;

import javax.ws.rs.WebApplicationException;

import mil.dds.anet.views.AbstractAnetBean;

public class NoteRelatedObject extends AbstractAnetBean {

	private String noteUuid;
	private String relatedObjectType;
	private String relatedObjectUuid;

	@Override
	@GraphQLIgnore
	public String getUuid() {
		throw new WebApplicationException("no UUID field on NoteRelatedObject");
	}

	@Override
	@GraphQLIgnore
	public Instant getCreatedAt() {
		throw new WebApplicationException("no createdAt field on NoteRelatedObject");
	}

	@Override
	@GraphQLIgnore
	public Instant getUpdatedAt() {
		throw new WebApplicationException("no updatedAt field on NoteRelatedObject");
	}

	@Override
	@GraphQLIgnore
	public List<Note> getNotes() {
		throw new WebApplicationException("no notes field on NoteRelatedObject");
	}

	public String getNoteUuid() {
		return noteUuid;
	}

	public void setNoteUuid(String noteUuid) {
		this.noteUuid = noteUuid;
	}

	public String getRelatedObjectType() {
		return relatedObjectType;
	}

	public void setRelatedObjectType(String relatedObjectType) {
		this.relatedObjectType = relatedObjectType;
	}

	public String getRelatedObjectUuid() {
		return relatedObjectUuid;
	}

	public void setRelatedObjectUuid(String relatedObjectUuid) {
		this.relatedObjectUuid = relatedObjectUuid;
	}

}
