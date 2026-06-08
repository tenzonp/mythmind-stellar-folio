REVOKE INSERT, UPDATE, DELETE ON public.blogs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.news FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.faqs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.site_content FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

GRANT SELECT ON public.blogs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT ALL ON public.blogs TO service_role;

GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;

GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;