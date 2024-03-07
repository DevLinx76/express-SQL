// Purpose: to create a server that will allow the user to interact with a database of notes.
const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_notes_db');
const app = express();

// Middleware
app.use(express.json());

// Logging
app.use(require('morgan')('dev'));

// Read Notes -R
app.get('/api/notes', async (req, res, next) => {
    try {
        const SQL = 'SELECT * from notes ORDER BY created_at DESC;'
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex) {
        next(ex);
    }
});

// Create Notes -C
app.post('/api/notes', async (req, res, next) => {
    try {
        const SQL = 'INSERT INTO notes(txt) VALUES($1) RETURNING *';
        const response = await client.query(SQL, [req.body.txt]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex);
    }
});

// Update Note -U
app.put('/api/notes/:id', async (req, res, next) => {
    try {
        const SQL = 'UPDATE notes SET txt=$1, ranking=$2, update_at=now() WHERE id=$3 RETURNING *';
        const response = await client.query(SQL, [req.body.txt, req.body.ranking, req.params.id]);
        res.send(response.rows[0]);
    } catch (ex) {
        next(ex);
    }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res, next) => {
    try {
        const SQL = 'DELETE from notes WHERE id=$1 RETURNING *';
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (ex) {
        next(ex);
    }
});


// Create and run the express app
const init = async() => {
    await client.connect();    
    
    let SQL = `         
        DROP TABLE IF EXISTS notes;

        CREATE TABLE notes (            
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            ranking INTEGER NOT NULL DEFAULT 3,
            txt VARCHAR(255) NOT NULL);
        `
    await client.query(SQL);
    console.log('tables created') 

     // Seed data
    SQL = ` 
        INSERT INTO notes(txt, ranking) VALUES('learn express', 5);
        INSERT INTO notes(txt, ranking) VALUES('write SQL queries', 4);
        INSERT INTO notes(txt, ranking) VALUES('create routes', 2);
    ` 
    await client.query(SQL);      
    console.log('data seeded');    
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
    });
};


init();