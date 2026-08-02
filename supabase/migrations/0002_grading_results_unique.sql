-- One current grade per student per activity. Regrading a student now
-- replaces their existing row (upsert) instead of adding a second one that
-- would double-count them in averages and "graded submissions" totals.
alter table public.grading_results
  drop constraint if exists grading_results_student_activity_unique;
alter table public.grading_results
  add constraint grading_results_student_activity_unique unique (student_id, activity_id);
