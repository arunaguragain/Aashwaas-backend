import express , {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import authRoutes from "./routes/auth.route";
import adminUserRoutes from "./routes/admin/user.route";
import adminNgoRoutes from "./routes/admin/ngo.route";
import adminDonationRoutes from "./routes/admin/donation.route";
import adminTaskRoutes from "./routes/admin/task.route";
import donationRoutes from "./routes/donation.route";
import wishlistRoutes from "./routes/wishlist.route";
import ngoRoutes from "./routes/ngo.route";
import volunteerTaskRoutes from "./routes/volunteer/task.route";
import reviewRoutes from "./routes/review.route";
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
console.log(process.env.PORT); 

const app: Application = express();

let corsOptions={
    origin:["http://localhost:3000","http://localhost:3003", "http://192.168.137.1:3000"],
    //which url can access backend
    //put your frontend domain/url here
}
//origin:"*",//this all gives access to url
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/item_photos', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the api of aashwaas" });
}); 
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/ngos', adminNgoRoutes);
app.use('/api/admin/donations', adminDonationRoutes);
app.use('/api/admin/tasks', adminTaskRoutes);
app.use('/api/tasks', volunteerTaskRoutes);
app.use('/api/reviews', reviewRoutes);

export default app;