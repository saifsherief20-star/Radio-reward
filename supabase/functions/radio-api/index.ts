import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const url = Deno.env.get("SUPABASE_URL")!;
function firstKey(raw: string | undefined): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return String(Object.values(parsed)[0] || "");
  } catch { /* value may already be a single key */ }
  return raw;
}
const publishableKeys = firstKey(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS"));
const secretKeys = firstKey(Deno.env.get("SUPABASE_SECRET_KEYS"));
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || publishableKeys;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretKeys;
if (!url || !anonKey || !serviceKey) throw new Error("SUPABASE_ENVIRONMENT_NOT_CONFIGURED");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function bearer(req: Request) {
  return (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function customerFromSession(req: Request) {
  const token = bearer(req);
  if (!token) throw new Error("CUSTOMER_SESSION_REQUIRED");
  const tokenHash = await sha256(token);
  const { data, error } = await db.from("customer_sessions")
    .select("id, customer_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash).maybeSingle();
  if (error || !data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) {
    throw new Error("CUSTOMER_SESSION_INVALID");
  }
  const { data: customer, error: customerError } = await db.from("customers")
    .select("id, full_name, phone, member_number, drink_count, total_drinks, total_rewards, available_rewards, is_active, created_at")
    .eq("id", data.customer_id).eq("is_active", true).maybeSingle();
  if (customerError || !customer) throw new Error("CUSTOMER_NOT_ACTIVE");
  return { customer, sessionId: data.id };
}

async function staffFromRequest(req: Request, allowed: string[]) {
  const accessToken = bearer(req);
  if (!accessToken) throw new Error("STAFF_LOGIN_REQUIRED");
  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !authData.user) throw new Error("STAFF_SESSION_INVALID");
  const { data: profile, error } = await db.from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", authData.user.id).maybeSingle();
  if (error || !profile || !profile.is_active || !allowed.includes(profile.role)) {
    throw new Error("STAFF_NOT_AUTHORIZED");
  }
  return profile;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "register_customer") {
      const fullName = String(body.full_name || "").trim();
      const phone = String(body.phone || "").replace(/[\s()-]/g, "");
      if (fullName.length < 2 || fullName.length > 80) return json({ error: "INVALID_NAME" }, 400);
      if (!/^\+?[0-9]{8,15}$/.test(phone)) return json({ error: "INVALID_PHONE" }, 400);

      const { data: existing } = await db.from("customers").select("id").eq("phone", phone).maybeSingle();
      if (existing) return json({ error: "PHONE_ALREADY_REGISTERED" }, 409);

      const { data: customer, error } = await db.from("customers")
        .insert({ full_name: fullName, phone }).select("id, full_name, phone, member_number, drink_count, total_drinks, available_rewards, created_at").single();
      if (error) throw error;

      const sessionToken = randomToken();
      const sessionHash = await sha256(sessionToken);
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const { error: sessionError } = await db.from("customer_sessions")
        .insert({ customer_id: customer.id, token_hash: sessionHash, expires_at: expiresAt });
      if (sessionError) throw sessionError;
      return json({ customer, session_token: sessionToken, expires_at: expiresAt });
    }

    if (action === "customer_login") {
      // Phone + name is intentionally passwordless per project requirements.
      // It does not prove phone ownership; use only as a convenience identifier.
      const fullName = String(body.full_name || "").trim();
      const phone = String(body.phone || "").replace(/[\s()-]/g, "");
      if (fullName.length < 2 || fullName.length > 80 || !/^\+?[0-9]{8,15}$/.test(phone)) {
        return json({ error: "INVALID_CREDENTIALS" }, 400);
      }
      const { data: customer, error } = await db.from("customers")
        .select("id, full_name, phone, member_number, drink_count, total_drinks, total_rewards, available_rewards, is_active, created_at")
        .eq("phone", phone).eq("is_active", true).maybeSingle();
      if (error || !customer || customer.full_name.trim().toLocaleLowerCase() !== fullName.toLocaleLowerCase()) {
        return json({ error: "CUSTOMER_LOGIN_FAILED" }, 401);
      }
      const sessionToken = randomToken();
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const { error: sessionError } = await db.from("customer_sessions").insert({
        customer_id: customer.id, token_hash: await sha256(sessionToken), expires_at: expiresAt,
      });
      if (sessionError) throw sessionError;
      return json({ customer, session_token: sessionToken, expires_at: expiresAt });
    }

    if (action === "customer_me") {
      const { customer } = await customerFromSession(req);
      const { data: transactions } = await db.from("transactions")
        .select("id, quantity, created_at, drinks(name, name_ar)")
        .eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(20);
      const { data: rewards } = await db.from("rewards")
        .select("id, name, name_ar, description, drinks_required")
        .eq("is_active", true).order("drinks_required");
      return json({ customer, transactions: transactions || [], rewards: rewards || [] });
    }

    if (action === "issue_qr") {
      const { customer } = await customerFromSession(req);
      const rawToken = randomToken();
      const tokenHash = await sha256(rawToken);
      const expiresAt = new Date(Date.now() + 30_000).toISOString();
      const { error } = await db.from("qr_tokens").insert({
        customer_id: customer.id, token_hash: tokenHash, expires_at: expiresAt,
      });
      if (error) throw error;
      return json({ qr: `RR1.${rawToken}`, expires_at: expiresAt, refresh_seconds: 30 });
    }

    if (action === "list_drinks") {
      await staffFromRequest(req, ["cashier", "admin"]);
      const { data, error } = await db.from("drinks").select("id, name, name_ar")
        .eq("is_active", true).order("name");
      if (error) throw error;
      return json({ drinks: data || [] });
    }

    if (action === "redeem_qr") {
      const staff = await staffFromRequest(req, ["cashier", "admin"]);
      const qr = String(body.qr || "");
      const match = qr.match(/^RR1\.([A-Za-z0-9_-]{30,})$/);
      if (!match) return json({ error: "QR_INVALID" }, 400);
      const quantity = Number(body.quantity || 1);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4) return json({ error: "INVALID_QUANTITY" }, 400);
      const idempotencyKey = crypto.randomUUID();
      const { data, error } = await db.rpc("rr_redeem_qr_atomic", {
        p_token_hash: await sha256(match[1]),
        p_drink_id: String(body.drink_id || ""),
        p_cashier_id: staff.id,
        p_idempotency_key: idempotencyKey,
        p_quantity: quantity,
      });
      if (error) throw error;
      return json(data);
    }

    if (action === "claim_reward") {
      const staff = await staffFromRequest(req, ["cashier", "admin"]);
      const { data, error } = await db.rpc("rr_claim_reward_atomic", {
        p_customer_id: String(body.customer_id || ""),
        p_reward_id: String(body.reward_id || ""),
        p_cashier_id: staff.id,
      });
      if (error) throw error;
      return json(data);
    }

    if (action === "admin_dashboard") {
      await staffFromRequest(req, ["admin"]);
      const [customers, customerCount, transactions, visitCount, redemptions, drinks] = await Promise.all([
        db.from("customers").select("id, full_name, phone, member_number, drink_count, total_drinks, available_rewards, created_at").eq("is_active", true).order("created_at", { ascending: false }).limit(1000),
        db.from("customers").select("id", { count: "exact", head: true }).eq("is_active", true),
        db.from("transactions").select("id, quantity, created_at, customer_id, drinks(name, name_ar)").order("created_at", { ascending: false }).limit(500),
        db.from("transactions").select("id", { count: "exact", head: true }),
        db.from("reward_redemptions").select("id", { count: "exact", head: true }),
        db.from("drinks").select("id, name, name_ar").eq("is_active", true),
      ]);
      if (customers.error) throw customers.error;
      if (customerCount.error) throw customerCount.error;
      if (transactions.error) throw transactions.error;
      if (visitCount.error) throw visitCount.error;
      if (redemptions.error) throw redemptions.error;
      const customerRows = customers.data || [];
      let drinksCollected = 0;
      for (let offset = 0; offset < (customerCount.count || 0); offset += 1000) {
        const { data: totals, error: totalsError } = await db.from("customers")
          .select("total_drinks").eq("is_active", true).range(offset, offset + 999);
        if (totalsError) throw totalsError;
        drinksCollected += (totals || []).reduce((n, row) => n + Number(row.total_drinks || 0), 0);
      }
      return json({
        total_customers: customerCount.count || 0,
        total_visits: visitCount.count || 0,
        drinks_collected: drinksCollected,
        rewards_redeemed: redemptions.count || 0,
        customers: customerRows,
        transactions: transactions.data || [],
        drinks: drinks.data || [],
      });
    }

    if (action === "staff_login") {
      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) return json({ error: "LOGIN_FAILED" }, 401);
      const { data: profile, error: profileError } = await db.from("profiles")
        .select("full_name, role, is_active").eq("id", data.user.id).maybeSingle();
      if (profileError || !profile || !profile.is_active || !["admin", "cashier"].includes(profile.role)) {
        await authClient.auth.signOut();
        return json({ error: "STAFF_NOT_AUTHORIZED" }, 403);
      }
      return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at, profile });
    }

    return json({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERVER_ERROR";
    const safe = ["CUSTOMER_SESSION_REQUIRED", "CUSTOMER_SESSION_INVALID", "CUSTOMER_NOT_ACTIVE",
      "STAFF_LOGIN_REQUIRED", "STAFF_SESSION_INVALID", "STAFF_NOT_AUTHORIZED", "QR_INVALID",
      "QR_ALREADY_USED", "QR_EXPIRED", "CUSTOMER_NOT_ACTIVE", "CASHIER_NOT_AUTHORIZED",
      "INVALID_QUANTITY", "DRINK_NOT_FOUND", "NO_REWARD_AVAILABLE", "REWARD_NOT_FOUND"];
    return json({ error: safe.includes(message) ? message : "SERVER_ERROR" }, 400);
  }
});
