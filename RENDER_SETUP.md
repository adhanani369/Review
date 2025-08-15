# Render Persistent Disk Setup for Yelp Survey

## Important: Manual Configuration Required

The persistent disk must be configured through the Render dashboard. The `render.yaml` file alone is not sufficient.

## Steps to Enable Persistent Disk:

1. **In Render Dashboard:**
   - Go to your service settings
   - Navigate to the "Disks" section
   - Click "Add Disk"
   - Configure:
     - **Name:** survey-data
     - **Mount Path:** /opt/render/project/persistent-data
     - **Size:** 1 GB (or more if needed)
   - Click "Save"

2. **Add Environment Variable:**
   - In the "Environment" section
   - Add:
     - **Key:** RENDER_DISK_PATH
     - **Value:** /opt/render/project/persistent-data

3. **Deploy:**
   - Commit and push the updated code
   - Render will redeploy with persistent disk attached

## Verify Persistent Disk:

After deployment, check the logs for:
```
Persistent disk: true
Survey data directory: /opt/render/project/persistent-data/survey_data
```

## API Endpoints for Survey Data Management:

- `GET /api/health` - Check if persistent disk is active
- `POST /api/survey/save` - Save survey responses
- `GET /api/admin/responses` - List all survey responses
- `GET /api/download/:filename` - Download specific file
- `GET /api/export-all` - Export all data as single JSON
- `GET /api/admin/export` - Export all data as CSV
- `GET /api/stats` - View survey statistics
- `GET /api/logs` - View submission logs

## Survey Access Points:

- **Main Survey:** `/` (public/index.html)
- **Admin Dashboard:** `/admin.html`
- **Health Check:** `/api/health`

## Important Notes:

- Without persistent disk configuration, data will be lost on each deployment
- The free tier does NOT include persistent disks
- Ensure you have a paid Render subscription that includes disk storage
- Data saved to local directory is ephemeral without persistent disk
- Survey responses include participant tracking, location data, and condition assignments
