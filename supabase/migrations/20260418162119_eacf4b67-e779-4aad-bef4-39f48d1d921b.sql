ALTER TABLE public.user_credentials
ADD COLUMN xero_tenant_id text,
ADD COLUMN xero_organization_id text,
ADD COLUMN qb_realm_id text;