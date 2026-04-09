import fs from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");

if (!fs.existsSync(schemaPath)) {
  console.error("Missing supabase/schema.sql");
  process.exit(1);
}

console.log("SpecBridge demo seed scaffold is ready.");
console.log("Apply supabase/schema.sql to your database, then load demo data through POST /api/demo/load.");
