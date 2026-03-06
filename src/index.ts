import app from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";

async function start() {
    await connectDatabase();

    // Bind to 0.0.0.0 so devices on the LAN can reach the server during development
    app.listen(
        PORT,
        '0.0.0.0',
        () => {
            console.log(`Server: http://0.0.0.0:${PORT}`);
        }
    );
}

start().catch((error) => console.log(error));