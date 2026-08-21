// TEMPORARY migration helper — DELETE after the storage migration is complete.
// Returns signed URLs for every object in a bucket so files can be copied out
// of this project. Uses the runtime-injected service role key; guarded by a
// hardcoded token because this project's env is not configurable by us.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const EXPORT_TOKEN = "ocx_miX19psY2nO3RGR388msK7vYdlF5fE06";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("token") !== EXPORT_TOKEN) {
      return new Response("forbidden", { status: 403 });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const bucket = url.searchParams.get("bucket") ?? "journal-attachments";

    async function listAll(prefix: string): Promise<string[]> {
      const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
      if (error) throw new Error(`list ${prefix}: ${error.message}`);
      const out: string[] = [];
      for (const item of data ?? []) {
        const p = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) out.push(...(await listAll(p)));
        else out.push(p);
      }
      return out;
    }

    const paths = await listAll("");
    if (paths.length === 0) {
      return new Response(JSON.stringify({ bucket, count: 0, files: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: signed, error } = await admin.storage.from(bucket).createSignedUrls(paths, 3600);
    if (error) throw new Error(`sign: ${error.message}`);

    return new Response(JSON.stringify({ bucket, count: paths.length, files: signed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
