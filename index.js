const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_notes_db');
const app = express();


const init = async() => {
    await client.connect();
    console.log('connected to the database');
    
    let SQL = ``;
    await client.query(SQL);
    console.log('tables created');
    
    SQL = ` `;
    await client.query(SQL);
    console.log('data seeded'); 
    
    SQL = ` 
    DROP TABLE IF EXISTS notes;

    CREATE TABLE notes(
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    ranking INTEGER DEFAULT 3 NOT NULL,
    txt VARCHAR(255) NOT NULL 
    );

    INSERT INTO notes(txt, ranking) VALUES('learn express', 5);
    INSERT INTO notes(txt, ranking) VALUES('write SQL queries', 4);
    INSERT INTO notes(txt, ranking) VALUES('create routes', 2);

    `;

    app.use(express.json());
    app.use(require('morgan')('dev'));

    app.get('/api/notes', async (req, res, next) => {
        try {
            const SQL = 'SELECT * from notes ORDER BY created_at DESC;'
            const response = await client.query(SQL);
            res.send(response.rows);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/notes', async (req, res, next) => {
        try {
            const SQL = 'INSERT INTO notes(txt, ranking) VALUES($1, $2) RETURNING *';
            const response = client.query(SQL, [req.body.txt]);
            res.send(response.rows[0]);
        } catch (err) {
            next(err);
        }
    });
    
    app.put('/api/notes/:id', async (req, res, next) => {
        try {
            const SQL = 'UPDATE notes SET txt=$1, ranking=$2, update_at=now(WHERE id=$3 RETURNING *) WHERE id=$3 RETURNING *';
            const response = client.query(SQL, [req.body.txt, req.body.ranking, req.params.id]);
            res.send(response.rows[0]);
        } catch (err) {
            next(err);
        }
    });
    app.delete('/api/notes/:id', async (req, res, next) => {
        try {
            const SQL = 'DELETE FROM notes WHERE id=$1 RETURNING *';
            const response = client.query(SQL, [req.params.id]);
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    });



};


init();