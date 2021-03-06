const path = require('path');
const request = require('supertest');
const app = require(path.join(__dirname, '../src/app'));
const fs = require('fs');

// hard-coded user for testing
const user = { 
    display_name: 'manos',
    email: 'test123@gmail.com', 
    password: 'test123'
}

// init db; drop and recreate tables
const initDb = async (db) => {
    const sql = fs.readFileSync(
        path.join(__dirname, '../src/db/init_db.sql')
    ).toString();
    await db.multi(sql);
}

describe('Test Suite for auth', () => {
    let server = null;
    let db = null;
    beforeAll(async (done) => {
        server = await app.listen();
        db = require(path.join(__dirname, '../src/db/config'));
        await initDb(db);
        done();
    })
    afterAll(async (done) => {
        await db.$pool.end();
        await server.close(done);
        done();
    })

    // POST /signup
    test('POST /signup with no data should respond with 400', async (done) => {
        const res = await request(server).post('/signup');
        // expect error since missing data
        expect(res.statusCode).toBe(400);
        done();
    });

    test('POST /signup should respond with 200', async (done) => {
        const res = await request(server).post('/signup').send(user);

        // expect success
        expect(res.statusCode).toBe(200);

        // verify response data is correct
        expect(JSON.parse(res.text)).toEqual({
            user: {
                id: expect.any(Number),
                display_name: user.display_name,
                email: user.email,
                first_name: null,
                last_name: null,
            },
            access_token: expect.any(String),
            expires_in: expect.any(String)
        });
        
        done();
    });
    
    test('POST /signup with same email of existing user should respond with 400', async (done) => {
        const res = await request(server).post('/signup').send(user);
        // expect error since can only have one account per email
        expect(res.statusCode).toBe(400);
        done();
    });

    // POST /login
    test('POST /login with no data should respond with 400', async (done) => {
        const res = await request(server).post('/login');
	// expect error since missing data
        expect(res.statusCode).toBe(400);
        done();
    });

    test('POST /login should respond with 200', async (done) => {
        const res = await request(server).post('/login').send({
	    "email": user.email,
	    "password": user.password
	});
	
        // expect success
	expect(res.statusCode).toBe(200);

        // verify response data is correct
        expect(JSON.parse(res.text)).toEqual({
            user: {
                id: expect.any(Number),
                display_name: user.display_name,
                email: user.email,
                first_name: null,
                last_name: null,
            },
            access_token: expect.any(String),
            expires_in: expect.any(String)
        });
        
        done();
    });
    
    test('POST /login with invalid email should respond with 401', async (done) => {
        const res = await request(server).post('/login').send({
	    "email": "invalid_email@invalid_email.com",
	    "password": user.password
	});
	
        // expect error since email is incorrect
        expect(res.statusCode).toBe(401);
        done();
    });

    test('POST /login with invalid password should respond with 401', async (done) => {
        const res = await request(server).post('/login').send({
	    "email": user.email,
	    "password": "invalid_password"
	});
	
        // expect error since password is incorrect
        expect(res.statusCode).toBe(401);
        done();
    });
    
});
