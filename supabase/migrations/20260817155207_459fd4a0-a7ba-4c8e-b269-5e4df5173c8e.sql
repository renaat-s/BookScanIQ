UPDATE public.ledger_entries
SET type = 'uncategorized', original_type = NULL, updated_at = now()
WHERE id IN ('3a87e3bc-8ea4-430d-9faa-14e97d0d8ad7', 'cd747c76-7d43-45d1-b0af-0c421ca1f2e5');