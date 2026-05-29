CREATE OR REPLACE FUNCTION public.get_changes_by_chapter(p_month text)
RETURNS TABLE (
  chapter            text,
  measures           integer,
  measures_added     integer,
  measures_removed   integer,
  measures_modified  integer,
  conditions         integer,
  conditions_added   integer,
  exclusions         integer,
  footnotes          integer,
  critical           integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    tc.chapter,
    COUNT(*) FILTER (WHERE tc.table_name = 'taric_measures')::int                                              AS measures,
    COUNT(*) FILTER (WHERE tc.table_name = 'taric_measures' AND tc.change_type = 'added')::int                 AS measures_added,
    COUNT(*) FILTER (WHERE tc.table_name = 'taric_measures' AND tc.change_type = 'removed')::int               AS measures_removed,
    COUNT(*) FILTER (WHERE tc.table_name = 'taric_measures' AND tc.change_type = 'modified')::int              AS measures_modified,
    COUNT(*) FILTER (WHERE tc.table_name = 'measure_conditions')::int                                          AS conditions,
    COUNT(*) FILTER (WHERE tc.table_name = 'measure_conditions' AND tc.change_type = 'added')::int             AS conditions_added,
    COUNT(*) FILTER (WHERE tc.table_name = 'measure_exclusions')::int                                          AS exclusions,
    COUNT(*) FILTER (WHERE tc.table_name NOT IN ('taric_measures','measure_conditions','measure_exclusions'))::int AS footnotes,
    COUNT(*) FILTER (WHERE tc.severity = 'critical')::int                                                      AS critical
  FROM public.taric_changes tc
  WHERE tc.data_month = p_month
    AND tc.chapter IS NOT NULL
  GROUP BY tc.chapter
  ORDER BY tc.chapter;
$$;

GRANT EXECUTE ON FUNCTION public.get_changes_by_chapter(text) TO service_role;
