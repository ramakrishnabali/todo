const express = require("express");
const app = express();
const { open } = require("sqlite");

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const driverForDb = require("sqlite3");

app.use(express.json());

let database = null;

const connectToDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: driverForDb.Database,
    });
    app.listen(3000, () => {
      console.log(`server is running....`);
    });
  } catch (error) {
    console.log(`database error ${error.message}`);
    process.exit(1);
  }
};

connectToDbAndServer();

app.get("/todos/", async (request, response) => {
  const requestQuery = request.query;
  const isPriorityAndStatus = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  const isPriority = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const isStatus = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  const { search_q = "", priority, status } = requestQuery;
  let sqlQuery = "";
  switch (true) {
    case isPriorityAndStatus(requestQuery):
      sqlQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority="${priority}" AND status="${status}";`;
      //console.log("priorityand status");
      break;
    case isPriority(requestQuery):
      sqlQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority = "${priority}";`;
      //console.log("priority");
      break;
    case isStatus(requestQuery):
      sqlQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status = "${status}";`;
      //console.log("status");
      break;
    default:
      sqlQuery = `
            SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      break;
  }
  const dataResponse = await database.all(sqlQuery);
  response.send(dataResponse);
});

//get a todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoResponse = await database.get(todoQuery);
  response.send(todoResponse);
});

//post a todo
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const postQuery = `
    INSERT INTO todo (id,todo,priority,status) VALUES(${id},"${todo}","${priority}","${status}");`;
  await database.run(postQuery);
  response.send("Todo Successfully Added");
});

//delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

//UPDATE TODO
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateQuery = "";
  let updateOn = "";
  const { todo, priority, status } = request.body;
  switch (true) {
    case todo !== undefined:
      updateQuery = `
            UPDATE todo SET todo = "${todo}" WHERE id = ${todoId};`;
      updateOn = "Todo";
      break;
    case priority !== undefined:
      updateQuery = `
            UPDATE todo SET priority = "${priority}" WHERE id = ${todoId};`;
      updateOn = "Priority";
      break;
    default:
      updateQuery = `
            UPDATE todo SET status = "${status}" WHERE id = ${todoId};`;
      updateOn = "Status";
      break;
  }
  await database.run(updateQuery);
  response.send(`${updateOn} Updated`);
});
module.exports = app;
