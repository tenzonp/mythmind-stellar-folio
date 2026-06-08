import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ContentValue = { heading?: string; body?: string; [k: string]: unknown };

export function useSiteContent(key: string, fallback: ContentValue) {
  const [value, setValue] = useState<ContentValue>(fallback);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_content")
      .select("value")
      .eq("key", key)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value) setValue(data.value as ContentValue);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return value;
}
