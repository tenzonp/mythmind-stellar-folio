CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "public reads published blogs" ON public.blogs;
DROP POLICY IF EXISTS "admins write blogs" ON public.blogs;
DROP POLICY IF EXISTS "public reads published news" ON public.news;
DROP POLICY IF EXISTS "admins write news" ON public.news;
DROP POLICY IF EXISTS "public reads published faqs" ON public.faqs;
DROP POLICY IF EXISTS "admins write faqs" ON public.faqs;
DROP POLICY IF EXISTS "admins write content" ON public.site_content;

CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE POLICY "public reads published blogs" ON public.blogs FOR SELECT USING (published = true OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write blogs" ON public.blogs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE POLICY "public reads published news" ON public.news FOR SELECT USING (published = true OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write news" ON public.news FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE POLICY "public reads published faqs" ON public.faqs FOR SELECT USING (published = true OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write faqs" ON public.faqs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

CREATE POLICY "admins write content" ON public.site_content FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;