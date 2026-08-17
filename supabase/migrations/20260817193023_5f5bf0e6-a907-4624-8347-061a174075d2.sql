UPDATE public.ledger_entries
SET review_status = 'pending',
    reviewed_at = NULL,
    exported_at = NULL,
    type = COALESCE(original_type, type)
WHERE id IN ('cd747c76-7d43-45d1-b0af-0c421ca1f2e5', '3a87e3bc-8ea4-430d-9faa-14e97d0d8ad7');