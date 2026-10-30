const { sql, ensureTables } = require('./db.js');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!sql) {
    return res.status(500).json({ error: 'Database connection is not configured', dbConnected: false });
  }

  try {
    await ensureTables();

    // GET: Fetch all data from Neon DB
    if (req.method === 'GET') {
      const configRows = await sql`SELECT data FROM art_config WHERE key = 'app_config'`;
      const config = configRows.length > 0 ? configRows[0].data : null;

      const studentRows = await sql`SELECT * FROM art_students ORDER BY grade_id, room_id, no ASC`;
      const studentsMap = {};
      studentRows.forEach(s => {
        const key = `${s.grade_id}_${s.room_id}`;
        if (!studentsMap[key]) studentsMap[key] = [];
        studentsMap[key].push({
          id: s.id,
          no: s.no,
          name: s.name,
          nickname: s.nickname,
          avatar: s.avatar,
          scores: typeof s.scores === 'string' ? JSON.parse(s.scores) : (s.scores || {}),
          feedback: s.feedback,
          portfolio: typeof s.portfolio === 'string' ? JSON.parse(s.portfolio) : (s.portfolio || [])
        });
      });

      const accounts = await sql`SELECT username, display_name as "displayName", password_hash as "passwordHash", role, created_at as "createdAt", is_primary as "isPrimary" FROM art_accounts`;

      return res.status(200).json({
        dbConnected: true,
        config,
        students: studentsMap,
        accounts
      });
    }

    // POST: Mutate data in Neon DB
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { action } = body;

      if (action === 'save_student') {
        const { grade, room, student } = body;
        const scoresJson = JSON.stringify(student.scores || {});
        const portfolioJson = JSON.stringify(student.portfolio || []);
        await sql`
          INSERT INTO art_students (id, grade_id, room_id, no, name, nickname, avatar, scores, feedback, portfolio, updated_at)
          VALUES (${student.id}, ${grade}, ${room}, ${student.no}, ${student.name}, ${student.nickname}, ${student.avatar}, ${scoresJson}::jsonb, ${student.feedback || ''}, ${portfolioJson}::jsonb, NOW())
          ON CONFLICT (id) DO UPDATE SET
            no = EXCLUDED.no,
            name = EXCLUDED.name,
            nickname = EXCLUDED.nickname,
            avatar = EXCLUDED.avatar,
            scores = EXCLUDED.scores,
            feedback = EXCLUDED.feedback,
            portfolio = EXCLUDED.portfolio,
            updated_at = NOW();
        `;
        return res.status(200).json({ success: true });
      }

      if (action === 'delete_student') {
        const { studentId } = body;
        await sql`DELETE FROM art_students WHERE id = ${studentId}`;
        return res.status(200).json({ success: true });
      }

      if (action === 'save_config') {
        const { config } = body;
        await sql`
          INSERT INTO art_config (key, data)
          VALUES ('app_config', ${JSON.stringify(config)}::jsonb)
          ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
        `;
        return res.status(200).json({ success: true });
      }

      if (action === 'save_account') {
        const { account } = body;
        await sql`
          INSERT INTO art_accounts (username, display_name, password_hash, role, created_at, is_primary)
          VALUES (${account.username}, ${account.displayName}, ${account.passwordHash}, ${account.role || 'ครูผู้สอน'}, ${account.createdAt}, ${account.isPrimary || false})
          ON CONFLICT (username) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role;
        `;
        return res.status(200).json({ success: true });
      }

      if (action === 'delete_account') {
        const { username } = body;
        if (username !== 'admin') {
          await sql`DELETE FROM art_accounts WHERE username = ${username}`;
        }
        return res.status(200).json({ success: true });
      }

      if (action === 'import_students') {
        const { grade, room, students, mode } = body;
        if (mode === 'replace') {
          await sql`DELETE FROM art_students WHERE grade_id = ${grade} AND room_id = ${room}`;
        }
        for (const s of students) {
          const scoresJson = JSON.stringify(s.scores || {});
          const portfolioJson = JSON.stringify(s.portfolio || []);
          await sql`
            INSERT INTO art_students (id, grade_id, room_id, no, name, nickname, avatar, scores, feedback, portfolio, updated_at)
            VALUES (${s.id}, ${grade}, ${room}, ${s.no}, ${s.name}, ${s.nickname}, ${s.avatar}, ${scoresJson}::jsonb, ${s.feedback || ''}, ${portfolioJson}::jsonb, NOW())
            ON CONFLICT (id) DO UPDATE SET
              no = EXCLUDED.no,
              name = EXCLUDED.name,
              nickname = EXCLUDED.nickname,
              avatar = EXCLUDED.avatar,
              scores = EXCLUDED.scores,
              feedback = EXCLUDED.feedback,
              portfolio = EXCLUDED.portfolio,
              updated_at = NOW();
          `;
        }
        return res.status(200).json({ success: true, count: students.length });
      }

      if (action === 'promote_students') {
        const { studentsMap } = body;
        await sql`DELETE FROM art_students`;
        if (studentsMap && typeof studentsMap === 'object') {
          for (const [classKey, students] of Object.entries(studentsMap)) {
            const parts = classKey.split('_');
            if (parts.length >= 2 && Array.isArray(students)) {
              const grade = parts[0];
              const room = parts.slice(1).join('_');
              for (const s of students) {
                const scoresJson = JSON.stringify(s.scores || {});
                await sql`
                  INSERT INTO art_students (id, grade_id, room_id, no, name, nickname, avatar, scores, feedback, updated_at)
                  VALUES (${s.id}, ${grade}, ${room}, ${s.no}, ${s.name}, ${s.nickname}, ${s.avatar}, ${scoresJson}::jsonb, ${s.feedback || ''}, NOW())
                  ON CONFLICT (id) DO UPDATE SET
                    grade_id = EXCLUDED.grade_id,
                    room_id = EXCLUDED.room_id,
                    no = EXCLUDED.no,
                    name = EXCLUDED.name,
                    nickname = EXCLUDED.nickname,
                    avatar = EXCLUDED.avatar,
                    scores = EXCLUDED.scores,
                    feedback = EXCLUDED.feedback,
                    updated_at = NOW();
                `;
              }
            }
          }
        }
        return res.status(200).json({ success: true });
      }

      if (action === 'reset_data') {
        await sql`DROP TABLE IF EXISTS art_students;`;
        await sql`DROP TABLE IF EXISTS art_config;`;
        await sql`DROP TABLE IF EXISTS art_accounts;`;
        await ensureTables();
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
};
