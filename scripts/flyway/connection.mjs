import { isIP } from "node:net";

function parseUrl(value, setting) {
  try {
    return new URL(value);
  } catch {
    // Node URL errors can include their original input, including credentials.
    throw new Error(`${setting} must be a valid URL.`);
  }
}

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error("Check the percent-encoding in SUPABASE_DB_URL.");
  }
}

function hostedProjectRef(value) {
  if (!value) return undefined;
  const site = parseUrl(value, "NEXT_PUBLIC_SUPABASE_URL");
  if (site.protocol === "https:" && !site.port && site.pathname === "/" && !site.search && !site.hash && !site.username && !site.password) {
    return /^([a-z0-9-]+)\.supabase\.co$/.exec(site.hostname)?.[1];
  }
}

export function getFlywayConnection(env) {
  const project = hostedProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  let connection = env.SUPABASE_DB_URL;
  if (!connection) {
    if (!project) {
      throw new Error("Set SUPABASE_DB_URL to a PostgreSQL connection string, or set the hosted NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD.");
    }
    connection = `postgresql://postgres@db.${project}.supabase.co:5432/postgres`;
  }

  const db = parseUrl(connection, "SUPABASE_DB_URL");
  if (!["postgres:", "postgresql:"].includes(db.protocol) || !db.hostname || db.hash || /[\r\n\t]/.test(connection)) {
    throw new Error("Use the PostgreSQL direct or session pooler connection string from Supabase Connect. Percent-encode special characters in the URI password.");
  }
  const host = db.hostname.toLowerCase().replace(/\.$/, "");
  const ip = host.replace(/^\[|\]$/g, "");
  if (!isIP(ip) && !host.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new Error("SUPABASE_DB_URL contains an invalid database host.");
  }
  if (db.port === "6543") {
    throw new Error("Flyway needs a direct or session connection; select port 5432 in Supabase Connect.");
  }

  const user = decode(db.username);
  const password = decode(db.password) || env.SUPABASE_DB_PASSWORD;
  if (!user || !password || /[\x00\r\n]/.test(user + password)) {
    throw new Error("Supply a database username and password through SUPABASE_DB_URL or supply the password separately in SUPABASE_DB_PASSWORD.");
  }

  let databaseProject = /^db\.([a-z0-9-]+)\.supabase\.co$/.exec(host)?.[1];
  if (host.endsWith(".pooler.supabase.com")) {
    databaseProject = /\.([a-z0-9-]+)$/.exec(user)?.[1];
    if (!databaseProject) throw new Error("Copy the session pooler username, including its project reference, from Supabase Connect.");
  }
  if (project && databaseProject && project !== databaseProject) {
    throw new Error("SUPABASE_DB_URL and NEXT_PUBLIC_SUPABASE_URL reference different Supabase projects.");
  }

  if ([...db.searchParams.keys()].some(key => key !== "sslmode") || db.searchParams.getAll("sslmode").length > 1) {
    throw new Error("The only supported SUPABASE_DB_URL query parameter is sslmode.");
  }
  const local = host === "localhost" || host === "host.docker.internal" || ip === "::1" || (isIP(ip) === 4 && ip.startsWith("127."));
  const sslmode = db.searchParams.get("sslmode") ?? (local ? "disable" : "require");
  if (!["require", "verify-ca", "verify-full"].includes(sslmode) && !(local && sslmode === "disable")) {
    throw new Error("Use sslmode=require, verify-ca or verify-full for remote PostgreSQL connections.");
  }
  const name = decode(db.pathname.replace(/^\//, "") || "postgres");
  if (db.pathname.slice(1).includes("/") || /[\x00\r\n]/.test(name)) {
    throw new Error("SUPABASE_DB_URL must name a single database.");
  }
  return {
    url: `jdbc:postgresql://${host}:${db.port || "5432"}/${encodeURIComponent(name)}?sslmode=${sslmode}`,
    user,
    password,
  };
}
