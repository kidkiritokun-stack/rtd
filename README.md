# Case Studies CMS (Blogs)

A Supabase-powered Content Management System for case studies and blog posts with role-based access control, built with vanilla JavaScript, Node.js, and Express.

## Features

- **Role-based Access Control**: Admin and Author roles with different permissions
- **Content Management**: Create, edit, approve, and publish case studies and blog posts
- **Template System**: Default template with rich text editor or custom HTML/CSS/JS
- **Public Site**: Responsive case studies listing with filters and individual post pages
- **Supabase Integration**: PostgreSQL database with file storage for images
- **Security**: JWT authentication, password hashing, input validation, and HTML sanitization
- **SEO Optimized**: Meta tags, structured data, and semantic HTML

## Tech Stack

- **Frontend**: Pure HTML, CSS, and vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for images
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
└── package.json
```

## Local Development Setup

### Prerequisites

- Node.js 16+ installed
- Supabase account and project
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

3. **Set up Supabase**:
   
   Create a new Supabase project at https://supabase.com and run this SQL in the SQL Editor:

   ```sql
   -- Create authors table
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

   -- Create posts table
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
     rejection_reason TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create contact_submissions table
   CREATE TABLE contact_submissions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     phone VARCHAR(50),
     email VARCHAR(255) NOT NULL,
     company VARCHAR(255),
     message TEXT,
     subject VARCHAR(255),
     submission_type VARCHAR(50) NOT NULL DEFAULT 'contact_form',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create newsletter_subscriptions table
   CREATE TABLE newsletter_subscriptions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255),
     is_active BOOLEAN DEFAULT true,
     subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     unsubscribed_at TIMESTAMP WITH TIME ZONE
   );

   -- Create storage bucket for images
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('cms-images', 'cms-images', true);

   -- Indexes
   CREATE INDEX idx_posts_status ON posts(status);
   CREATE INDEX idx_posts_author_id ON posts(author_id);
   CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
   CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
   CREATE INDEX idx_contact_submissions_type ON contact_submissions(submission_type);
   CREATE INDEX idx_newsletter_email ON newsletter_subscriptions(email);

   -- Enable RLS
   ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
   ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

   -- RLS Policies
   CREATE POLICY "Allow public read on approved posts" 
   ON posts FOR SELECT 
   TO anon 
   USING (status = 'approved');

   CREATE POLICY "Allow authenticated read on posts" 
   ON posts FOR SELECT 
   TO authenticated 
   USING (true);

   CREATE POLICY "Allow authenticated insert on posts" 
   ON posts FOR INSERT 
   TO authenticated 
   WITH CHECK (true);

   CREATE POLICY "Allow authenticated update on posts" 
   ON posts FOR UPDATE 
   TO authenticated 
   USING (true);

   CREATE POLICY "Allow authenticated delete on posts" 
   ON posts FOR DELETE 
   TO authenticated 
   USING (true);

   CREATE POLICY "Allow authenticated read on authors" 
   ON authors FOR SELECT 
   TO authenticated 
   USING (true);

   CREATE POLICY "Allow authenticated insert on authors" 
   ON authors FOR INSERT 
   TO authenticated 
   WITH CHECK (true);

   CREATE POLICY "Allow authenticated update on authors" 
   ON authors FOR UPDATE 
   TO authenticated 
   USING (true);

   CREATE POLICY "Allow authenticated delete on authors" 
   ON authors FOR DELETE 
   TO authenticated 
   USING (true);

   CREATE POLICY "Allow public inserts on contact_submissions" 
   ON contact_submissions FOR INSERT 
   TO anon 
   WITH CHECK (true);

   CREATE POLICY "Allow public inserts on newsletter_subscriptions" 
   ON newsletter_subscriptions FOR INSERT 
   TO anon 
   WITH CHECK (true);

   CREATE POLICY "Allow authenticated read on contact_submissions" 
   ON contact_submissions FOR SELECT 
   TO authenticated 
   USING (true);

   CREATE POLICY "Allow authenticated read on newsletter_subscriptions" 
   ON newsletter_subscriptions FOR SELECT 
   TO authenticated 
   USING (true);

   -- Storage policies
   CREATE POLICY "Public Access" ON storage.objects 
   FOR SELECT USING (bucket_id = 'cms-images');
   
   CREATE POLICY "Authenticated Upload" ON storage.objects 
   FOR INSERT WITH CHECK (bucket_id = 'cms-images' AND auth.role() = 'authenticated');
   ```

4. **Create environment variables**:
   Create a `.env` file in the omega directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   COOKIE_NAME=cms_auth
   SITE_URL=http://localhost:3000
   PORT=3000
   NODE_ENV=development
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Create the first admin user**:
   ```bash
   npm run create-admin
   ```

6. **Start the development server**:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

7. **Access the application**:
   - **Public Site**: http://localhost:3000
   - **Admin Dashboard**: http://localhost:3000/admin
   - **Login with your created admin credentials**

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
   - Create an author account via admin dashboard
   - Login as author
   - Create a new post
   - Submit for approval
   - Login as admin to approve/reject

## Production Deployment

### Option 1: Render + Supabase (Recommended)

This setup uses Render for hosting the Node.js server and Supabase for database and file storage.

#### Step 1: Prepare Supabase for Production

1. **Your Supabase project should already be set up** with the tables from local development.

2. **Configure Storage Bucket**:
   - Go to Storage in your Supabase dashboard
   - The `cms-images` bucket should already exist
   - Ensure it's set to public
   - Verify the storage policies are in place

3. **Get your production keys**:
   - Go to Settings > API in your Supabase dashboard
   - Copy your Project URL
   - Copy your `anon` key and `service_role` key

#### Step 2: Deploy to Render

1. **Prepare Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Render**:
   - Go to https://render.com and create an account
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: your-cms-name
     - **Environment**: Node
     - **Region**: Choose closest to your users
     - **Branch**: main
     - **Root Directory**: omega
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Add Environment Variables** in Render dashboard:
   ```
   JWT_SECRET=your-production-secret-key-make-it-different-from-local
   COOKIE_NAME=cms_auth
   SITE_URL=https://your-app.onrender.com
   PORT=3000
   NODE_ENV=production
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_SERVICE_KEY=your-supabase-service-role-key
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Deploy and Test**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Test your live site
   - Create your first admin user: SSH into Render and run `npm run create-admin`

#### Step 3: Configure Custom Domain (Optional)

1. **Add Custom Domain** in Render dashboard
2. **Update Environment Variables**:
   - Change `SITE_URL` to your custom domain
   - Update CORS settings if needed

### Option 2: Traditional Hosting (Hostinger/cPanel)

This setup uses traditional hosting with MySQL database and local file storage.

#### Step 1: Prepare for Traditional Hosting

1. **Set up MySQL Database**:
   - Create a MySQL database in cPanel
   - Note the database name, username, and password
   - Install MySQL adapter:
     ```bash
     npm install mysql2
     ```

2. **Update Database Configuration**:
   Create `server/utils/mysqlStore.js`:
   ```javascript
   const mysql = require('mysql2/promise');

   const connection = mysql.createConnection({
     host: process.env.DB_HOST || 'localhost',
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME
   });

   // Create tables
   const initializeDatabase = async () => {
     await connection.execute(`
       CREATE TABLE IF NOT EXISTS authors (
         id VARCHAR(36) PRIMARY KEY,
         username VARCHAR(50) UNIQUE NOT NULL,
         password_hash TEXT NOT NULL,
         full_name VARCHAR(255) NOT NULL,
         designation VARCHAR(255),
         bio TEXT,
         avatar_url TEXT,
         role ENUM('admin', 'author') NOT NULL,
         social JSON,
         active BOOLEAN DEFAULT true,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       )
     `);

     await connection.execute(`
       CREATE TABLE IF NOT EXISTS posts (
         id VARCHAR(36) PRIMARY KEY,
         title VARCHAR(255) NOT NULL,
         slug VARCHAR(255) UNIQUE NOT NULL,
         excerpt TEXT NOT NULL,
         banner JSON NOT NULL,
         content_type VARCHAR(100) NOT NULL,
         service_category VARCHAR(100) NOT NULL,
         status ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft',
         author_id VARCHAR(36),
         published_at TIMESTAMP NULL,
         views INT DEFAULT 0,
         template JSON NOT NULL,
         tags JSON,
         related_ids JSON,
         seo JSON,
         rejection_reason TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         FOREIGN KEY (author_id) REFERENCES authors(id)
       )
     `);

     await connection.execute(`
       CREATE TABLE IF NOT EXISTS contact_submissions (
         id VARCHAR(36) PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         phone VARCHAR(50),
         email VARCHAR(255) NOT NULL,
         company VARCHAR(255),
         message TEXT,
         subject VARCHAR(255),
         submission_type VARCHAR(50) DEFAULT 'contact_form',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       )
     `);

     await connection.execute(`
       CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
         id VARCHAR(36) PRIMARY KEY,
         email VARCHAR(255) UNIQUE NOT NULL,
         name VARCHAR(255),
         is_active BOOLEAN DEFAULT true,
         subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         unsubscribed_at TIMESTAMP NULL
       )
     `);
   };

   module.exports = { connection, initializeDatabase };
   ```

3. **Update dataStore.js** to use MySQL instead of Supabase:
   ```javascript
   const { connection } = require('./mysqlStore');
   
   const readData = async (tableName) => {
     const [rows] = await connection.execute(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
     return rows;
   };

   const writeData = async (tableName, data) => {
     const fields = Object.keys(data).join(', ');
     const placeholders = Object.keys(data).map(() => '?').join(', ');
     const values = Object.values(data);
     
     await connection.execute(
       `INSERT INTO ${tableName} (${fields}) VALUES (${placeholders})`,
       values
     );
   };
   
   // ... implement other methods
   ```

#### Step 2: File Upload Handling

1. **Local File Upload**:
   Update `server/utils/storage.js`:
   ```javascript
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

   module.exports = { upload };
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

## Database Schema

### Supabase Tables

The system uses these Supabase tables:

- **authors**: User accounts with roles and permissions
- **posts**: Blog posts and case studies
- **contact_submissions**: Contact form submissions
- **newsletter_subscriptions**: Newsletter subscriber emails

### Storage

- **cms-images**: Supabase Storage bucket for uploaded images

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

To add new types/categories, update the validation middleware and frontend forms.

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

### 📩 Contact & Newsletter APIs

**Public Endpoints**
- `POST /api/contact` - Submit contact form
- `POST /api/contact/challenge` - Submit challenge form
- `POST /api/contact/inquiry` - Submit general inquiry
- `POST /api/contact/newsletter` - Subscribe to newsletter

**Admin Endpoints (JWT Auth Required, Admin Role)**
- `GET /api/contact/admin/submissions` - List all submissions
- `GET /api/contact/admin/newsletter` - List all newsletter subscribers
- `PUT /api/contact/admin/newsletter/:id/unsubscribe` - Deactivate a subscriber

### Upload
- `POST /api/upload` - Upload image (authenticated users only)

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

## Image Upload & Management

### Local Development
Images are stored in `/public/assets/uploads/` directory with multer handling file uploads.

### Production with Supabase Storage
Images are uploaded to Supabase Storage bucket `cms-images` with automatic URL generation.

### Production with Traditional Hosting
Images are stored in the server filesystem under `/public/assets/uploads/`.

## Environment Variables

### Development (.env)
```env
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
COOKIE_NAME=cms_auth
SITE_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Production with Supabase
```env
JWT_SECRET=your-production-secret-key
COOKIE_NAME=cms_auth
SITE_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key
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

Follow the prompts to create your admin user with:
- Username
- Full Name
- Password
- Email (optional)
- Work Designation (optional)

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
- SQL injection prevention with parameterized queries

## Performance Optimization

### Frontend
- Lazy loading images below the fold
- Responsive images with proper sizing
- Code splitting and modular JavaScript
- CSS optimization and minification

### Backend
- Database indexing for common queries
- Caching strategies for frequently accessed data
- Compression middleware
- Rate limiting to prevent abuse

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

## Monitoring & Maintenance

### Health Checks
- Monitor `/api/health` endpoint
- Check database connectivity
- Monitor storage usage
- Track error rates and response times

### Regular Maintenance
- Update dependencies monthly
- Monitor security vulnerabilities
- Review and rotate JWT secrets
- Clean up old uploaded files
- Monitor database performance

### Backup Strategy
- Supabase provides automatic backups
- Export data regularly for additional safety
- Monitor storage usage and costs

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   ```bash
   # Check Supabase connection
   curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/authors
   ```

2. **Authentication Issues**:
   - Verify JWT_SECRET is set correctly
   - Check cookie settings in browser
   - Ensure HTTPS in production

3. **Image Upload Problems**:
   - Check Supabase Storage policies
   - Verify bucket permissions
   - Test with different image formats

4. **Missing Posts**:
   - Check post status (only approved posts are public)
   - Verify author permissions
   - Check database constraints

### Debug Mode
Set `NODE_ENV=development` and check server logs:
```bash
# View logs in Render
render logs --service your-service-name

# Debug locally
DEBUG=* npm start
```

## Known Limitations & Future Improvements

### Current Limitations
- Single server instance only
- No real-time collaboration
- Limited media management
- No automated backups
- Basic email notifications

### Future Improvements
- Real-time editing with WebSockets
- Advanced media management with CDN
- Multi-language support
- Comment system
- Analytics integration
- Email notifications
- Automated testing suite
- Docker containerization

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify database connectivity
4. Check browser console for frontend errors
5. Test API endpoints with curl/Postman

### Getting Help
- Create GitHub issues for bugs
- Check documentation for common solutions
- Review error logs for specific issues
- Test with minimal reproduction case

---

**Version**: 2.0.0  
**Last Updated**: January 2025  
**License**: MIT