			CREATE OR REPLACE FUNCTION get_cf_referenced_objects(table_name text, column_name text)
				RETURNS table(uuid uuid, object_table text, object_uuid text)
			AS
			'
			BEGIN
				RETURN QUERY EXECUTE format(
					''WITH links AS ('' ||
					''  SELECT uuid, regexp_matches(%I, ''''\\"urn:anet:(attachments|authorizationGroups|events|eventSeries|locations|organizations|people|positions|reports|tasks):([^\\]*)\\"|{"type":"(Attachment|AuthorizationGroup|Event|EventSeries|Location|Organization|Person|Position|Report|Task)","uuid":"([^"]*)"}'''', ''''g'''') AS arr FROM public.%I'' ||
					'')'' ||
					''  SELECT uuid,'' ||
					''  CASE WHEN arr[1] IS NOT NULL THEN arr[1] ELSE'' ||
					''    CASE'' ||
					''      WHEN arr[3] = ''''Attachment'''' THEN ''''attachments'''' '' ||
					''      WHEN arr[3] = ''''AuthorizationGroup'''' THEN ''''authorizationGroups'''' '' ||
					''      WHEN arr[3] = ''''Event'''' THEN ''''events'''' '' ||
					''      WHEN arr[3] = ''''EventSeries'''' THEN ''''eventSeries'''' '' ||
					''      WHEN arr[3] = ''''Location'''' THEN ''''locations'''' '' ||
					''      WHEN arr[3] = ''''Organization'''' THEN ''''organizations'''' '' ||
					''      WHEN arr[3] = ''''Person'''' THEN ''''people'''' '' ||
					''      WHEN arr[3] = ''''Position'''' THEN ''''positions'''' '' ||
					''      WHEN arr[3] = ''''Report'''' THEN ''''reports'''' '' ||
					''      WHEN arr[3] = ''''Task'''' THEN ''''tasks'''' '' ||
					''    END'' ||
					''  END,'' ||
					''  CASE WHEN arr[2] IS NOT NULL THEN arr[2] ELSE arr[4] END'' ||
					''  FROM links'',
					column_name, table_name
				);
			END;
			'
			LANGUAGE plpgsql
			IMMUTABLE;
