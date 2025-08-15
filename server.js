// 📁 File: server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Use Render's persistent disk mount point if available, otherwise fallback to local
const dataDir = process.env.RENDER_DISK_PATH 
  ? path.join(process.env.RENDER_DISK_PATH, 'survey_data')
  : path.join(__dirname, 'survey_data');

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const logFile = path.join(dataDir, 'survey_submissions_log.txt');
console.log(`Survey data directory: ${dataDir}`);

function logSubmission(msg) {
  const timestamp = new Date().toISOString();
  const log = `[${timestamp}] ${msg}\n`;
  console.log(log);
  fs.appendFileSync(logFile, log);
}

// Save survey response
app.post('/api/survey/save', async (req, res) => {
  try {
    const surveyData = req.body;
    
    // Enhanced logging
    console.log('🔄 Survey save request received');
    console.log('📊 Request body keys:', Object.keys(surveyData));
    console.log('🆔 Participant ID:', surveyData.participant_id);
    console.log('🎯 Prolific ID (direct):', surveyData.prolific_id);
    console.log('🎯 Prolific ID (responses):', surveyData.responses?.prolific_id);
    console.log('📍 Current responses:', Object.keys(surveyData.responses || {}));
    console.log('🎲 Condition:', surveyData.condition);
    console.log('📡 IP:', req.ip || req.connection.remoteAddress);
    
    // Check for Prolific ID in both locations and normalize
    const prolificId = surveyData.prolific_id || surveyData.responses?.prolific_id;
    
    if (!surveyData.participant_id) {
      console.log('❌ Missing participant ID');
      throw new Error('No participant ID provided');
    }
    if (!prolificId) {
      console.log('❌ Missing Prolific ID in both locations');
      console.log('📊 Available response fields:', Object.keys(surveyData.responses || {}));
      throw new Error('No Prolific ID provided');
    }
    
    // Normalize the Prolific ID to the top level for consistency
    surveyData.prolific_id = prolificId;
    console.log('✅ Using Prolific ID:', prolificId);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `survey_${surveyData.participant_id}_${timestamp}.json`;
    const filepath = path.join(dataDir, filename);

    // Add server metadata
    surveyData.server_timestamp = new Date().toISOString();
    surveyData.ip_address = req.ip || req.connection.remoteAddress;
    surveyData.user_agent = req.get('User-Agent');

    console.log('💾 Saving to file:', filename);
    console.log('📁 Full path:', filepath);

    // Save to persistent disk
    fs.writeFileSync(filepath, JSON.stringify(surveyData, null, 2));
    logSubmission(`SUCCESS: Survey data saved for participant ${surveyData.participant_id} (Prolific: ${prolificId}) to ${filename}`);

    console.log('✅ File saved successfully');

    res.json({ 
      success: true, 
      message: 'Survey response saved successfully', 
      participant_id: surveyData.participant_id,
      filename,
      path: dataDir
    });
  } catch (err) {
    console.error('💥 Survey save error:', err.message);
    console.error('📊 Stack trace:', err.stack);
    logSubmission(`ERROR: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get list of all saved participant data (matching investment game structure)
app.get('/api/list-data', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir)
      .filter(f => f.startsWith('survey_') && f.endsWith('.json'))
      .map(f => {
        const filepath = path.join(dataDir, f);
        const stats = fs.statSync(filepath);
        
        // Try to read basic info from file
        let participantInfo = {};
        try {
          const content = fs.readFileSync(filepath, 'utf8');
          const data = JSON.parse(content);
          participantInfo = {
            participant_id: data.participant_id,
            prolific_id: data.prolific_id,
            condition: data.condition,
            political_views: data.responses?.political_views,
            age: data.responses?.age,
            gender: data.responses?.gender,
            education: data.responses?.education,
            zip_code: data.responses?.zip_code,
            created_at: data.start_time || stats.birthtime
          };
        } catch (parseErr) {
          console.error(`Error parsing ${f}:`, parseErr);
        }
        
        return {
          filename: f,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          ...participantInfo
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({ 
      success: true, 
      count: files.length,
      dataDir: dataDir,
      files: files 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keep legacy endpoint for backward compatibility
app.get('/api/admin/responses', (req, res) => {
  // Redirect to the new endpoint
  req.url = '/api/list-data';
  app._router.handle(req, res);
});

// Download specific survey response file
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(dataDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    res.download(filepath);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get submission logs
app.get('/api/logs', (req, res) => {
  try {
    if (!fs.existsSync(logFile)) {
      return res.json({ success: true, logs: 'No survey logs yet' });
    }
    
    const logs = fs.readFileSync(logFile, 'utf8');
    res.type('text/plain').send(logs);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export all survey data as CSV
app.get('/api/admin/export', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('survey_') && f.endsWith('.json'));
    const csvData = [];
    
    files.forEach(filename => {
      try {
        const filepath = path.join(dataDir, filename);
        const content = fs.readFileSync(filepath, 'utf8');
        const data = JSON.parse(content);
        
        // Flatten data for CSV
        csvData.push({
          participant_id: data.participant_id,
          prolific_id: data.prolific_id,
          condition: data.condition,
          start_time: data.start_time,
          end_time: data.end_time,
          latitude: data.location?.latitude,
          longitude: data.location?.longitude,
          consent: data.responses?.consent,
          political_views: data.responses?.political_views,
          video_review_word_count: data.responses?.video_review_word_count,
          condition_review_word_count: data.responses?.condition_review_word_count,
          followup_comfort: data.responses?.followup_comfort,
          age: data.responses?.age,
          gender: data.responses?.gender,
          education: data.responses?.education,
          zip_code: data.responses?.zip_code,
          server_timestamp: data.server_timestamp
        });
      } catch (err) {
        console.error(`Error reading ${filename}:`, err);
      }
    });
    
    // Simple CSV conversion
    if (csvData.length === 0) {
      return res.status(404).json({ success: false, error: 'No survey data found' });
    }
    
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey_responses_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export all participant data as a single JSON file (matching investment game structure)
app.get('/api/export-all', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('survey_') && f.endsWith('.json'));
    const allData = [];
    
    files.forEach(filename => {
      try {
        const filepath = path.join(dataDir, filename);
        const content = fs.readFileSync(filepath, 'utf8');
        const data = JSON.parse(content);
        allData.push({
          filename,
          data
        });
      } catch (err) {
        console.error(`Error reading ${filename}:`, err);
      }
    });
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalParticipants: allData.length,
      dataDirectory: dataDir,
      participants: allData
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="all_participants_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get statistics about collected survey data
app.get('/api/stats', (req, res) => {
  try {
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('survey_') && f.endsWith('.json'));
    const stats = {
      totalResponses: files.length,
      responsesByDate: {},
      conditionCounts: { A: 0, B: 0 },
      dataDirectory: dataDir,
      diskSpace: {
        used: 0,
        isPersistent: !!process.env.RENDER_DISK_PATH
      }
    };
    
    files.forEach(filename => {
      const filepath = path.join(dataDir, filename);
      const fileStats = fs.statSync(filepath);
      stats.diskSpace.used += fileStats.size;
      
      // Group by date
      const date = fileStats.birthtime.toISOString().split('T')[0];
      stats.responsesByDate[date] = (stats.responsesByDate[date] || 0) + 1;
      
      // Count conditions
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        const data = JSON.parse(content);
        if (data.condition === 'A') stats.conditionCounts.A++;
        if (data.condition === 'B') stats.conditionCounts.B++;
      } catch (err) {
        // Skip invalid files
      }
    });
    
    // Convert bytes to MB
    stats.diskSpace.usedMB = (stats.diskSpace.used / (1024 * 1024)).toFixed(2);
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Survey server is running',
    dataDir: dataDir,
    persistentDisk: !!process.env.RENDER_DISK_PATH,
    timestamp: new Date().toISOString()
  });
});

// Check YouTube video embedding status
app.get('/api/check-video', (req, res) => {
  res.json({
    videoType: 'YouTube',
    videoId: 'TpDG2LS1YpQ',
    embedUrl: 'https://www.youtube.com/embed/TpDG2LS1YpQ',
    publicUrl: 'https://youtu.be/TpDG2LS1YpQ',
    status: 'Using YouTube hosting - no local video file needed',
    benefits: [
      'No GitHub file size limits',
      'Better streaming performance',
      'Universal compatibility',
      'Professional video hosting'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Survey server running on port ${PORT}`);
  console.log(`Survey data directory: ${dataDir}`);
  console.log(`Persistent disk: ${!!process.env.RENDER_DISK_PATH}`);
  logSubmission(`Survey server started successfully - Data dir: ${dataDir}`);
});