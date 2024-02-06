import express from "express";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    password: process.env.DB_PASSWORD,
    database: 'world',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to try connecting before timing out
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Country Validation middleware
function validateCountry(req, res, next) {
    const { country } = req.body;
    if (!country) {
        return res.status(422).json({
            message: 'Country name is required!',
        });
    }
    next();
}

// Route handler to get visited countries
app.get('/visited-countries', async (req, res) => {
    try {
        const result = await pool.query('SELECT country_code FROM visited_countries');
        const countries = result.rows.map(country => country.country_code);
        res.send({ countries, total: countries.length });
    } catch (error) {
        next(error);
    }
});

// Route handler to add a country to visited countries
app.post('/add', validateCountry, async (req, res) => {
    const { country } = req.body;
    try {
        const result = await pool.query('SELECT country_code FROM countries WHERE country_name = $1', [country]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Country not found!',
            });
        }
        const countryCode = result.rows[0].country_code;
        const countryExist = (await pool.query('SELECT country_code FROM visited_countries WHERE country_code = $1', [countryCode])).rows.length > 0;
        if (countryExist) {
            return res.status(409).json({
                message: `${country} is already added to the visited countries. This is a duplicate request.`,
            });
        }
        await pool.query('INSERT INTO visited_countries (country_code) VALUES ($1)', [countryCode]);
        res.status(200).json({
            message: `${country} added to visited countries`,
        });
    } catch (error) {
        next(error);
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
