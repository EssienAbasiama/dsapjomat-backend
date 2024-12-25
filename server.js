const express = require("express");
const app = express();

const port = process.env.PORT || 3000; // Use the port provided by the host or default to 3000
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
// Middleware to parse JSON requests
app.use(express.json());

const data = [
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
  { id: 3, name: "Item 3" },
];

// Define a route to handle incoming requests
app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

// Create (POST) a new item
app.post("/items", (req, res) => {
  const newItem = req.body;
  data.push(newItem);
  res.status(201).json(newItem);
});

// Read (GET) all items
app.get("/items", (req, res) => {
  res.json(data);
});

// Read (GET) a specific item by ID
app.get("/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const item = data.find((item) => item.id === id);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
  } else {
    res.json(item);
  }
});

// Update (PUT) an item by ID
app.put("/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const updatedItem = req.body;
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Item not found" });
  } else {
    data[index] = { ...data[index], ...updatedItem };
    res.json(data[index]);
  }
});

// Delete (DELETE) an item by ID
app.delete("/items/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) {
    res.status(404).json({ error: "Item not found" });
  } else {
    const deletedItem = data.splice(index, 1);
    res.json(deletedItem[0]);
  }
});
