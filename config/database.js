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

// Columns to add
const addColumns = [
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
];

// Columns to remove
const removeColumns = ["name"]; // Add columns to be removed here

db.serialize(() => {
  // Fetch existing columns
  db.all(`PRAGMA table_info(users)`, (err, rows) => {
    if (err) {
      return console.error("Error fetching table info:", err.message);
    }

    const existingColumns = rows.map((row) => row.name);

    // Add new columns if they don't exist
    addColumns.forEach(({ column, query }) => {
      if (!existingColumns.includes(column)) {
        db.run(query, (err) => {
          if (err) {
            console.error(`Error running query: ${query}`, err.message);
          } else {
            console.log(`Successfully executed: ${query}`);
          }
        });
      } else {
        console.log(`Column ${column} already exists. Skipping.`);
      }
    });

    // Remove columns if they exist
    removeColumns.forEach((columnToRemove) => {
      if (existingColumns.includes(columnToRemove)) {
        console.log(`Removing column: ${columnToRemove}`);
        // Recreate table without the column
        recreateTableWithoutColumn(columnToRemove);
      } else {
        console.log(`Column ${columnToRemove} does not exist. Skipping.`);
      }
    });
  });
});

function recreateTableWithoutColumn(columnToRemove) {
  db.serialize(() => {
    // Get existing table schema
    db.all(`PRAGMA table_info(users)`, (err, rows) => {
      if (err) {
        return console.error("Error fetching table info:", err.message);
      }

      // Get the columns to keep
      const columnsToKeep = rows
        .filter((row) => row.name !== columnToRemove)
        .map((row) => row.name);

      const columnsString = columnsToKeep.join(", ");
      const tempTableName = "users_temp";

      // Create a new temporary table without the column
      db.run(
        `CREATE TABLE ${tempTableName} AS SELECT ${columnsString} FROM users`,
        (err) => {
          if (err) {
            return console.error(
              "Error creating temporary table:",
              err.message
            );
          }

          // Drop the original table
          db.run(`DROP TABLE users`, (err) => {
            if (err) {
              return console.error(
                "Error dropping original table:",
                err.message
              );
            }

            // Rename the temporary table to the original name
            db.run(`ALTER TABLE ${tempTableName} RENAME TO users`, (err) => {
              if (err) {
                return console.error("Error renaming table:", err.message);
              }
              console.log(`Column ${columnToRemove} removed successfully.`);
            });
          });
        }
      );
    });
  });
}

module.exports = db;
