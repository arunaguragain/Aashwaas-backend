import express , {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import authRoutes from "./routes/auth.route";
import adminUserRoutes from "./routes/admin/user.route";
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.PORT); 

const app: Application = express();

let corsOptions={
    origin:["http://localhost:3000","http://localhost:3003"],
    //which url can access backend
    //put your frontend domain/url here
}
//origin:"*",//yo le sabai url lai access dincha
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the api of aashwaas" });
}); 
app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);

async function start() {
    await connectDatabase();

    app.listen(
        PORT,
        () => {
            console.log(`Server: http://localhost:${PORT}`);
        }
    );
}

start().catch((error) => console.log(error));