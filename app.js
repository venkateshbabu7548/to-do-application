const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (queryObject) => {
  return queryObject.priority !== undefined && queryObject.status !== undefined;
};
const hasPriorityProperty = (queryObject) => {
  return queryObject.priority !== undefined;
};
const hasStatusProperty = (queryObject) => {
  return queryObject.status !== undefined;
};

// API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let doDosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      toDoQuery = `SELECT * FROM todo WHERE status ="${status}" AND priority = "${priority}" AND todo LIKE "%${search_q}%";`;
      break;
    case hasPriorityProperty(request.query):
      toDoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority = "${priority}";`;
      break;
    case hasStatusProperty(request.query):
      toDoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status = "${status}";`;
      break;
    default:
      toDoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
  }
  data = await db.all(toDoQuery);
  response.send(data);
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const result = await db.get(getQuery);
  response.send(result);
});

// API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `INSERT INTO todo(id,todo,priority,status)
    VALUES(${id},"${todo}","${priority}","${status}");`;
  const result = await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

// API 4
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;

  let data = null;
  let query = "";
  if (status !== undefined && priority === undefined && todo === undefined) {
    query = `UPDATE todo SET status = "${status}" WHERE id = ${todoId};`;
    data = await db.run(query);
    response.send("Status Updated");
  } else if (
    priority !== undefined &&
    status === undefined &&
    todo === undefined
  ) {
    query = `UPDATE todo SET status = "${priority}" WHERE id = ${todoId};`;
    data = await db.run(query);
    response.send("Priority Updated");
  } else {
    query = `UPDATE todo SET status = "${todo}" WHERE id = ${todoId};`;
    data = await db.run(query);
    response.send("Todo Updated");
  }
});

// API 5
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  const result = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
