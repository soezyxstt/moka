import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client/node";

type Snapshot = {
  format: "pamoka-turso-json-v1";
  sourceHost: string;
  schema: Array<{ type: string; name: string; sql: string | null }>;
  data: Record<string, Array<Record<string, string | number | boolean | null>>>;
};

function getArgument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function main() {
  const snapshotPath = getArgument("--snapshot");
  const targetPath = getArgument("--target");
  if (!snapshotPath || !targetPath || !targetPath.startsWith("file:")) {
    throw new Error("Gunakan --snapshot <file.json> --target file:.tmp/restore-check.db");
  }

  const localPath = path.resolve(targetPath.slice("file:".length));
  const tempRoot = path.resolve(".tmp");
  if (!localPath.startsWith(`${tempRoot}${path.sep}`) || path.extname(localPath) !== ".db") {
    throw new Error("Target verifikasi harus berupa database lokal .db di dalam .tmp");
  }

  try {
    await access(localPath);
    throw new Error("Target verifikasi sudah ada; pilih nama file baru");
  } catch (error) {
    if (error instanceof Error && error.message.includes("sudah ada")) throw error;
  }

  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as Snapshot;
  if (snapshot.format !== "pamoka-turso-json-v1" || !snapshot.sourceHost || !snapshot.schema.length) {
    throw new Error("Format snapshot tidak dikenali");
  }

  const client = createClient({ url: `file:${localPath}` });
  let verified = false;
  try {
    await client.execute("PRAGMA foreign_keys = OFF");
    const tables = snapshot.schema.filter((entry) => entry.type === "table" && entry.sql);
    for (const entry of tables) await client.execute(entry.sql!);

    const transaction = await client.transaction("write");
    try {
      for (const [tableName, rows] of Object.entries(snapshot.data)) {
        if (!rows.length) continue;
        const columns = Object.keys(rows[0]);
        const statement = `INSERT INTO ${quoteIdentifier(tableName)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        for (const row of rows) {
          const values = columns.map((column) => row[column]);
          await transaction.execute({ sql: statement, args: values as never[] });
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    for (const entry of snapshot.schema.filter((item) => ["index", "trigger"].includes(item.type) && item.sql)) {
      await client.execute(entry.sql!);
    }
    await client.execute("PRAGMA foreign_keys = ON");

    const foreignKeyErrors = (await client.execute("PRAGMA foreign_key_check")).rows.length;
    const integrityRows = await client.execute("PRAGMA integrity_check");
    const integrityCheck = String(integrityRows.rows[0]?.integrity_check ?? "unknown");
    const rowCounts: Record<string, number> = {};
    for (const [tableName, rows] of Object.entries(snapshot.data)) {
      const count = await client.execute(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`);
      rowCounts[tableName] = Number(count.rows[0].count);
      if (rowCounts[tableName] !== rows.length) throw new Error(`Jumlah baris hasil restore tidak cocok pada ${tableName}`);
    }
    if (foreignKeyErrors !== 0 || integrityCheck !== "ok") throw new Error("Integritas hasil restore tidak lolos");

    verified = true;
    console.log(JSON.stringify({
      mode: "local-restore-verification",
      sourceHost: snapshot.sourceHost,
      tables: Object.keys(rowCounts).length,
      rows: Object.values(rowCounts).reduce((sum, count) => sum + count, 0),
      foreignKeyErrors,
      integrityCheck,
      cleanupRequiredAfterProcessExit: true,
    }, null, 2));
  } finally {
    client.close();
  }

  if (!verified) throw new Error("Restore lokal tidak terverifikasi");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Verifikasi snapshot gagal");
  process.exitCode = 1;
});
