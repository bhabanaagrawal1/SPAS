import app from "./src/app.js"
import config from "./src/config/config.js"

const PORT = config.port || 3000;

/**
When the server starts, schedule a job that runs every day at 3 AM and deletes stale refresh-token records from PostgreSQL, while catching any cleanup errors
 */
app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
})