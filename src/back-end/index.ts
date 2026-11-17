import express from 'express';
import { registerHealthApi } from './api/health-api';
import { registerMoviesApi } from './api/movies-api';
import { openDatabase } from './database/schema';

// Create a new express application instance
const app = express();
const database = openDatabase(
  process.env.MOVIES_DATABASE_PATH ?? './data/movies.sqlite',
);

// Register API routes from dedicated modules
registerHealthApi(app);
registerMoviesApi(app, database);

// Start the server and listen on the specified port
const port: number = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
