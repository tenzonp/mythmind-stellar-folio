import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublishedBlog = {
  id: string;
  slug: string;
  title: string;
  kicker: string | null;
  excerpt: string | null;
  content: string | null;
  cover_color: string | null;
  read_minutes: number | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type PublishedNews = {
  id: string;
  title: string;
  tag: string | null;
  color: string | null;
  excerpt: string | null;
  body: string | null;
  published_at: string | null;
};

export type PublishedFaq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
};

function publicClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase public env vars missing");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getPublishedBlogs = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("blogs")
      .select(
        "id,slug,title,kicker,excerpt,content,cover_color,read_minutes,featured,created_at,updated_at",
      )
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return [] as PublishedBlog[];
    return (data ?? []) as PublishedBlog[];
  } catch {
    return [] as PublishedBlog[];
  }
});

export const getPublishedNews = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("news")
      .select("id,title,tag,color,excerpt,body,published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) return [] as PublishedNews[];
    return (data ?? []) as PublishedNews[];
  } catch {
    return [] as PublishedNews[];
  }
});

export const getPublishedFaqs = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("id,question,answer,category,sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return [] as PublishedFaq[];
    return (data ?? []) as PublishedFaq[];
  } catch {
    return [] as PublishedFaq[];
  }
});

export const getPublicHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("blogs")
      .select(
        "id,slug,title,kicker,excerpt,content,cover_color,read_minutes,featured,created_at,updated_at",
      )
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);
    return { blogs: error ? [] : ((data ?? []) as PublishedBlog[]) };
  } catch {
    return { blogs: [] as PublishedBlog[] };
  }
});
