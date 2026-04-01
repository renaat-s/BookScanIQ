
ALTER TABLE public.user_credentials
  ADD COLUMN folder_mapping jsonb,
  ADD COLUMN user_spreadsheet_id text,
  ADD COLUMN root_folder_id text;
