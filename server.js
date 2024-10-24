const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2'); // Import mysql2
const app = express();
// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies
// MySQL database connection setup
const db = mysql.createConnection({
    host: 'localhost', // Your database host
    user: 'root',      // Your database user
    password: 'Vign-2005', // Your database password
    database: 'attendancesystem' // Your database name
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// POST endpoint to mark attendance
app.post('/attendance', (req, res) => {
    const attendanceData = req.body;

    console.log('Incoming attendance data:', attendanceData); // Log incoming data

    // Validate the incoming data
    if (!Array.isArray(attendanceData)) {
        return res.status(400).json({ error: "Invalid data format, expected an array." });
    }

    // Insert attendance records into the database
    const query = 'INSERT INTO attendance (name, year, date, status) VALUES (?, ?, ?, ?)';

    // Create an array of promises for each insert
    const insertPromises = attendanceData.map(record => {
        const { name, year, date, status } = record;

        // Log each record before inserting
        console.log('Inserting record:', { name, year, date, status });

        return new Promise((resolve, reject) => {
            db.query(query, [name, year, date, status], (err, result) => {
                if (err) {
                    console.error('Error inserting attendance record:', err); // Log the specific error
                    return reject(err); // Reject the promise on error
                }
                console.log('Inserted attendance record:', result.insertId);
                resolve(result.insertId); // Resolve the promise with the inserted ID
            });
        });
    });

    // Wait for all insert promises to complete
    Promise.all(insertPromises)
        .then(() => {
            res.json({ message: "Attendance marked successfully" }); // Send success response
        })
        .catch(err => {
            console.error('Error inserting attendance records:', err);
            res.status(500).json({ error: "Failed to insert one or more attendance records.", details: err.message });
        });
});

// GET endpoint to view attendance by date
app.get('/attendance/view/:date', (req, res) => {
    const { date } = req.params;

    // Log the incoming date parameter
    console.log('Received request to view attendance for date:', date);

    const sql = 'SELECT * FROM attendance WHERE date = ?';
    db.query(sql, [date], (err, results) => {
        if (err) {
            console.error('Error retrieving attendance:', err);
            return res.status(500).json({ error: 'Database retrieval failed', details: err.message });
        }
        res.json(results);
    });
});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack
    res.status(500).json({ error: "Internal Server Error" });
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
