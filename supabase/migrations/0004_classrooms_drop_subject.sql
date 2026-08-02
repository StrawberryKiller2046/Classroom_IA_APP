-- A classroom is now just a named group of students at a grade level
-- (e.g. "6B"), not tied to a single subject — a teacher who teaches both
-- Math and Science to the same group no longer needs two duplicate
-- classrooms with the same roster typed in twice. Subject now lives
-- entirely on activities, which can each be linked to any classroom.
alter table public.classrooms
  drop column if exists subject;
