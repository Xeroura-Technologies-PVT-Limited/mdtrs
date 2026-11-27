import { spawnSync } from "node:child_process";
import { chmod, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as util from "node:util";
import { getFlywayConnection } from "./connection.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const initialVersion = "20261126000100";
const image = "flyway/flyway:12.4.0";

async function readEnvironment(args) {
  if (args.length && !(args.length === 2 && args[0] === "--env-file" && args[1])) {
    throw new Error("Usage: npm run db:migrate [-- --env-file <path>]");
  }
  const envFile = args[1] ?? path.join(root, ".env.production.local");
  let contents;
  try {
    contents = await readFile(envFile, "utf8");
  } catch (err) {
    if (err.code === "ENOENT" && !args.length) return process.env;
    throw new Error("Could not read the migration environment file.");
  }
  if (!util.parseEnv) throw new Error("Reading a migration environment file requires Node.js 20.12 or newer.");
  return { ...util.parseEnv(contents), ...process.env };
}

// Both the local Supabase CLI and Flyway deploy the SQL from supabase/migrations.
// Only filenames change for Flyway. For V1, also handle previously installed portals.
async function stageMigrations(directory) {
  const source = path.join(root, "supabase", "migrations");
  const names = (await readdir(source)).filter(name => name.endsWith(".sql")).sort();
  if (!names.includes(initialVersion + "_care_portal.sql")) throw new Error("The initial care portal migration is missing.");
  for (const name of names) {
    const match = /^(\d{14})_([A-Za-z0-9_]+)\.sql$/.exec(name);
    if (!match) throw new Error(`Invalid migration filename: ${name}. Use YYYYMMDDHHMMSS_description.sql.`);
    const [, version, description] = match;
    let sql = await readFile(path.join(source, name), "utf8");
    if (version === initialVersion) {
      // Flyway commits the schema and its history entry in the same transaction.
      // The wrapper and verifier below are part of V1's immutable checksum.
      const transaction = /^\s*begin;([\s\S]*)\bcommit;\s*$/i.exec(sql);
      if (!transaction) throw new Error("The original care portal migration must contain its transaction wrapper.");
      const verify = await readFile(new URL("./verify-legacy.sql", import.meta.url), "utf8");
      sql = `DO $medtours_install$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
${transaction[1]}
  ELSE
    EXECUTE $medtours_legacy$${verify}$medtours_legacy$;
  END IF;
END;
$medtours_install$;`;
    }
    const destination = path.join(directory, `V${version}__${description}.sql`);
    await writeFile(destination, sql);
    await chmod(destination, 0o644);
  }
}

async function migrate() {
  const env = await readEnvironment(process.argv.slice(2));
  const connection = getFlywayConnection(env);
  const target = new URL(connection.url.slice("jdbc:".length));
  if (target.hostname === "localhost" || target.hostname === "[::1]" || /^127\./.test(target.hostname)) {
    target.hostname = "host.docker.internal";
  }
  const directory = await mkdtemp(path.join(tmpdir(), "medtours-flyway-"));
  try {
    await stageMigrations(directory);
    // The container may run as a different user. Only versioned SQL is staged here.
    await chmod(directory, 0o755);
    const args = ["run", "--rm"];
    if (target.hostname === "host.docker.internal" && process.platform === "linux") {
      args.push("--add-host", "host.docker.internal:host-gateway");
    }
    args.push("--volume", `${directory}:/flyway/sql:ro`,
      "--env", "FLYWAY_URL", "--env", "FLYWAY_USER", "--env", "FLYWAY_PASSWORD", image,
      "-locations=filesystem:/flyway/sql", "-schemas=medtours_migrations", "-defaultSchema=medtours_migrations",
      "-baselineOnMigrate=false", "-cleanDisabled=true", "-validateMigrationNaming=true",
      "-validateOnMigrate=true", "-placeholderReplacement=false", "migrate");
    const result = spawnSync("docker", args, {
      stdio: "inherit",
      env: { ...process.env, FLYWAY_URL: "jdbc:" + target.href, FLYWAY_USER: connection.user, FLYWAY_PASSWORD: connection.password },
    });
    if (result.error?.code === "ENOENT") throw new Error("Install Docker and start its engine to run Flyway.");
    if (result.error) throw new Error("Could not start Docker to run Flyway.");
    if (result.status !== 0) throw new Error("Flyway did not finish successfully. See its output above.");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

migrate().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
