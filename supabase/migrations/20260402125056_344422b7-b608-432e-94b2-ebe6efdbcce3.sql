ALTER TABLE public.user_credentials
ADD COLUMN xero_expense_account text DEFAULT '970',
ADD COLUMN xero_income_account text DEFAULT '400',
ADD COLUMN quickbooks_expense_account text DEFAULT 'EXP',
ADD COLUMN quickbooks_income_account text DEFAULT 'INC';