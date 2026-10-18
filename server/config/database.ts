import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import mysql from 'mysql2/promise';

export interface ExecResult {
  insertId: number;
  affectedRows: number;
}

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<ExecResult>;
}

class DatabaseManager implements DbClient {
  private mysqlPool: any = null;
  private sqlJsDb: SqlJsDatabase | null = null;
  private isMySqlActive: boolean = false;
  private dbFilePath: string = path.resolve(process.cwd(), 'data', 'skillswap.db');
  private initialized: boolean = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    // Check if MySQL connection parameters are explicitly set and we can connect
    const host = process.env.MYSQL_HOST;
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE || 'skillswap_db';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

    if (host && user && host !== 'localhost_disabled') {
      try {
        const pool = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 2000,
        });

        // Test connection
        const conn = await pool.getConnection();
        conn.release();
        this.mysqlPool = pool;
        this.isMySqlActive = true;
        console.log(`[Database] Successfully connected to MySQL at ${host}:${port}/${database}`);
      } catch (err: any) {
        console.warn(`[Database] MySQL not reachable (${err.message}). Falling back to high-performance embedded relational SQL engine.`);
        this.mysqlPool = null;
        this.isMySqlActive = false;
      }
    } else {
      console.log('[Database] MySQL environment variables not set for external host; using embedded relational SQL engine.');
    }

    if (!this.isMySqlActive) {
      await this.initSqlJs();
    }

    this.initialized = true;
    await this.ensureTablesAndSeed();
  }

  private async initSqlJs(): Promise<void> {
    const SQL = await initSqlJs();
    const dataDir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const buffer = fs.readFileSync(this.dbFilePath);
        this.sqlJsDb = new SQL.Database(buffer);
        console.log(`[Database] Loaded persistent SQL relational database from ${this.dbFilePath}`);
      } catch (e) {
        console.warn('[Database] Failed to read existing db file, creating new one', e);
        this.sqlJsDb = new SQL.Database();
      }
    } else {
      this.sqlJsDb = new SQL.Database();
      console.log(`[Database] Created fresh relational SQL database at ${this.dbFilePath}`);
    }
  }

  private persistSqlJs(): void {
    if (this.sqlJsDb) {
      try {
        const data = this.sqlJsDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbFilePath, buffer);
      } catch (err) {
        console.error('[Database] Failed to persist SQL database to disk', err);
      }
    }
  }

  public getIsMySql(): boolean {
    return this.isMySqlActive;
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.init();

    if (this.isMySqlActive && this.mysqlPool) {
      const [rows] = await this.mysqlPool.query(sql, params);
      return rows as T[];
    }

    if (!this.sqlJsDb) {
      throw new Error('Database is not initialized');
    }

    try {
      // In sql.js, positional parameters use ? or $name
      const stmt = this.sqlJsDb.prepare(sql);
      // Convert booleans / undefined to sqlite compatible values
      const sanitizedParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
      stmt.bind(sanitizedParams);

      const results: T[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as unknown as T;
        results.push(row);
      }
      stmt.free();
      return results;
    } catch (err: any) {
      console.error(`[Database Query Error] SQL: ${sql}`, err);
      throw err;
    }
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async execute(sql: string, params: any[] = []): Promise<ExecResult> {
    await this.init();

    if (this.isMySqlActive && this.mysqlPool) {
      const [result] = await this.mysqlPool.execute(sql, params);
      const res = result as any;
      return {
        insertId: res.insertId || 0,
        affectedRows: res.affectedRows || 0,
      };
    }

    if (!this.sqlJsDb) {
      throw new Error('Database is not initialized');
    }

    try {
      const sanitizedParams = params.map(p => (typeof p === 'boolean' ? (p ? 1 : 0) : p === undefined ? null : p));
      
      this.sqlJsDb.run(sql, sanitizedParams);

      // Get last insert rowid
      const idRes = this.sqlJsDb.exec('SELECT last_insert_rowid() as id');
      let insertId = 0;
      if (idRes.length > 0 && idRes[0].values.length > 0) {
        insertId = Number(idRes[0].values[0][0]) || 0;
      }

      const changesRes = this.sqlJsDb.exec('SELECT changes() as affected');
      let affectedRows = 0;
      if (changesRes.length > 0 && changesRes[0].values.length > 0) {
        affectedRows = Number(changesRes[0].values[0][0]) || 0;
      }

      this.persistSqlJs();

      return {
        insertId,
        affectedRows,
      };
    } catch (err: any) {
      console.error(`[Database Execute Error] SQL: ${sql}`, err);
      throw err;
    }
  }

  public async transaction<T>(callback: (client: DbClient) => Promise<T>): Promise<T> {
    await this.init();
    if (this.isMySqlActive && this.mysqlPool) {
      const conn = await this.mysqlPool.getConnection();
      await conn.beginTransaction();
      try {
        const wrappedClient: DbClient = {
          query: async (q, p = []) => {
            const [rows] = await conn.query(q, p);
            return rows as any;
          },
          queryOne: async (q, p = []) => {
            const [rows] = await conn.query(q, p);
            return (rows as any[])[0] || null;
          },
          execute: async (q, p = []) => {
            const [res] = await conn.execute(q, p);
            return {
              insertId: (res as any).insertId || 0,
              affectedRows: (res as any).affectedRows || 0,
            };
          },
        };
        const result = await callback(wrappedClient);
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // For sql.js
    this.sqlJsDb!.run('BEGIN TRANSACTION;');
    try {
      const result = await callback(this);
      this.sqlJsDb!.run('COMMIT;');
      this.persistSqlJs();
      return result;
    } catch (err) {
      try {
        this.sqlJsDb!.run('ROLLBACK;');
      } catch {}
      throw err;
    }
  }

  private async ensureTablesAndSeed(): Promise<void> {
    try {
      let hasUsers = false;
      if (this.isMySqlActive && this.mysqlPool) {
        try {
          const [rows]: any = await this.mysqlPool.query('SELECT COUNT(*) as count FROM users');
          if (rows && rows.length > 0 && Number(rows[0].count) > 0) {
            hasUsers = true;
          }
        } catch {
          hasUsers = false;
        }
      } else if (this.sqlJsDb) {
        try {
          const res = this.sqlJsDb.exec('SELECT count(*) as count FROM users;');
          if (res.length > 0 && res[0].values.length > 0 && Number(res[0].values[0][0]) > 0) {
            hasUsers = true;
          }
        } catch {
          hasUsers = false;
        }
      }

      if (!hasUsers) {
        console.log('[Database] Initializing relational schema and seed data...');
        await this.runBootstrapScripts();
        console.log('[Database] Database tables initialized and demo data seeded successfully!');
      } else {
        console.log('[Database] Database already contains tables and data. Ready.');
      }

      await this.ensureQuizAndRewardTablesAndSeeds();
    } catch (err) {
      console.error('[Database] Failed to bootstrap tables and seeds', err);
    }
  }

  private async runBootstrapScripts(): Promise<void> {
    // If in MySQL mode, we can run schema.sql and seed.sql
    // If in sql.js mode, we create the SQLite equivalent compatible DDL
    if (this.isMySqlActive && this.mysqlPool) {
      const schemaSqlPath = path.resolve(process.cwd(), 'database', 'schema.sql');
      const seedSqlPath = path.resolve(process.cwd(), 'database', 'seed.sql');
      if (fs.existsSync(schemaSqlPath)) {
        const sql = fs.readFileSync(schemaSqlPath, 'utf-8');
        await this.mysqlPool.query(sql);
      }
      if (fs.existsSync(seedSqlPath)) {
        const sql = fs.readFileSync(seedSqlPath, 'utf-8');
        await this.mysqlPool.query(sql);
      }
      return;
    }

    // SQLite / sql.js DDL
    const ddl = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        avatar_url TEXT,
        bio TEXT,
        location TEXT DEFAULT 'India',
        languages TEXT DEFAULT 'English, Hindi',
        skills_offered TEXT,
        skills_wanted TEXT,
        availability TEXT DEFAULT 'Flexible / Weekday Evenings & Weekends',
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT DEFAULT 'BookOpen',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        type TEXT NOT NULL,
        proficiency_level TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS skill_listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        description TEXT NOT NULL,
        proficiency_level TEXT NOT NULL,
        session_duration_minutes INTEGER NOT NULL DEFAULT 60,
        price_inr REAL NOT NULL DEFAULT 0.00,
        teaching_availability TEXT NOT NULL,
        supporting_link TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        rating_avg REAL NOT NULL DEFAULT 5.00,
        total_reviews INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS exchange_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initiator_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,
        initiator_listing_id INTEGER NOT NULL,
        recipient_listing_id INTEGER NOT NULL,
        initiator_session_price REAL NOT NULL DEFAULT 0.00,
        recipient_session_price REAL NOT NULL DEFAULT 0.00,
        additional_payment_amount REAL NOT NULL DEFAULT 0.00,
        payer_user_id INTEGER,
        proposed_date TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (initiator_listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
        FOREIGN KEY (payer_user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS exchange_request_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exchange_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        proficiency_level TEXT NOT NULL,
        role_type TEXT NOT NULL,
        FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        instructor_id INTEGER NOT NULL,
        session_price_inr REAL NOT NULL,
        scheduled_at TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        student_notes TEXT,
        status TEXT NOT NULL DEFAULT 'awaiting_payment',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        booking_id INTEGER,
        exchange_id INTEGER,
        payment_type TEXT NOT NULL,
        amount_inr REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'demo_gateway',
        transaction_id TEXT NOT NULL UNIQUE,
        gateway_status TEXT NOT NULL DEFAULT 'success',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
        FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        exchange_id INTEGER,
        instructor_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        scheduled_at TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        meeting_link TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        listing_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewee_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listing_id) REFERENCES skill_listings(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant1_id INTEGER NOT NULL,
        participant2_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        reported_user_id INTEGER,
        listing_id INTEGER,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (listing_id) REFERENCES skill_listings(id) ON DELETE SET NULL
      );
    `;

    this.sqlJsDb!.exec(ddl);

    // Now seed the database using parameterized and safe queries
    const seedCategories = [
      [1, 'Programming & Tech', 'programming-tech', 'Web development, mobile apps, software architecture and programming languages', 'Code'],
      [2, 'Design & Creative', 'design-creative', 'UI/UX design, graphic design, 3D modeling, and branding', 'Palette'],
      [3, 'Languages & Communication', 'languages-communication', 'Spoken English, regional languages, interview preparation and rhetoric', 'Languages'],
      [4, 'Data & Databases', 'data-databases', 'SQL, database design, data analysis, and machine learning basics', 'Database'],
      [5, 'Digital Media & Video', 'media-video', 'Video editing, reels creation, color grading, and podcast production', 'Video'],
      [6, 'Academic & MCA Core', 'academic-mca', 'Algorithms, computer networks, operating systems, and theory of computation', 'GraduationCap']
    ];

    for (const c of seedCategories) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO categories (id, name, slug, description, icon) VALUES (?, ?, ?, ?, ?);', c);
    }

    // Default password hash for Password@123
    const hash = '$2b$10$VYfqNpo56cuty6hvRZsfd.a0ghP5GeN5ifAtjybCa0WWwZNJx.hhi';

    const seedUsers = [
      [1, 'Amit Jha', 'admin@skillswap.in', hash, 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'Platform Administrator & MCA Program Coordinator. Ensuring safe, equitable peer-to-peer student learning exchanges.', 'New Delhi, India', 'English, Hindi', 'System Architecture, MCA Project Guidance', 'None', 'Full-time Admin', 'active'],
      [2, 'Brijlal', 'brijlal@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', 'Final year MCA student passionate about backend systems, Core Java, and relational database fundamentals.', 'Lucknow, Uttar Pradesh', 'Hindi, English', 'Java, SQL Basics', 'JavaScript, React.js', 'Mon-Fri 6:00 PM - 9:00 PM', 'active'],
      [3, 'Mohit Verma', 'mohit@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', 'Frontend developer building single page applications in React and Tailwind CSS. Eager to master backend query tuning.', 'Indore, Madhya Pradesh', 'English, Hindi', 'React.js, Tailwind CSS', 'SQL, Java Backend', 'Sat-Sun 10:00 AM - 4:00 PM', 'active'],
      [4, 'Isha Bhati', 'isha@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', 'UI/UX enthusiast, Figma wizard, and design systems creator. Looking to learn Python for automation.', 'Jaipur, Rajasthan', 'English, Hindi', 'UI/UX Design, Figma', 'Python, Data Analytics', 'Daily 5:00 PM - 8:00 PM', 'active'],
      [5, 'Komal Saroj', 'komal@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'Pre-final student learning Python syntax and scripting. Want to make clean interfaces with Figma and UI design.', 'Varanasi, Uttar Pradesh', 'Hindi, English', 'Python, Basic Scripting', 'UI/UX Design, Figma', 'Tue, Thu, Sat 7:00 PM - 10:00 PM', 'active'],
      [6, 'Rahul Sharma', 'rahul@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80', 'Database specialist experienced in complex indexing, normalization, transaction isolation, and query optimization.', 'Bengaluru, Karnataka', 'English, Hindi, Kannada', 'SQL, Database Indexing', 'Spoken English, Public Speaking', 'Weekends 9:00 AM - 1:00 PM', 'active'],
      [7, 'Priya Singh', 'priya@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', 'Graphic designer crafting brand identities, vector illustrations, and marketing banners using Adobe Photoshop & Illustrator.', 'Bhopal, Madhya Pradesh', 'English, Hindi', 'Graphic Design, Branding', 'Web Development, HTML/CSS', 'Mon, Wed, Fri 4:00 PM - 7:00 PM', 'active'],
      [8, 'Ananya Gupta', 'ananya@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80', 'Certified communications mentor, debate coach, and campus placement interview prep specialist.', 'Pune, Maharashtra', 'English, Hindi, Marathi', 'Spoken English, Interview Prep', 'Data Structures & Algorithms', 'Mon-Sat 7:00 PM - 9:00 PM', 'active'],
      [9, 'Arjun Yadav', 'arjun@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80', 'Content creator editing high-engagement Instagram Reels, YouTube shorts, and Premiere Pro timelines.', 'Noida, Uttar Pradesh', 'Hindi, English', 'Video Editing, Reels Editing', 'React.js, Web Design', 'Daily 8:00 PM - 11:00 PM', 'active'],
      [10, 'Neha Kumari', 'neha@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80', 'Competitive programmer with 400+ LeetCode problems solved. Specializing in Trees, Graphs, and Dynamic Programming in C++.', 'Patna, Bihar', 'English, Hindi', 'Data Structures, C++ Algorithms', 'Graphic Design, Branding', 'Sat-Sun 2:00 PM - 6:00 PM', 'active'],
      [11, 'Rohit Mishra', 'rohit@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80', 'Full stack engineer building REST APIs with Node.js, Express, JWT, and relational databases.', 'Kanpur, Uttar Pradesh', 'English, Hindi', 'Node.js, Express REST APIs', 'Machine Learning, Python', 'Weekdays 7:00 PM - 9:30 PM', 'active'],
      [12, 'Sneha Patel', 'sneha@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', 'Data enthusiast teaching supervised machine learning, Scikit-learn, regression, and model evaluation techniques.', 'Ahmedabad, Gujarat', 'English, Hindi, Gujarati', 'Machine Learning, Scikit-learn', 'SQL Database Tuning', 'Tue, Thu, Sun 6:00 PM - 9:00 PM', 'active'],
      [13, 'Aman Verma', 'aman@skillswap.in', hash, 'student', 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&auto=format&fit=crop&q=80', 'Cyber security club lead covering OWASP Top 10 web vulnerabilities, Burp Suite, and penetration testing basics.', 'Chandigarh, India', 'English, Hindi, Punjabi', 'Cyber Security, Ethical Hacking', 'Spoken English, Public Speaking', 'Weekends 11:00 AM - 3:00 PM', 'active']
    ];

    for (const u of seedUsers) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO users (id, name, email, password_hash, role, avatar_url, bio, location, languages, skills_offered, skills_wanted, availability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', u);
    }

    const seedListings = [
      [1, 2, 1, 'Core Java OOP & Fundamentals for Beginners', 'Java', 'Master Object-Oriented Programming, classes, inheritance, polymorphism, and basic collection frameworks with hands-on coding exercises.', 'Beginner', 60, 300.00, 'Mon, Wed, Fri 6:00 PM - 8:00 PM', 'https://github.com/demo/java-basics', 1, 4.80, 5],
      [2, 2, 4, 'Basic SQL Queries & Relational Concepts', 'SQL', 'Learn SELECT queries, WHERE clauses, GROUP BY, aggregates, and simple JOINs to query data effectively.', 'Beginner', 60, 300.00, 'Tue, Thu 7:00 PM - 9:00 PM', 'https://github.com/demo/sql-basics', 1, 4.70, 3],
      [3, 3, 1, 'Modern React.js: Components, State & Hooks', 'React.js', 'Step-by-step guidance on React 18/19, useState, useEffect, custom hooks, and Tailwind CSS component architecture.', 'Intermediate', 60, 400.00, 'Sat-Sun 10:00 AM - 1:00 PM', 'https://github.com/demo/react-showcase', 1, 4.90, 8],
      [4, 4, 2, 'Figma UI/UX Design & Design Systems Workshop', 'UI/UX Design', 'Learn Figma auto-layout, interactive prototyping, color contrast, typographic hierarchy, and micro-interactions.', 'Intermediate', 60, 500.00, 'Daily 6:00 PM - 8:00 PM', 'https://behance.net/demo-portfolio', 1, 5.00, 11],
      [5, 5, 1, 'Python Programming & Scripting for Novices', 'Python', 'Gentle introduction to Python syntax, loops, functions, data structures (lists/dictionaries), and file handling.', 'Beginner', 60, 300.00, 'Tue, Thu, Sat 7:00 PM - 9:00 PM', 'https://github.com/demo/python-starter', 1, 4.60, 4],
      [6, 6, 4, 'Advanced SQL Optimization, Indexing & Transactions', 'SQL', 'Deep dive into EXPLAIN query plans, B-Tree indexes, composite keys, locking mechanisms, and ACID transaction isolation.', 'Advanced', 75, 600.00, 'Weekends 9:00 AM - 12:00 PM', 'https://github.com/demo/advanced-db', 1, 4.95, 14],
      [7, 7, 2, 'Graphic Design, Vector Logos & Social Brand Kits', 'Graphic Design', 'Learn Adobe Illustrator/Photoshop tools to craft compelling student club logos, posters, and digital identity packs.', 'Intermediate', 60, 450.00, 'Mon, Wed, Fri 4:00 PM - 6:00 PM', 'https://dribbble.com/demo-graphic', 1, 4.85, 7],
      [8, 8, 3, 'Spoken English, Fluency & Tech Interview Mastery', 'Spoken English', 'Overcome hesitation in technical interviews and group discussions. Improve pronunciation, vocabulary, and active speech flow.', 'Advanced', 60, 500.00, 'Mon-Sat 7:00 PM - 9:00 PM', 'https://linkedin.com/in/demo-mentor', 1, 4.98, 19],
      [9, 9, 5, 'Short-form Video Editing (Premiere Pro & CapCut)', 'Video Editing', 'Master viral pacing, keyframing, motion graphics, audio ducking, and color presets for Instagram Reels and YouTube shorts.', 'Beginner', 60, 300.00, 'Daily 8:00 PM - 10:00 PM', 'https://youtube.com/@demo-creator', 1, 4.65, 6],
      [10, 10, 6, 'Data Structures & Algorithms: Trees & Dynamic Prog', 'DSA in C++', 'Ace technical interviews! Master binary tree traversals, graphs, memoization, and dynamic programming patterns.', 'Intermediate', 75, 400.00, 'Sat-Sun 2:00 PM - 5:00 PM', 'https://leetcode.com/demo_profile', 1, 4.90, 12],
      [11, 11, 1, 'REST API Development with Node.js & Express', 'Node.js', 'Build secure backends: routing, middleware, JWT verification, input validation, and database pooling.', 'Intermediate', 60, 450.00, 'Weekdays 7:00 PM - 9:00 PM', 'https://github.com/demo/express-apis', 1, 4.80, 9],
      [12, 12, 4, 'Practical Machine Learning with Python & Scikit', 'Machine Learning', 'Train classification and regression models, feature engineering, cross-validation, and performance metrics.', 'Intermediate', 60, 550.00, 'Tue, Thu 6:30 PM - 8:30 PM', 'https://kaggle.com/demo_learner', 1, 4.75, 5],
      [13, 13, 1, 'Ethical Hacking 101 & Web App Penetration Testing', 'Cyber Security', 'Understand SQL injection, XSS, CSRF, network reconnaissance, and practical defense strategies.', 'Intermediate', 60, 500.00, 'Weekends 11:00 AM - 2:00 PM', 'https://github.com/demo/sec-notes', 1, 4.88, 8]
    ];

    for (const l of seedListings) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO skill_listings (id, user_id, category_id, title, skill_name, description, proficiency_level, session_duration_minutes, price_inr, teaching_availability, supporting_link, is_active, rating_avg, total_reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', l);
    }

    // Insert sample exchange requests
    const seedExchanges = [
      [1, 2, 3, 2, 3, 300.00, 300.00, 0.00, null, 'Next Saturday, 4:00 PM', 'Hey Mohit! I can teach you SQL queries and would love to exchange for your React basics session. Equal level swap!', 'confirmed'],
      [2, 5, 4, 5, 4, 300.00, 500.00, 200.00, 5, 'Upcoming Thursday, 7:00 PM', 'Hi Isha, I want to learn Figma UI design from you. I offer beginner Python. Since your session is ₹500 and mine is ₹300, I will pay the ₹200 difference via SkillSwap.', 'accepted'],
      [3, 9, 7, 9, 7, 300.00, 450.00, 150.00, 9, 'Coming Monday, 6:00 PM', 'Hi Priya, I can offer video editing tips in exchange for your graphic design session. Ready to cover the ₹150 difference!', 'pending']
    ];

    for (const ex of seedExchanges) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO exchange_requests (id, initiator_id, recipient_id, initiator_listing_id, recipient_listing_id, initiator_session_price, recipient_session_price, additional_payment_amount, payer_user_id, proposed_date, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', ex);
    }

    // Insert exchange request skills
    const seedExSkills = [
      [1, 1, 'SQL', 'Beginner', 'initiator_offer'],
      [2, 1, 'React.js', 'Beginner', 'recipient_offer'],
      [3, 2, 'Python', 'Beginner', 'initiator_offer'],
      [4, 2, 'UI/UX Design', 'Intermediate', 'recipient_offer'],
      [5, 3, 'Video Editing', 'Beginner', 'initiator_offer'],
      [6, 3, 'Graphic Design', 'Intermediate', 'recipient_offer']
    ];
    for (const es of seedExSkills) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO exchange_request_skills (id, exchange_id, skill_name, proficiency_level, role_type) VALUES (?, ?, ?, ?, ?);', es);
    }

    // Seed bookings
    const seedBookings = [
      [1, 3, 2, 3, 400.00, '2026-10-25 10:00 AM', 60, 'Direct booking to learn React component lifecycle and hooks.', 'confirmed'],
      [2, 8, 6, 8, 500.00, '2026-10-28 07:00 PM', 60, 'Rahul booked Ananya for tech campus placement communication prep.', 'confirmed'],
      [3, 6, 5, 6, 600.00, '2026-11-02 11:00 AM', 75, 'Komal booked Rahul for advanced SQL indexing fundamentals.', 'awaiting_payment']
    ];
    for (const b of seedBookings) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO bookings (id, listing_id, student_id, instructor_id, session_price_inr, scheduled_at, duration_minutes, student_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', b);
    }

    // Seed payments
    const seedPayments = [
      [1, 2, 1, null, 'booking', 400.00, 'upi', 'SSG-TXN-20261018-001', 'success'],
      [2, 6, 2, null, 'booking', 500.00, 'card', 'SSG-TXN-20261018-002', 'success'],
      [3, 5, null, 2, 'exchange_difference', 200.00, 'upi', 'SSG-TXN-20261018-003', 'success']
    ];
    for (const p of seedPayments) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO payments (id, user_id, booking_id, exchange_id, payment_type, amount_inr, payment_method, transaction_id, gateway_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', p);
    }

    // Seed sessions
    const seedSessions = [
      [1, 1, null, 3, 2, '2026-10-25 10:00 AM', 60, 'https://meet.skillswap.in/room-mohit-brijlal-react', 'completed'],
      [2, null, 1, 2, 3, 'Next Saturday, 4:00 PM', 60, 'https://meet.skillswap.in/room-swap-brijlal-mohit', 'scheduled'],
      [3, 2, null, 8, 6, '2026-10-28 07:00 PM', 60, 'https://meet.skillswap.in/room-ananya-rahul-comm', 'scheduled']
    ];
    for (const s of seedSessions) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO sessions (id, booking_id, exchange_id, instructor_id, student_id, scheduled_at, duration_minutes, meeting_link, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', s);
    }

    // Seed reviews
    const seedReviews = [
      [1, 1, 3, 2, 3, 5, 'Mohit is a phenomenal instructor! He explained React state and custom hooks so clearly with real examples.'],
      [2, null, 4, 5, 4, 5, 'Isha showed me how to structure Figma components and wireframes step-by-step. Worth every rupee!'],
      [3, null, 6, 2, 6, 5, 'Rahul demystified database execution plans and B-Tree indexing. Outstanding session!'],
      [4, null, 8, 6, 8, 5, 'Ananya gave actionable feedback on my pitch and interview responses. Feel much more confident now.']
    ];
    for (const r of seedReviews) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO reviews (id, session_id, listing_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?, ?);', r);
    }

    // Seed conversations & messages
    this.sqlJsDb!.run('INSERT OR IGNORE INTO conversations (id, participant1_id, participant2_id) VALUES (1, 2, 3), (2, 4, 5);');
    const seedMsgs = [
      [1, 1, 2, 3, 'Hi Mohit! Are you free this weekend for our SQL <-> React swap session?', 1],
      [2, 1, 3, 2, 'Hey Brijlal! Yes, Saturday 4:00 PM works perfectly. Looking forward to it!', 1],
      [3, 2, 5, 4, 'Hi Isha, I saw your Figma listing and submitted an exchange request with the ₹200 fee difference.', 1],
      [4, 2, 4, 5, 'Great Komal! I just accepted it. See you on Thursday at 7:00 PM!', 1]
    ];
    for (const m of seedMsgs) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO messages (id, conversation_id, sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, ?, ?, ?);', m);
    }

    // Seed notifications
    const seedNotifs = [
      [1, 3, 'exchange_request', 'New Skill Exchange Request', 'Brijlal has proposed an equal-value skill swap for your React.js listing.', '/exchanges', 1],
      [2, 4, 'exchange_request', 'Unequal Exchange Proposal', 'Komal Saroj proposed an exchange for your UI/UX listing with ₹200 differential payment.', '/exchanges', 1],
      [3, 2, 'booking_confirmed', 'Session Booking Confirmed', 'Your booking with Mohit Verma for React.js is confirmed. Meeting link generated.', '/bookings', 0],
      [4, 5, 'exchange_accepted', 'Exchange Accepted', 'Isha Bhati accepted your skill exchange proposal for Figma UI/UX.', '/exchanges', 0]
    ];
    for (const n of seedNotifs) {
      this.sqlJsDb!.run('INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, link, is_read) VALUES (?, ?, ?, ?, ?, ?, ?);', n);
    }

    // Seed reports
    this.sqlJsDb!.run("INSERT OR IGNORE INTO reports (id, reporter_id, reported_user_id, listing_id, reason, status) VALUES (1, 2, 9, 9, 'Listing description mentions off-platform payment method instead of SkillSwap safe gateway.', 'pending');");

    this.persistSqlJs();
  }

  private async ensureQuizAndRewardTablesAndSeeds(): Promise<void> {
    try {
      // 1. Column migrations for users
      try {
        await this.execute("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 250;");
      } catch {
        // column already exists
      }
      try {
        await this.execute("ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';");
      } catch {
        // column already exists
      }
      try {
        await this.execute("ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME;");
      } catch {
        // column already exists
      }

      // 2. DDL for Quizzes, Global Contests, Rewards, and Points
      const quizDdl = `
        CREATE TABLE IF NOT EXISTS quizzes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          creator_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          skill_category TEXT NOT NULL,
          difficulty TEXT NOT NULL DEFAULT 'intermediate',
          time_limit_minutes INTEGER NOT NULL DEFAULT 5,
          reward_points INTEGER NOT NULL DEFAULT 50,
          share_code TEXT NOT NULL UNIQUE,
          is_public INTEGER NOT NULL DEFAULT 1,
          contest_id INTEGER,
          total_plays INTEGER NOT NULL DEFAULT 0,
          avg_score REAL NOT NULL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          options_json TEXT NOT NULL,
          correct_option_index INTEGER NOT NULL,
          explanation TEXT,
          order_num INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          contest_id INTEGER,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          percentage REAL NOT NULL,
          time_taken_seconds INTEGER NOT NULL DEFAULT 60,
          points_awarded INTEGER NOT NULL DEFAULT 0,
          answers_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS global_contests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          creator_admin_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          cover_image TEXT,
          entry_type TEXT NOT NULL DEFAULT 'free',
          entry_fee_inr REAL NOT NULL DEFAULT 0.00,
          status TEXT NOT NULL DEFAULT 'active',
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          prize_pool_points INTEGER NOT NULL DEFAULT 5000,
          rank_1_points INTEGER NOT NULL DEFAULT 2500,
          rank_2_points INTEGER NOT NULL DEFAULT 1500,
          rank_3_points INTEGER NOT NULL DEFAULT 750,
          participation_points INTEGER NOT NULL DEFAULT 100,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_admin_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS contest_quizzes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contest_id INTEGER NOT NULL,
          quiz_id INTEGER NOT NULL,
          round_number INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (contest_id) REFERENCES global_contests(id) ON DELETE CASCADE,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS contest_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contest_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          payment_id INTEGER,
          total_score INTEGER NOT NULL DEFAULT 0,
          total_time_seconds INTEGER NOT NULL DEFAULT 0,
          quizzes_completed INTEGER NOT NULL DEFAULT 0,
          rank INTEGER,
          points_rewarded INTEGER NOT NULL DEFAULT 0,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (contest_id) REFERENCES global_contests(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS reward_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          points_cost INTEGER NOT NULL,
          original_price_inr REAL NOT NULL DEFAULT 0.00,
          image_url TEXT NOT NULL,
          badge TEXT,
          tier_code TEXT,
          duration_days INTEGER DEFAULT 0,
          stock INTEGER NOT NULL DEFAULT 999,
          is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS reward_redemptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reward_item_id INTEGER NOT NULL,
          points_spent INTEGER NOT NULL,
          claim_code TEXT NOT NULL UNIQUE,
          shipping_address TEXT,
          status TEXT NOT NULL DEFAULT 'completed',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reward_item_id) REFERENCES reward_items(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS point_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          amount INTEGER NOT NULL,
          transaction_type TEXT NOT NULL,
          description TEXT NOT NULL,
          reference_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;

      if (this.sqlJsDb) {
        this.sqlJsDb.exec(quizDdl);
      } else if (this.mysqlPool) {
        // MySQL query
        const statements = quizDdl.split(';').map(s => s.trim()).filter(Boolean);
        for (const st of statements) {
          try {
            await this.mysqlPool.query(st);
          } catch {}
        }
      }

      // Check if quizzes already seeded
      const existingQuizzes = await this.query('SELECT COUNT(*) as count FROM quizzes');
      if (Number(existingQuizzes[0]?.count || 0) === 0) {
        console.log('[Database] Seeding interactive quizzes, global contests, and rewards catalog...');

        // Update default users with realistic initial points
        await this.execute("UPDATE users SET points = 1200 WHERE id = 1;"); // Amit Jha (Admin)
        await this.execute("UPDATE users SET points = 650 WHERE id = 2;"); // Brijlal
        await this.execute("UPDATE users SET points = 800 WHERE id = 3;"); // Mohit Verma
        await this.execute("UPDATE users SET points = 950 WHERE id = 4;"); // Isha Bhati
        await this.execute("UPDATE users SET points = 400 WHERE id = 5;"); // Komal Saroj
        await this.execute("UPDATE users SET points = 720 WHERE id = 6;"); // Rahul Sharma

        // Seed Quizzes
        const quizzes = [
          [
            1,
            3, // Creator: Mohit Verma
            'Modern React 19: State, Hooks & Server Actions',
            'Test your understanding of component lifecycle, custom hooks, useMemo optimization, and the latest React 19 features.',
            'React.js',
            'intermediate',
            6,
            75,
            'QUIZ-REACT-101',
            1,
            null,
            28,
            86.5
          ],
          [
            2,
            6, // Creator: Rahul Sharma
            'Relational Database Indexing & Query Tuning',
            'Assess your SQL query optimization prowess: B-Trees, composite indexes, EXPLAIN cost plans, and transaction isolation.',
            'SQL & Databases',
            'advanced',
            8,
            100,
            'QUIZ-SQL-301',
            1,
            null,
            19,
            78.0
          ],
          [
            3,
            4, // Creator: Isha Bhati
            'UI/UX Design Systems & Micro-Interactions',
            'Evaluate your knowledge of typography scale, auto-layout hierarchies, WCAG contrast ratios, and user empathy principles.',
            'UI/UX Design',
            'beginner',
            5,
            50,
            'QUIZ-UIUX-201',
            1,
            null,
            34,
            92.0
          ],
          [
            4,
            5, // Creator: Komal Saroj
            'Python Foundations & Algorithmic Problem Solving',
            'Challenge yourself with list comprehensions, lambda expressions, dictionary hashing, and time complexity calculations.',
            'Python & Scripting',
            'intermediate',
            6,
            60,
            'QUIZ-PYTH-102',
            1,
            null,
            22,
            84.0
          ],
          [
            5,
            13, // Creator: Aman Verma
            'Web Security OWASP Top 10 & Safe Authentication',
            'Core concepts of XSS defenses, CSRF tokens, SQL injection prevention, bcrypt salting, and secure JWT verification.',
            'Cyber Security',
            'advanced',
            7,
            90,
            'QUIZ-SECU-401',
            1,
            null,
            15,
            80.0
          ]
        ];

        for (const q of quizzes) {
          await this.execute(
            `INSERT OR IGNORE INTO quizzes (id, creator_id, title, description, skill_category, difficulty, time_limit_minutes, reward_points, share_code, is_public, contest_id, total_plays, avg_score)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            q
          );
        }

        // Seed Quiz Questions
        const questions = [
          // Quiz 1: React 19
          [
            1, 1,
            'Which React hook is specifically designed to memoize the result of an expensive calculation between re-renders?',
            JSON.stringify(['useEffect', 'useMemo', 'useCallback', 'useRef']),
            1,
            'useMemo caches the calculated value between renders unless its dependencies change, preventing redundant recalculations.',
            1
          ],
          [
            2, 1,
            'What is the primary difference between useEffect and useLayoutEffect?',
            JSON.stringify([
              'useEffect runs synchronously before browser paint, useLayoutEffect runs asynchronously',
              'useLayoutEffect fires synchronously immediately after DOM mutations before browser paint',
              'useLayoutEffect only works with server-side rendered components',
              'There is no difference; they are aliases for the same underlying hook'
            ]),
            1,
            'useLayoutEffect executes synchronously after all DOM mutations but before the browser paints the screen, making it suitable for reading layout measurements.',
            2
          ],
          [
            3, 1,
            'In React 19, what is the recommended way to handle asynchronous form submissions natively?',
            JSON.stringify(['useReducer and Redux', 'Server Actions with useActionState', 'Manual window.fetch with preventDefault', 'Redux Saga']),
            1,
            'React 19 introduces first-class Actions and useActionState to automatically track pending state, optimistic updates, and form submissions.',
            3
          ],
          [
            4, 1,
            'Why should you never mutate state directly (e.g., state.count = 5) in a React component?',
            JSON.stringify([
              'It causes an immediate JavaScript syntax error in modern engines',
              'React relies on shallow reference equality checks (Object.is) to trigger re-renders',
              'Direct mutation automatically clears localStorage and cookies',
              'React only allows direct mutation when running in strict mode'
            ]),
            1,
            'React checks whether component state references have changed using Object.is. Mutating an existing object in-place preserves the memory pointer, preventing re-renders.',
            4
          ],

          // Quiz 2: SQL & Databases
          [
            5, 2,
            'What is the standard time complexity for searching a record in a balanced B-Tree index?',
            JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N^2)']),
            1,
            'A balanced B-Tree index structure enables search, insert, and delete operations in logarithmic O(log N) time.',
            1
          ],
          [
            6, 2,
            'In a composite index on (department_id, salary), which of the following queries will CANNOT use the index efficiently?',
            JSON.stringify([
              'WHERE department_id = 5',
              'WHERE department_id = 5 AND salary > 50000',
              'WHERE salary > 50000',
              'WHERE department_id = 5 ORDER BY salary DESC'
            ]),
            2,
            'Due to the Leftmost Prefix Rule in relational B-Tree indexes, a search querying only "salary" without specifying "department_id" cannot traverse the tree.',
            2
          ],
          [
            7, 2,
            'Which transaction isolation level prevents Dirty Reads and Non-Repeatable Reads, but may still allow Phantom Reads?',
            JSON.stringify(['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable']),
            2,
            'Repeatable Read ensures that any data read during a transaction remains identical throughout, preventing dirty reads and non-repeatable reads.',
            3
          ],

          // Quiz 3: UI/UX Design
          [
            8, 3,
            'According to WCAG 2.1 AA standards, what is the minimum required color contrast ratio for normal body text?',
            JSON.stringify(['3:1', '4.5:1', '7:1', '10:1']),
            1,
            'WCAG 2.1 AA mandates a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt bold).',
            1
          ],
          [
            9, 3,
            "Which UX design law states that 'the time required to rapidly move to a target area is a function of the ratio between distance and width'?",
            JSON.stringify(["Hick's Law", "Fitts's Law", "Miller's Law", "Jakob's Law"]),
            1,
            "Fitts's law models target acquisition time: larger and closer clickable targets (like primary CTA buttons) are faster and easier to click.",
            2
          ],
          [
            10, 3,
            'What is the primary benefit of maintaining an 8pt Grid System in interface design?',
            JSON.stringify([
              'It forces all images to be exactly 800px wide',
              'It creates visual rhythm, consistent spacing, and scales predictably across device screen densities',
              'It reduces CSS bundle sizes by 50%',
              'It is required by Google Chrome for page indexing'
            ]),
            1,
            'An 8pt grid provides consistent proportional spacing, simplifies designer-developer handoff, and aligns cleanly with most device pixel ratios.',
            3
          ],

          // Quiz 4: Python & Scripting
          [
            11, 4,
            'What does the following Python expression evaluate to: [x**2 for x in range(5) if x % 2 == 0]?',
            JSON.stringify(['[0, 1, 4, 9, 16]', '[0, 4, 16]', '[1, 9]', '[4, 16]']),
            1,
            'range(5) produces 0, 1, 2, 3, 4. Even numbers are 0, 2, 4. Squaring them yields [0, 4, 16].',
            1
          ],
          [
            12, 4,
            'In Python, what is the average time complexity for retrieving a value from a dict by its key?',
            JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N log N)']),
            0,
            'Python dictionaries are implemented using hash tables, providing average O(1) constant time lookup and insertion.',
            2
          ],

          // Quiz 5: Cyber Security
          [
            13, 5,
            'What is the most effective defensive practice against SQL Injection vulnerabilities?',
            JSON.stringify([
              'Escaping single quotes manually in client JavaScript',
              'Using parameterized queries / prepared statements with placeholder variables',
              'Encoding user input into Base64 before sending it to the database',
              'Running the database on a non-standard port'
            ]),
            1,
            'Parameterized queries ensure the database driver treats user input strictly as literal values rather than executable SQL code, neutralizing SQL injection.',
            1
          ],
          [
            14, 5,
            'Why is it critical to use a salt when hashing user passwords with bcrypt or Argon2?',
            JSON.stringify([
              'It speeds up database search queries',
              'It prevents precomputed Rainbow Table attacks and ensures identical passwords produce unique hashes',
              'It decrypts passwords when users forget their credentials',
              'It compresses password strings to save disk space'
            ]),
            1,
            'A cryptographic salt guarantees that even if two users choose the same password, their hashes will be distinct, rendering rainbow table lookup attacks ineffective.',
            2
          ]
        ];

        for (const qn of questions) {
          await this.execute(
            `INSERT OR IGNORE INTO quiz_questions (id, quiz_id, question_text, options_json, correct_option_index, explanation, order_num)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            qn
          );
        }

        // Seed Global Contests
        const contests = [
          [
            1,
            1, // Created by Amit Jha (Admin)
            'SkillSwap All-India Web Dev Championship 2026',
            'A high-stakes nationwide skill competition testing React, modern JavaScript patterns, and UI craftsmanship. Compete for 10,000 points and exclusive Pro subscriptions!',
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
            'free',
            0.00,
            'active',
            '2026-10-15',
            '2026-11-15',
            10000,
            5000,
            3000,
            1500,
            150
          ],
          [
            2,
            1, // Created by Amit Jha (Admin)
            'Master MCA Relational Architecture Super Cup',
            'Elite contest for computer science & MCA students covering advanced database indexing, SQL execution plans, and transaction concurrency. Win mechanical keyboards, swag, and VIP passes!',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
            'paid',
            99.00,
            'active',
            '2026-10-18',
            '2026-11-25',
            25000,
            12000,
            7000,
            4000,
            300
          ]
        ];

        for (const ct of contests) {
          await this.execute(
            `INSERT OR IGNORE INTO global_contests (id, creator_admin_id, title, description, cover_image, entry_type, entry_fee_inr, status, start_date, end_date, prize_pool_points, rank_1_points, rank_2_points, rank_3_points, participation_points)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            ct
          );
        }

        // Link Quizzes to Contests
        await this.execute('INSERT OR IGNORE INTO contest_quizzes (id, contest_id, quiz_id, round_number) VALUES (1, 1, 1, 1);');
        await this.execute('INSERT OR IGNORE INTO contest_quizzes (id, contest_id, quiz_id, round_number) VALUES (2, 1, 3, 2);');
        await this.execute('INSERT OR IGNORE INTO contest_quizzes (id, contest_id, quiz_id, round_number) VALUES (3, 2, 2, 1);');
        await this.execute('INSERT OR IGNORE INTO contest_quizzes (id, contest_id, quiz_id, round_number) VALUES (4, 2, 5, 2);');

        // Seed Sample Contest Participants
        await this.execute(
          `INSERT OR IGNORE INTO contest_participants (id, contest_id, user_id, total_score, total_time_seconds, quizzes_completed, rank, points_rewarded)
           VALUES 
           (1, 1, 4, 8, 140, 2, 1, 0),
           (2, 1, 3, 7, 165, 2, 2, 0),
           (3, 1, 2, 6, 190, 2, 3, 0),
           (4, 2, 6, 6, 210, 2, 1, 0);`
        );

        // Seed Reward Store Items (Subscriptions & Cool Gifts)
        const rewardItems = [
          // Subscriptions
          [
            1,
            'subscription',
            'SkillSwap Pro Student Pass (1 Month)',
            'Zero platform commission on all paid mentor bookings, verified student Pro badge, unlimited quiz creation, and 2x point multipliers on learning challenges.',
            500,
            399.00,
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
            'Most Popular',
            'pro_monthly',
            30,
            999
          ],
          [
            2,
            'subscription',
            'SkillSwap Pro Master Pass (3 Months)',
            'All Pro features + Free instant access to all Global Paid Contests, priority homepage spotlight for your skill listings, and quarterly certificate of peer mentoring.',
            1200,
            999.00,
            'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
            'Best Value',
            'pro_master',
            90,
            999
          ],
          [
            3,
            'subscription',
            'SkillSwap Annual VIP Scholar Pass (1 Year)',
            'Ultimate prestige! All Pro Master perks for a full year, private 1-on-1 mentorship consultation with senior MCA faculty, and lifetime VIP alumni badge.',
            3500,
            2999.00,
            'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
            'VIP Exclusive',
            'vip_annual',
            365,
            999
          ],

          // Cool Gifts & Tech Swag
          [
            4,
            'gift',
            'SkillSwap RGB Mechanical Dev Keyboard',
            'Custom hot-swappable tactile blue switches, per-key RGB backlighting, braided USB-C cable, and laser-engraved code shortcut keycaps. Delivered to your doorstep!',
            2500,
            2499.00,
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
            'Hot Swag',
            null,
            0,
            45
          ],
          [
            5,
            'gift',
            'Premium SkillSwap Embroidered Tech Hoodie',
            'Heavyweight 380 GSM combed organic cotton, minimalist embroidered SkillSwap Global insignia, kangaroo pocket, and fleece lined interior. Sizes S to XXL.',
            1200,
            1499.00,
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
            'Student Favorite',
            null,
            0,
            80
          ],
          [
            6,
            'gift',
            'Studio Wireless Active Noise-Cancelling Headphones',
            '40mm dynamic drivers, hybrid ANC technology to silence library distractions, 45-hour battery life, and ultra-comfortable memory foam ear cushions.',
            4000,
            4999.00,
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
            'Grand Prize',
            null,
            0,
            20
          ],
          [
            7,
            'voucher',
            '₹1,000 Amazon Tech & Book Voucher',
            'Redeemable for coding textbooks, electronics, desk accessories, or Kindle editions on Amazon India. Instant digital voucher code.',
            1500,
            1000.00,
            'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
            'Instant Digital',
            null,
            0,
            150
          ],
          [
            8,
            'voucher',
            '₹500 Swiggy / Zomato Late-Night Coding Fuel',
            'Fuel your late-night coding and exam cramming sessions with favorite meals delivered to your hostel or home. Instant digital promo code.',
            800,
            500.00,
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
            'Fast Delivery',
            null,
            0,
            200
          ],
          [
            9,
            'gift',
            'SkillSwap Stainless Tumbler & Holographic Sticker Pack',
            'Double-wall vacuum insulated 500ml matte black tumbler that keeps coffee hot for 12 hours + 10 waterproof holographic developer stickers.',
            350,
            499.00,
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
            'Starter Swag',
            null,
            0,
            120
          ]
        ];

        for (const item of rewardItems) {
          await this.execute(
            `INSERT OR IGNORE INTO reward_items (id, category, title, description, points_cost, original_price_inr, image_url, badge, tier_code, duration_days, stock, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            item
          );
        }

        // Seed Sample Point Transactions
        const initialTxs = [
          [1, 3, 250, 'welcome_bonus', 'SkillSwap community welcome gift points', 'WELCOME-2026'],
          [2, 3, 500, 'quiz_created_bonus', 'Created popular quiz: Modern React 19', 'QUIZ-REACT-101'],
          [3, 3, 50, 'quiz_completed', 'Achieved 100% on UI/UX Design Systems Quiz', 'ATTEMPT-01'],
          [4, 4, 750, 'contest_reward', '2nd Place Runner-Up in Web Dev Championship', 'CONTEST-01'],
          [5, 4, 200, 'quiz_created_bonus', 'Created quiz: UI/UX Design Systems', 'QUIZ-UIUX-201'],
          [6, 2, 400, 'quiz_completed', 'Completed SQL Indexing and Python Quizzes', 'QUIZ-SQL-301'],
          [7, 6, 720, 'contest_reward', '1st Place Winner in Relational Super Cup Round', 'CONTEST-02']
        ];

        for (const tx of initialTxs) {
          await this.execute(
            `INSERT OR IGNORE INTO point_transactions (id, user_id, amount, transaction_type, description, reference_id)
             VALUES (?, ?, ?, ?, ?, ?);`,
            tx
          );
        }

        // Persist to disk
        this.persistSqlJs();
        console.log('[Database] Quizzes, Contests, and Rewards catalog seeded successfully!');
      }
    } catch (err) {
      console.error('[Database] Failed to ensure quiz and reward tables', err);
    }
  }
}

export const db = new DatabaseManager();
