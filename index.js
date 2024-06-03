import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "sk1234",
  port: 5432,
});
db.connect();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve static files from the 'public' directory

// Function to retrieve visited countries from the database
async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries"); // SQL query to get visited countries
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code); // Collect country codes from the query result
  });
  return countries;
}

// Route to serve the home page
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { countries: countries, total: countries.length }); // Render the home page with visited countries
});

// Route to add a new country to the visited list
app.post("/add", async (req, res) => {
  const input = req.body["country"]; // Get country input from the user

  try {
    // Query to find the country code of the input country
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0]; // Get the first row from the result
    const countryCode = data.country_code; // Extract country code
    try {
      // Insert the new country code into visited_countries table
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/"); // Redirect to home page
    } catch (err) {
      // Handle errors (e.g., country already added)
      console.log(err);
      const countries = await checkVisisted(); // Get updated list of visited countries
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    // Handle errors (e.g., country not found)
    console.log(err);
    const countries = await checkVisisted(); // Get updated list of visited countries
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
