package mil.dds.anet.utils;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

import com.codahale.metrics.MetricRegistry;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.NoteRelatedObject;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.ReportSensitiveInformation;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.Task;

import org.dataloader.BatchLoader;
import org.dataloader.DataLoader;
import org.dataloader.DataLoaderOptions;
import org.dataloader.DataLoaderRegistry;
import org.dataloader.stats.Statistics;
import org.dataloader.stats.ThreadLocalStatisticsCollector;

public final class BatchingUtils {
	
	private BatchingUtils() {}

	public static DataLoaderRegistry registerDataLoaders(AnetObjectEngine engine, boolean batchingEnabled, boolean cachingEnabled) {
		final DataLoaderOptions dataLoaderOptions = DataLoaderOptions.newOptions()
				.setStatisticsCollector(() -> new ThreadLocalStatisticsCollector()).setBatchingEnabled(batchingEnabled)
				.setCachingEnabled(cachingEnabled).setMaxBatchSize(1000);
		final DataLoaderRegistry dataLoaderRegistry = new DataLoaderRegistry();

		dataLoaderRegistry.register("approvalSteps", new DataLoader<>(new BatchLoader<String, ApprovalStep>() {
			@Override
			public CompletionStage<List<ApprovalStep>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getApprovalStepDao().getByIds(keys));
		}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("approvalStep.approvers", new DataLoader<>(new BatchLoader<String, List<Position>>() {
			@Override
			public CompletionStage<List<List<Position>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getApprovalStepDao().getApprovers(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("authorizationGroups", new DataLoader<>(new BatchLoader<String, AuthorizationGroup>() {
			@Override
			public CompletionStage<List<AuthorizationGroup>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getAuthorizationGroupDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("authorizationGroup.positions", new DataLoader<>(new BatchLoader<String, List<Position>>() {
			@Override
			public CompletionStage<List<List<Position>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getAuthorizationGroupDao().getPositions(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("comments", new DataLoader<>(new BatchLoader<String, Comment>() {
			@Override
			public CompletionStage<List<Comment>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getCommentDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("locations", new DataLoader<>(new BatchLoader<String, Location>() {
			@Override
			public CompletionStage<List<Location>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getLocationDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("note.noteRelatedObjects", new DataLoader<>(new BatchLoader<String, List<NoteRelatedObject>>() {
			@Override
			public CompletionStage<List<List<NoteRelatedObject>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getNoteDao().getNoteRelatedObjects(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("noteRelatedObject.notes", new DataLoader<>(new BatchLoader<String, List<Note>>() {
			@Override
			public CompletionStage<List<List<Note>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getNoteDao().getNotes(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("organizations", new DataLoader<>(new BatchLoader<String, Organization>() {
			@Override
			public CompletionStage<List<Organization>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getOrganizationDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("organization.approvalSteps", new DataLoader<>(new BatchLoader<String, List<ApprovalStep>>() {
			@Override
			public CompletionStage<List<List<ApprovalStep>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getApprovalStepDao().getApprovalSteps(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("people", new DataLoader<>(new BatchLoader<String, Person>() {
			@Override
			public CompletionStage<List<Person>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getPersonDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("person.organizations", new DataLoader<>(new BatchLoader<String, List<Organization>>() {
			@Override
			public CompletionStage<List<List<Organization>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getOrganizationDao().getOrganizations(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("person.personPositionHistory", new DataLoader<>(new BatchLoader<String, List<PersonPositionHistory>>() {
			@Override
			public CompletionStage<List<List<PersonPositionHistory>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getPersonDao().getPersonPositionHistory(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("positions", new DataLoader<>(new BatchLoader<String, Position>() {
			@Override
			public CompletionStage<List<Position>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getPositionDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("position.personPositionHistory", new DataLoader<>(new BatchLoader<String, List<PersonPositionHistory>>() {
			@Override
			public CompletionStage<List<List<PersonPositionHistory>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getPositionDao().getPersonPositionHistory(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("reports", new DataLoader<>(new BatchLoader<String, Report>() {
			@Override
			public CompletionStage<List<Report>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getReportDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("report.approvalActions", new DataLoader<>(new BatchLoader<String, List<ApprovalAction>>() {
			@Override
			public CompletionStage<List<List<ApprovalAction>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getApprovalActionDao().getApprovalActions(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("report.attendees", new DataLoader<>(new BatchLoader<String, List<ReportPerson>>() {
			@Override
			public CompletionStage<List<List<ReportPerson>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getReportDao().getAttendees(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("report.reportSensitiveInformation", new DataLoader<>(new BatchLoader<String, List<ReportSensitiveInformation>>() {
			@Override
			public CompletionStage<List<List<ReportSensitiveInformation>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getReportSensitiveInformationDao().getReportSensitiveInformation(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("report.tags", new DataLoader<>(new BatchLoader<String, List<Tag>>() {
			@Override
			public CompletionStage<List<List<Tag>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getReportDao().getTags(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("report.tasks", new DataLoader<>(new BatchLoader<String, List<Task>>() {
			@Override
			public CompletionStage<List<List<Task>>> load(List<String> foreignKeys) {
				return CompletableFuture.supplyAsync(() -> engine.getReportDao().getTasks(foreignKeys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("tags", new DataLoader<>(new BatchLoader<String, Tag>() {
			@Override
			public CompletionStage<List<Tag>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getTagDao().getByIds(keys));
			}
		}, dataLoaderOptions));
		dataLoaderRegistry.register("tasks", new DataLoader<>(new BatchLoader<String, Task>() {
			@Override
			public CompletionStage<List<Task>> load(List<String> keys) {
				return CompletableFuture.supplyAsync(() -> engine.getTaskDao().getByIds(keys));
			}
		}, dataLoaderOptions));
	
		return dataLoaderRegistry;
	}

	public static void updateStats(MetricRegistry metricRegistry, DataLoaderRegistry dataLoaderRegistry) {
		// Combined stats for all data loaders
		updateStats(metricRegistry, "DataLoaderRegistry", dataLoaderRegistry.getStatistics());
		for (final String key : dataLoaderRegistry.getKeys()) {
			// Individual stats per data loader
			updateStats(metricRegistry, key, dataLoaderRegistry.getDataLoader(key).getStatistics());
		}
	}

	private static void updateStats(MetricRegistry metricRegistry, String name, Statistics statistics) {
		metricRegistry.counter(MetricRegistry.name(name, "BatchInvokeCount"))
			.inc(statistics.getBatchInvokeCount());
		metricRegistry.counter(MetricRegistry.name(name, "BatchLoadCount"))
			.inc(statistics.getBatchLoadCount());
		metricRegistry.counter(MetricRegistry.name(name, "BatchLoadExceptionCount"))
			.inc(statistics.getBatchLoadExceptionCount());
		metricRegistry.counter(MetricRegistry.name(name, "CacheHitCount"))
			.inc(statistics.getCacheHitCount());
		metricRegistry.counter(MetricRegistry.name(name, "CacheMissCount"))
			.inc(statistics.getCacheMissCount());
		metricRegistry.counter(MetricRegistry.name(name, "LoadCount"))
			.inc(statistics.getLoadCount());
		metricRegistry.counter(MetricRegistry.name(name, "LoadErrorCount"))
			.inc(statistics.getLoadErrorCount());
	}

}
