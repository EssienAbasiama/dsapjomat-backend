const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://jandzpuvyhckohxkeocv.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphbmR6cHV2eWhja29oeGtlb2N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDM2MzIxOSwiZXhwIjoyMDU1OTM5MjE5fQ.JmmOvdWHr01BgXvqKqUaGwIgeA_f3Pq2J21OAuqkB3Y";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
