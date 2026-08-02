-- The answer key is always generated and saved to activities.answer_key
-- (needed by the Auto-Corrector regardless of PDF preferences), and the
-- activity/answer-key PDFs are now two always-available separate downloads
-- instead of one combined file gated by a toggle. The toggle column is
-- no longer read or written anywhere.
alter table public.activities
  drop column if exists include_answer_sheet;
