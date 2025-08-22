# Case Studies CMS (Blogs)

A JSON-based Content Management System for case studies and blog posts with role-based access control, built with vanilla JavaScript, Node.js, and Express.

## Features

- **Role-based Access Control**: Admin and Author roles with different permissions
- **Content Management**: Create, edit, approve, and publish case studies and blog posts
- **Template System**: Default template with rich text editor or custom HTML/CSS/JS
- **Public Site**: Responsive case studies listing with filters and individual post pages
- **JSON Storage**: File-based storage system using JSON files
- **Security**: JWT authentication, password hashing, input validation, and HTML sanitization
- **SEO Optimized**: Meta tags, structured data, and semantic HTML

## Tech Stack

- **Frontend**: Pure HTML, CSS, and vanilla JavaScript
- **Backend**: Node.js + Express
- **Storage**: JSON files with custom file I/O
- **Authentication**: JWT with HttpOnly cookies + bcryptjs
- **Security**: Input validation, HTML sanitization (DOMPurify), CORS protection
- **Performance**: Lazy loading, responsive images, code splitting

## Project Structure

```
omega/
├── public/                 # Static frontend files
│   ├── index.html         # Case studies listing page
│   ├── post.html          # Individual post page
│   ├── admin/             # Admin dashboard
│   │   ├── index.html     # Admin dashboard UI
│   │   ├── css/           # Admin-specific styles
│   │   └── js/            # Admin dashboard logic
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   └── assets/            # Images and other assets
├── server/                # Backend API
│   ├── app.js            # Express application
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── scripts/          # Setup and maintenance scripts
├── data/                 # JSON storage
│   ├── authors.json      # User accounts
│   ├── posts.json        # Blog posts/case studies
│   ├── settings.json     # Site settings
│   └── inbox.json        # Contact form submissions
└── package.json
```

## Local Development Setup

### Prerequisites

- Node.js 16+ installed
- Git (optional, for version control)

### Installation & Setup

1. **Navigate to the omega directory**:
   ```bash
   cd omega
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment variables**:
   Create a `.env` file in the omega directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   COOKIE_NAME=cms_auth
   SITE_URL=http://localhost:3000
   PORT=3000
   NODE_ENV=development
   ```

4. **Initialize sample data**:
   ```bash
   npm run init-data
   ```

5. **Start the development server**:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - **Public Site**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/admin
   - **Default Admin Login**: `admin` / `admin123`
   - **Default Author Login**: `sarah_johnson` / `author123`

### Testing the System

1. **Test Public Site**:
   - Visit http://localhost:3000
   - Browse case studies with filters
   - Click on individual posts
   - Test contact forms

2. **Test Admin Dashboard**:
   - Login at http://localhost:3000/admin
   - Create, edit, and manage posts
   - Manage authors (admin only)
   - Test approval workflow

3. **Test Author Workflow**:
   - Login as author (`sarah_johnson` / `author123`)
   - Create a new post
   - Submit for approval
   - Login as admin to approve/reject

## Production Deployment

### Option 1: Render + Supabase (Recommended)

This setup uses Render for hosting the Node.js server and Supabase for database and file storage.

#### Step 1: Prepare for Supabase

1. **Create Supabase Project**:
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and anon key

2. **Set up Supabase Storage**:
   ```sql
   -- Create storage bucket for images
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('cms-images', 'cms-images', true);
   
   -- Create storage policy
   CREATE POLICY "Public Access" ON storage.objects 
   FOR SELECT USING (bucket_id = 'cms-images');
   
   CREATE POLICY "Authenticated Upload" ON storage.objects 
   FOR INSERT WITH CHECK (bucket_id = 'cms-images' AND auth.role() = 'authenticated');
   ```

3. **Create Database Tables**:
   ```sql
   -- Authors table
   CREATE TABLE authors (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     username TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     full_name TEXT NOT NULL,
     designation TEXT,
     bio TEXT,
     avatar_url TEXT,
     role TEXT NOT NULL CHECK (role IN ('admin', 'author')),
     social JSONB DEFAULT '{}',
     active BOOLEAN DEFAULT true,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Posts table
   CREATE TABLE posts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     slug TEXT UNIQUE NOT NULL,
     excerpt TEXT NOT NULL,
     banner JSONB NOT NULL,
     content_type TEXT NOT NULL,
     service_category TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
     author_id UUID REFERENCES authors(id),
     published_at TIMESTAMPTZ,
     views INTEGER DEFAULT 0,
     template JSONB NOT NULL,
     tags TEXT[] DEFAULT '{}',
     related_ids UUID[] DEFAULT '{}',
     seo JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Inbox table
   CREATE TABLE inbox (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     message TEXT NOT NULL,
     read BOOLEAN DEFAULT false,
     submitted_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Settings table
   CREATE TABLE settings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     key TEXT UNIQUE NOT NULL,
     value JSONB NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

4. **Update Server Code for Supabase**:
   Replace JSON file operations with Supabase client calls:
   ```javascript
   // Install Supabase client
   npm install @supabase/supabase-js
   
   // Update dataStore.js to use Supabase
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
   ```

#### Step 2: Deploy to Render

1. **Prepare Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Render**:
   - Connect your GitHub repository
   - Set build command: `cd omega && npm install`
   - Set start command: `cd omega && npm start`
   - Add environment variables:
     ```
     JWT_SECRET=your-production-secret-key
     COOKIE_NAME=cms_auth
     SITE_URL=https://your-app.onrender.com
     PORT=3000
     NODE_ENV=production
     SUPABASE_URL=your-supabase-url
     SUPABASE_SERVICE_KEY=your-supabase-service-key
     ```

3. **Configure Domain**:
   - Add custom domain in Render dashboard
   - Update SITE_URL environment variable

#### Step 3: Image Upload Integration

Update the admin dashboard to upload images to Supabase Storage:

```javascript
// Add to admin.js
async uploadImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('cms-images')
    .upload(fileName, file);
    
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('cms-images')
    .getPublicUrl(fileName);
    
  return publicUrl;
}
```

### Option 2: Traditional Hosting (Hostinger/cPanel)

#### Step 1: Prepare for Traditional Hosting

1. **Database Setup**:
   - Create MySQL database in cPanel
   - Install MySQL adapter: `npm install mysql2`
   - Update dataStore.js to use MySQL instead of JSON files

2. **Update Server Code**:
   ```javascript
   // Replace JSON operations with MySQL queries
   const mysql = require('mysql2/promise');
   
   const connection = mysql.createConnection({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME
   });
   ```

#### Step 2: File Upload Handling

1. **Local File Upload**:
   ```javascript
   // Add multer for file uploads
   npm install multer
   
   // Configure multer in app.js
   const multer = require('multer');
   const upload = multer({ dest: 'public/assets/uploads/' });
   
   // Add upload endpoint
   app.post('/api/upload', upload.single('image'), (req, res) => {
     const imageUrl = `/assets/uploads/${req.file.filename}`;
     res.json({ url: imageUrl });
   });
   ```

2. **Update Admin Dashboard**:
   Add file upload functionality to the admin interface:
   ```html
   <input type="file" accept="image/*" onchange="uploadImage(this)">
   ```

#### Step 3: Deploy to Hostinger

1. **Build for Production**:
   ```bash
   # Install production dependencies only
   npm ci --production
   
   # Create deployment package
   zip -r cms-deployment.zip . -x "node_modules/*" "*.git*"
   ```

2. **Upload Files**:
   - Upload via cPanel File Manager or FTP
   - Extract in public_html directory
   - Install Node.js dependencies via terminal

3. **Configure Environment**:
   ```bash
   # In cPanel terminal
   cd public_html/omega
   npm install --production
   
   # Create .env file
   cat > .env << EOF
   JWT_SECRET=your-production-secret-key
   COOKIE_NAME=cms_auth
   SITE_URL=https://yourdomain.com
   PORT=3000
   NODE_ENV=production
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   EOF
   ```

4. **Start Application**:
   ```bash
   # Use PM2 for process management
   npm install -g pm2
   pm2 start server/app.js --name "cms"
   pm2 startup
   pm2 save
   ```

5. **Configure Web Server**:
   Add to .htaccess in public_html:
   ```apache
   RewriteEngine On
   RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
   RewriteRule ^admin$ /admin/ [R=301,L]
   RewriteRule ^post/(.+)$ /post.html [L]
   ```

## Data Storage

### JSON File Structure (Local Development)

The system uses JSON files for data persistence:

- **`/data/authors.json`**: User accounts with roles and permissions
- **`/data/posts.json`**: Blog posts and case studies
- **`/data/settings.json`**: Site configuration and popular posts
- **`/data/inbox.json`**: Contact form submissions

### Database Schema (Production)

When using a database, the JSON structure maps to these tables:

- **authors**: User accounts and profiles
- **posts**: Content with template data stored as JSON
- **inbox**: Contact form submissions
- **settings**: Key-value configuration storage

### Backup Strategy

- **Local**: Automatic backups created before write operations in `/data/backups/`
- **Production**: Database backups via hosting provider + file storage backups
- **Manual backup**: `npm run backup`

### Concurrency Notes

- File operations use atomic writes with temporary files
- Read operations are cached for performance
- Write operations are queued to prevent conflicts
- Database operations use transactions for consistency

## User Roles & Permissions

### Admin Role
- ✅ Create, edit, delete any post
- ✅ Approve/reject posts
- ✅ Manage authors (create, edit, delete)
- ✅ Access all dashboard features
- ✅ Edit approved posts
- ✅ View contact submissions
- ✅ Configure site settings
- ✅ Manage popular posts

### Author Role
- ✅ Create new posts
- ✅ Edit own posts (draft/pending only)
- ✅ Submit posts for approval
- ✅ View own post analytics
- ❌ Cannot edit approved posts
- ❌ Cannot manage other authors
- ❌ Cannot approve/reject posts
- ❌ Cannot access site settings

### Public (No Login)
- ✅ View approved posts
- ✅ Filter and search content
- ✅ Submit contact forms
- ❌ Cannot access dashboard

## Author Workflow

1. **Draft**: Author creates and saves post as draft
2. **Submit**: Author submits draft for approval
3. **Pending**: Post awaits admin review
4. **Approved**: Admin approves post (becomes public)
5. **Rejected**: Admin rejects post (author can revise)

Once approved, only admins can edit or delete posts.

## Content Types & Service Categories

### Content Types
- Blog Posts
- Case Studies
- User Interview
- Quantitative Research
- Competitors Research

### Service Categories
- Meta & Google Ads
- First Party Data
- CRO
- High Performing Creatives
- Retention Marketing
- Other

To add new types/categories, edit `/data/settings.json` and update the frontend forms.

## Editor Modes

### Default Template
- Rich text editor with formatting options
- Structured fields: title, excerpt, banner, content, pull-quotes
- Automatic layout and styling
- SEO fields and meta data

### Custom Template
- Full HTML/CSS/JS control
- Code editors with syntax highlighting
- HTML sanitization for security
- Custom styling and interactions

### Sanitization & Limits
- HTML is sanitized using DOMPurify
- JavaScript is executed in isolated scope
- External requests are blocked by default
- File size limits: HTML (100KB), CSS (50KB), JS (25KB)

## Filtering & Pagination

### How "Load More" Works
1. Initial load: 6 posts with pattern (3 cards → CTA → 3 cards)
2. "Load More": Fetches next 6 posts, appends with same pattern
3. Filters: Single-select per group, resets pagination
4. Search: Combines with filters, searches title/excerpt/content

### API Parameters
- `offset`: Starting position (default: 0)
- `limit`: Number of posts (default: 6)
- `contentType[]`: Filter by content type
- `serviceCategory[]`: Filter by service category
- `q`: Search query

## SEO & Image Optimization

### SEO Features
- Unique page titles and meta descriptions
- Canonical URLs
- Open Graph and Twitter Card meta tags
- JSON-LD structured data for articles
- Semantic HTML structure

### Image Optimization
- Responsive images with srcset
- Lazy loading below the fold
- WebP/AVIF format support
- Alt text requirements
- Aspect ratio preservation

## Security Features

### Authentication
- JWT tokens in HttpOnly cookies
- Password hashing with bcryptjs (12 rounds)
- Session timeout and refresh
- CSRF protection

### Input Validation
- Server-side validation for all inputs
- HTML sanitization for custom content
- Rate limiting on auth endpoints
- CORS restricted to site origin

### Content Security
- DOMPurify for HTML sanitization
- JavaScript execution in isolated scope
- File upload restrictions
- SQL injection prevention (when using database)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Authors (Admin Only)
- `GET /api/authors` - List authors
- `POST /api/authors` - Create author
- `PUT /api/authors/:id` - Update author
- `DELETE /api/authors/:id` - Delete author

### Posts
- `GET /api/posts` - List posts (with filters)
- `GET /api/posts/:slug` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post (admin only)
- `POST /api/posts/:id/submit` - Submit for approval
- `POST /api/posts/:id/approve` - Approve post (admin only)
- `POST /api/posts/:id/reject` - Reject post (admin only)
- `POST /api/posts/:id/view` - Increment view count

### Contact
- `POST /api/contact` - Submit contact form

## Image Upload & Management

### Local Development
Images are stored in `/public/assets/uploads/` directory:

```javascript
// Add to server/app.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'public/assets/uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const imageUrl = `/assets/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});
```

### Production with Supabase Storage

```javascript
// Update server/utils/storage.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function uploadImage(file, folder = 'posts') {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('cms-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
    
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('cms-images')
    .getPublicUrl(fileName);
    
  return publicUrl;
}

module.exports = { uploadImage };
```

### Production with Traditional Hosting

For traditional hosting, images are stored in the server filesystem:

```javascript
// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = 'public/assets/uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for production
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
```

## Environment Variables

### Development (.env)
```env
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
COOKIE_NAME=cms_auth
SITE_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

### Production with Supabase
```env
JWT_SECRET=your-production-secret-key
COOKIE_NAME=cms_auth
SITE_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Production with Traditional Hosting
```env
JWT_SECRET=your-production-secret-key
COOKIE_NAME=cms_auth
SITE_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
```

## Creating the First Admin

### Using the Script
```bash
npm run create-admin
```

### Manual Creation
Add to `/data/authors.json`:
```json
{
  "id": "admin-uuid",
  "username": "admin",
  "passwordHash": "$2b$12$...",
  "fullName": "Site Administrator",
  "designation": "Chief Technology Officer",
  "role": "admin",
  "active": true,
  "createdAt": "2025-01-XX",
  "updatedAt": "2025-01-XX"
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] Update environment variables for production
- [ ] Test all functionality locally
- [ ] Run security audit: `npm audit`
- [ ] Optimize images and assets
- [ ] Test with production data volume

### Render + Supabase Deployment
- [ ] Create Supabase project and configure storage
- [ ] Set up database tables and policies
- [ ] Deploy to Render with environment variables
- [ ] Test image upload functionality
- [ ] Configure custom domain
- [ ] Set up monitoring and alerts

### Traditional Hosting Deployment
- [ ] Set up MySQL database
- [ ] Configure file upload directory
- [ ] Upload files via FTP/cPanel
- [ ] Install Node.js dependencies
- [ ] Configure process manager (PM2)
- [ ] Set up reverse proxy (Apache/Nginx)
- [ ] Configure SSL certificate

## Monitoring & Maintenance

### Health Checks
- Monitor `/api/health` endpoint
- Check disk space for uploads
- Monitor database performance
- Track error rates and response times

### Regular Maintenance
- Backup data regularly
- Update dependencies monthly
- Monitor security vulnerabilities
- Clean up old uploaded files
- Review and rotate JWT secrets

### Performance Optimization
- Enable gzip compression
- Implement CDN for static assets
- Optimize database queries
- Cache frequently accessed data
- Monitor and optimize Core Web Vitals

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Permission errors**:
   ```bash
   # Fix file permissions
   chmod -R 755 public/
   chmod -R 644 data/
   ```

3. **Login issues**:
   - Verify JWT_SECRET is set correctly
   - Check cookie settings in browser
   - Ensure HTTPS in production

4. **Missing posts**:
   - Check post status (only approved posts are public)
   - Verify author permissions
   - Check database/file integrity

### Debug Mode
Set `NODE_ENV=development` and check server logs:
```bash
# View logs
tail -f logs/app.log

# Debug specific issues
DEBUG=* npm start
```

### Database Issues
```bash
# Check database connection
node -e "require('./server/utils/dataStore').testConnection()"

# Repair corrupted JSON files
npm run repair-data

# Reset to default data
npm run init-data
```

## Known Limitations & Future Improvements

### Current Limitations
- JSON file storage (not suitable for high-traffic sites)
- No real-time collaboration
- Limited media management
- No automated backups
- Single server instance only

### Future Improvements
- Database migration path (SQLite → PostgreSQL)
- Real-time editing with WebSockets
- Advanced media management with CDN
- Multi-language support
- Comment system
- Analytics integration
- Email notifications
- Automated testing suite
- Docker containerization
- Kubernetes deployment

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify data file integrity
4. Check browser console for frontend errors
5. Test API endpoints with curl/Postman

### Getting Help
- Create GitHub issues for bugs
- Check documentation for common solutions
- Review error logs for specific issues
- Test with minimal reproduction case

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**License**: MIT