# Yelp Style Review Research Survey

A comprehensive web-based survey application for academic research on consumer experiences and political climate influence on review writing behavior. This application includes a full backend API for data collection and storage, designed for deployment on Render.

## 🚀 Features

### Survey Features
✅ **Complete Survey Flow** - Sequential progression with validation  
✅ **Random Assignment** - 50/50 randomization between Democratic/Republican conditions  
✅ **Form Validation** - Required fields and minimum word counts  
✅ **Real-time Word Counting** - 25-word minimum for reviews  
✅ **Conditional Logic** - Dynamic form elements based on responses  
✅ **Progress Tracking** - Visual progress bar  
✅ **Location Collection** - Mandatory geolocation capture  
✅ **Responsive Design** - Mobile-friendly interface  

### Backend Features
✅ **RESTful API** - Express.js server with MongoDB  
✅ **Data Persistence** - Automatic survey response storage  
✅ **Admin Dashboard** - Real-time statistics and data management  
✅ **CSV Export** - Data export functionality for analysis  
✅ **Security** - Rate limiting, CORS, Helmet protection  
✅ **Auto-save** - Progress saved every 30 seconds  
✅ **Error Handling** - Graceful fallbacks and error recovery  

## 📊 Survey Structure

### Shared Blocks (All Participants)
1. **Location Permission** - Mandatory geolocation collection
2. **Prolific ID** - Participant identification
3. **Consent & Warning** - Study consent with AI detection notice
4. **Political Identity** - 7-point scale from very liberal to very conservative

### Experimental Phase
5. **Task 1** - Video clip review (shared video content)
6. **Task 2** - Restaurant review with random condition assignment:
   - **Condition A (50%)**: Democratic region context
   - **Condition B (50%)**: Republican region context
   - **Follow-up Question**: Comfort level in opposite political climate

### Final Section
7. **Demographics** - Age, gender, education level, and ZIP code
8. **Completion** - HP369 completion code for Prolific

## 🛠 Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Render (cloud platform)
- **Security**: Helmet, CORS, Rate Limiting
- **Data Format**: JSON with CSV export capability

## 📱 API Endpoints

### Public Endpoints
- `GET /` - Serve survey application
- `POST /api/survey/save` - Save survey response
- `GET /api/health` - Health check

### Admin Endpoints
- `GET /api/admin/responses` - Get all responses (paginated)
- `GET /api/admin/export` - Export data as CSV
- `GET /admin` - Admin dashboard interface

## 🚀 Deployment Instructions

### Prerequisites
1. **MongoDB Database** (MongoDB Atlas recommended)
2. **Render Account** (free tier available)
3. **Node.js 14+** for local development

### Step 1: Database Setup
1. Create a MongoDB Atlas account at https://cloud.mongodb.com
2. Create a new cluster (free tier M0)
3. Create database user with read/write permissions
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/yelp-survey`

### Step 2: Render Deployment
1. Push code to GitHub repository
2. Connect Render to your GitHub account
3. Create new Web Service on Render
4. Configure settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Auto-Deploy**: Yes

### Step 3: Environment Variables
Set these in Render dashboard:
```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

### Step 4: Domain Configuration
- Render provides a free domain: `https://your-app-name.onrender.com`
- Optional: Configure custom domain in Render settings

## 💻 Local Development

### Setup
```bash
# Clone repository
git clone <your-repo-url>
cd yelp-style-review-survey

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your MongoDB URI
# Start development server
npm run dev
```

### Available Scripts
- `npm start` - Production server
- `npm run dev` - Development with nodemon
- `npm test` - Run tests (when implemented)

## 📊 Data Collection

### Survey Response Schema
```javascript
{
  participant_id: "auto-generated",
  prolific_id: "user-provided",
  start_time: "ISO timestamp",
  end_time: "ISO timestamp", 
  condition: "A or B",
  location: {
    latitude: "number",
    longitude: "number", 
    timestamp: "ISO timestamp"
  },
  responses: {
    consent: "yes/no",
    political_views: "1-7",
    video_review: "text",
    video_review_word_count: "number",
    condition_review: "text",
    condition_review_word_count: "number",
    followup_comfort: "1-7",
    age: "number",
    gender: "selection",
    education: "selection",
    zip_code: "string"
  }
}
```

## 🔐 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet Security**: Security headers and XSS protection
- **Input Validation**: Server-side data validation
- **Error Handling**: Secure error messages without data leakage

## 📈 Admin Dashboard

Access at `/admin` for:
- **Real-time Statistics**: Response counts by condition
- **Data Filtering**: By date range and condition
- **CSV Export**: Full data download
- **Response Monitoring**: Live participant tracking

## 🎯 Research Applications

This survey is designed for academic research on:
- **Political Psychology**: How political context affects consumer expression
- **Social Influence**: Impact of perceived audience on review content
- **Consumer Behavior**: Restaurant review patterns across political contexts
- **Communication Studies**: Self-censorship in online reviews

## 📞 Support

For technical issues:
1. Check Render deployment logs
2. Verify MongoDB connection
3. Review browser console for frontend errors
4. Test API endpoints with `/api/health`

## 📄 License

This project is for academic research purposes.

---

**🎉 Ready for Research!** Your survey is now professionally deployed with full data collection capabilities, just like your investment game setup!