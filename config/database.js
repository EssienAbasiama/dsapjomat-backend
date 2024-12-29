const sqlite3 = require("sqlite3").verbose();

// Connect to SQLite database
const db = new sqlite3.Database("./storage/database.sqlite", (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create Users Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
});

// Create Manuscripts Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS manuscripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manuscript_type TEXT,
      full_title TEXT,
      running_title TEXT,
      moreSubject TEXT,
      co_authors TEXT,  -- JSON string
      agreement TEXT,
      abstract_text TEXT,
      tags TEXT,        -- JSON string
      subjects TEXT,    -- JSON string
      comments TEXT,
      suggestedReviewers TEXT,  -- JSON string
      file_type TEXT,
      file_description TEXT,
      files TEXT,       -- JSON string
      cover_letter TEXT,
      isDraft INTEGER DEFAULT 0,
      drafted_at TEXT,
      created_by TEXT,
      created_at TEXT
    )
  `);
});

// Columns to add for users
const addColumnsUsers = [
  { column: "title", query: `ALTER TABLE users ADD COLUMN title TEXT` },
  {
    column: "first_name",
    query: `ALTER TABLE users ADD COLUMN first_name TEXT`,
  },
  { column: "middle", query: `ALTER TABLE users ADD COLUMN middle TEXT` },
  { column: "last_name", query: `ALTER TABLE users ADD COLUMN last_name TEXT` },
  { column: "degree", query: `ALTER TABLE users ADD COLUMN degree TEXT` },
  { column: "specialty", query: `ALTER TABLE users ADD COLUMN specialty TEXT` },
  { column: "phone", query: `ALTER TABLE users ADD COLUMN phone TEXT` },
  { column: "country", query: `ALTER TABLE users ADD COLUMN country TEXT` },
  { column: "orcid", query: `ALTER TABLE users ADD COLUMN orcid TEXT` },
  {
    column: "alternative_email",
    query: `ALTER TABLE users ADD COLUMN alternative_email TEXT`,
  },
  { column: "username", query: `ALTER TABLE users ADD COLUMN username TEXT` },
  {
    column: "available_as_reviewer",
    query: `ALTER TABLE users ADD COLUMN available_as_reviewer INTEGER DEFAULT 0`,
  },
  {
    column: "receive_news",
    query: `ALTER TABLE users ADD COLUMN receive_news INTEGER DEFAULT 0`,
  },
  { column: "comments", query: `ALTER TABLE users ADD COLUMN comments TEXT` },
  {
    column: "refresh_token",
    query: `ALTER TABLE users ADD COLUMN refresh_token TEXT`,
  },
  { column: "role", query: `ALTER TABLE users ADD COLUMN role TEXT` },
];

// Columns to add for manuscripts
const addColumnsManuscripts = [
  {
    column: "manuscript_type",
    query: `ALTER TABLE manuscripts ADD COLUMN manuscript_type TEXT`,
  },
  {
    column: "full_title",
    query: `ALTER TABLE manuscripts ADD COLUMN full_title TEXT`,
  },
  {
    column: "running_title",
    query: `ALTER TABLE manuscripts ADD COLUMN running_title TEXT`,
  },
  {
    column: "moreSubject",
    query: `ALTER TABLE manuscripts ADD COLUMN moreSubject TEXT`,
  },
  {
    column: "co_authors",
    query: `ALTER TABLE manuscripts ADD COLUMN co_authors TEXT`,
  },

  {
    column: "agreement",
    query: `ALTER TABLE manuscripts ADD COLUMN agreement TEXT`,
  },
  {
    column: "abstract_text",
    query: `ALTER TABLE manuscripts ADD COLUMN abstract_text TEXT`,
  },
  { column: "tags", query: `ALTER TABLE manuscripts ADD COLUMN tags TEXT` },
  {
    column: "subjects",
    query: `ALTER TABLE manuscripts ADD COLUMN subjects TEXT`,
  },

  {
    column: "comments",
    query: `ALTER TABLE manuscripts ADD COLUMN comments TEXT`,
  },
  {
    column: "suggestedReviewers",
    query: `ALTER TABLE manuscripts ADD COLUMN suggestedReviewers TEXT`,
  },
  {
    column: "file_type",
    query: `ALTER TABLE manuscripts ADD COLUMN file_type TEXT`,
  },
  {
    column: "file_description",
    query: `ALTER TABLE manuscripts ADD COLUMN file_description TEXT`,
  },
  {
    column: "cover_letter",
    query: `ALTER TABLE manuscripts ADD COLUMN cover_letter TEXT`,
  },
  {
    column: "isDraft",
    query: `ALTER TABLE manuscripts ADD COLUMN isDraft INTEGER DEFAULT 0`,
  },
  { column: "files", query: `ALTER TABLE manuscripts ADD COLUMN files TEXT` },
  {
    column: "drafted_at",
    query: `ALTER TABLE manuscripts ADD COLUMN drafted_at TEXT`,
  },
  {
    column: "created_by",
    query: `ALTER TABLE manuscripts ADD COLUMN created_by TEXT`,
  },
  {
    column: "created_at",
    query: `ALTER TABLE manuscripts ADD COLUMN created_at TEXT`,
  },
  {
    column: "status",
    query: `ALTER TABLE manuscripts ADD COLUMN status TEXT`,
  },
];

// Function to add columns dynamically
function addColumns(tableName, columns) {
  db.serialize(() => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        return console.error(
          `Error fetching table info for ${tableName}:`,
          err.message
        );
      }

      const existingColumns = rows.map((row) => row.name);

      columns.forEach(({ column, query }) => {
        if (!existingColumns.includes(column)) {
          db.run(query, (err) => {
            if (err) {
              console.error(`Error running query: ${query}`, err.message);
            } else {
              console.log(`Successfully executed: ${query}`);
            }
          });
        } else {
          console.log(
            `Column ${column} already exists in ${tableName}. Skipping.`
          );
        }
      });
    });
  });
}

// Add columns to users and manuscripts tables
addColumns("users", addColumnsUsers);
addColumns("manuscripts", addColumnsManuscripts);

function removeColumnsFromTable(tableName, columnsToRemove) {
  db.serialize(() => {
    // Fetch existing columns
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        return console.error(
          `Error fetching table info for ${tableName}:`,
          err.message
        );
      }

      const existingColumns = rows.map((row) => row.name);

      // Filter the columns to remove that actually exist in the table
      const columnsToRemoveExist = columnsToRemove.filter((col) =>
        existingColumns.includes(col)
      );

      if (columnsToRemoveExist.length === 0) {
        console.log(`No columns to remove from ${tableName}.`);
        return;
      }

      console.log(
        `Removing columns: ${columnsToRemoveExist.join(", ")} from ${tableName}`
      );

      // Create a new list of columns to keep (excluding the columns to be removed)
      const columnsToKeep = existingColumns.filter(
        (col) => !columnsToRemoveExist.includes(col)
      );
      const columnsString = columnsToKeep.join(", ");
      const tempTableName = `${tableName}_temp`;

      // Create the new table with only the columns we want to keep
      db.run(
        `CREATE TABLE ${tempTableName} AS SELECT ${columnsString} FROM ${tableName}`,
        (err) => {
          if (err) {
            return console.error(
              `Error creating temporary table for ${tableName}:`,
              err.message
            );
          }

          // Drop the original table
          db.run(`DROP TABLE ${tableName}`, (err) => {
            if (err) {
              return console.error(
                `Error dropping original table ${tableName}:`,
                err.message
              );
            }

            // Rename the temporary table to the original name
            db.run(
              `ALTER TABLE ${tempTableName} RENAME TO ${tableName}`,
              (err) => {
                if (err) {
                  return console.error(
                    `Error renaming table ${tempTableName} to ${tableName}:`,
                    err.message
                  );
                }

                console.log(
                  `Columns ${columnsToRemoveExist.join(
                    ", "
                  )} removed successfully from ${tableName}.`
                );
              }
            );
          });
        }
      );
    });
  });
}

// Example: Removing columns
// removeColumnsFromTable("users", [""]);
// removeColumnsFromTable("manuscripts", ["other_subjects", "content"]);
module.exports = db;
