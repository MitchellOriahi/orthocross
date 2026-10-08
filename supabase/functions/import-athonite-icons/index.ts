import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { CatalogUnavailable, COLLECTIONS, fetchCatalog } from "./catalog.ts";

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return reply({ error: "Unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await auth.auth.getUser(token);
  if (userError || !userData.user) return reply({ error: "Unauthorized" }, 401);
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: role, error: roleError } = await service.from("user_roles").select("user_id").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
  if (roleError || !role) return reply({ error: "Owner/admin permission required" }, 403);
  let body: { collection?: unknown };
  try { body = await req.json(); } catch { return reply({ error: "Invalid JSON" }, 400); }
  const collection = body.collection;
  if (typeof collection !== "string" || !COLLECTIONS.some(value => value === collection)) return reply({ error: "Invalid collection" }, 400);
  const bucket = service.storage.from("saint-icons");
  // A persisted stop flag prevents retrying a blocked feed or proceeding to other collections.
  const { data: stop } = await bucket.download("athonite/catalogs/STOP.json");
  if (stop) return reply({ stopped: true, error: JSON.parse(await stop.text()).error }, 424);
  const path = `athonite/catalogs/${collection}.json`;
  const { data: cached } = await bucket.download(path);
  if (cached) {
    const products = JSON.parse(await cached.text());
    return reply({ collection, count: products.length, cached: true, status: "candidates-not-approved" });
  }
  try {
    const products = await fetchCatalog(collection);
    const { error } = await bucket.upload(path, new Blob([JSON.stringify(products)], { type: "application/json" }), { contentType: "application/json", upsert: false });
    if (error) return reply({ error: "Unable to save catalog; import stopped" }, 500);
    return reply({ collection, count: products.length, cached: false, status: "candidates-not-approved" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog fetch failed; import stopped";
    await bucket.upload("athonite/catalogs/STOP.json", new Blob([JSON.stringify({ error: message })], { type: "application/json" }), { contentType: "application/json", upsert: false });
    return reply({ stopped: true, error: message }, error instanceof CatalogUnavailable ? 424 : 502);
  }
});