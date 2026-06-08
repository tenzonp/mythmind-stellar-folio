DROP POLICY IF EXISTS "public reads published blogs" ON public.blogs;
DROP POLICY IF EXISTS "public reads published news" ON public.news;
DROP POLICY IF EXISTS "public reads published faqs" ON public.faqs;

CREATE POLICY "public reads published blogs" ON public.blogs FOR SELECT TO public USING (published = true);
CREATE POLICY "admins read all blogs" ON public.blogs FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

CREATE POLICY "public reads published news" ON public.news FOR SELECT TO public USING (published = true);
CREATE POLICY "admins read all news" ON public.news FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));

CREATE POLICY "public reads published faqs" ON public.faqs FOR SELECT TO public USING (published = true);
CREATE POLICY "admins read all faqs" ON public.faqs FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'));