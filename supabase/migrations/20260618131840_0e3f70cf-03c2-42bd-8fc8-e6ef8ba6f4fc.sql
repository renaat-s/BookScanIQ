ALTER TABLE public.user_credentials
ADD COLUMN IF NOT EXISTS uncat_folder_id text;