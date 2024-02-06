import express from "express";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const port = 3000;

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    password: process.env.DB_PASSWORD,
    database: 'world'
})
db.connect();

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/visited-countries', async (req, res) => {
    const result = await db.query('SELECT country_code FROM visited_countries')
    const countries = result.rows.map(country => country.country_code)
    return res.send({ countries, total: countries.length })
});

// app.post('/add', async (req, res) => {
//     if (!req.body?.country) {
//         console.log(false);
//         return res.status(204).json('Payload not found!')
//     }
//     console.log('e');
// })

app.listen(port, () => {
    console.log(`Server Listening on port ${port}`);
})