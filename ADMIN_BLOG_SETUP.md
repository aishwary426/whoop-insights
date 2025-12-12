# Admin Blog Management Setup

## Overview

Admin access has been granted to **ctaishwary@gmail.com** for managing blog posts with image support.

## Admin Features

1. **Create Blog Posts** - Add new posts with images
2. **Edit Blog Posts** - Update existing posts
3. **Delete Blog Posts** - Remove posts
4. **Upload Images** - Upload images for blog posts
5. **Publish/Draft** - Control post visibility

## Access

1. **Login** with email: `ctaishwary@gmail.com` via Supabase
2. **Visit** `/admin/blog` to access the admin interface

## Admin Interface

The admin interface is located at: **`/app/admin/blog/page.tsx`**

### Features:
- Create new blog posts
- Edit existing posts
- Upload images (JPG, PNG, GIF, WebP - max 10MB)
- Set publish/draft status
- Delete posts
- View all posts including drafts

## API Endpoints

### Blog Management (Admin Only)
- `POST /api/v1/blog` - Create blog post (requires admin auth)
- `PUT /api/v1/blog/{post_id}` - Update blog post (requires admin auth)
- `DELETE /api/v1/blog/{post_id}` - Delete blog post (requires admin auth)
- `GET /api/v1/blog` - List all posts (public, published only by default)
- `GET /api/v1/blog/{post_id}` - Get single post (public)

### Image Management (Admin Only)
- `POST /api/v1/images/upload` - Upload image (requires admin auth)
- `GET /api/v1/images/{filename}` - Serve image (public)

## Authentication

Admin authentication works by:
1. User logs in via Supabase
2. Frontend sends user's email in `Authorization` header: `Bearer email:user@example.com`
3. Backend checks if email is in admin list (currently: `ctaishwary@gmail.com`)
4. Access granted if email matches

### Adding More Admins

To add more admin users, edit `backend/app/core_config.py`:

```python
# Admin config
admin_emails: list = ["ctaishwary@gmail.com", "another-admin@example.com"]
```

## Database

### Blog Post Fields
- `id` - Auto-increment ID
- `title` - Blog post title (required)
- `category` - Category (required)
- `reading_time` - Estimated reading time (optional, e.g., "5 min")
- `preview` - Preview text shown on blog list (required)
- `content` - Full blog post content (optional)
- `image_url` - URL/path to blog post image (optional)
- `slug` - URL-friendly identifier (required, auto-generated)
- `published` - 1 = published, 0 = draft (default: 1)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Migration

The `image_url` column has been added to the `blog_posts` table via migration script.

## Image Storage

Images are stored in:
- **Local**: `backend/data/images/`
- **Cloud**: `/tmp/data/images/` (on serverless platforms)

Images are served via: `/api/v1/images/{filename}`

### Image Upload Process
1. Admin selects image file (max 10MB)
2. Image is uploaded to `/api/v1/images/upload`
3. Server saves image and returns URL
4. URL is stored in `image_url` field
5. Images displayed on blog page

## Frontend Integration

### Admin Page
- **Location**: `/app/admin/blog/page.tsx`
- **Route**: `/admin/blog`
- **Features**: Full CRUD operations with image upload

### Blog Page
- **Location**: `/app/blog/page.tsx`
- **Route**: `/blog`
- **Features**: Displays published posts with images

## Usage

### Creating a Blog Post

1. Login with `ctaishwary@gmail.com`
2. Visit `/admin/blog`
3. Click "New Post"
4. Fill in:
   - Title (required)
   - Category (required)
   - Reading Time (optional)
   - Preview (required)
   - Content (optional)
   - Image (optional - upload file)
   - Published checkbox
5. Click "Create Post"

### Editing a Post

1. Click edit icon on any post
2. Make changes
3. Click "Update Post"

### Deleting a Post

1. Click delete icon on any post
2. Confirm deletion

## Security

- Admin endpoints require authentication
- Only emails in `admin_emails` list can access admin features
- Images are validated (type and size)
- Slug generation prevents duplicate posts

## Next Steps

1. **Restart backend** to register new endpoints
2. **Test admin access** by logging in and visiting `/admin/blog`
3. **Create a test post** with an image
4. **Verify** the post appears on `/blog`

## Troubleshooting

### "Access denied" error
- Make sure you're logged in with `ctaishwary@gmail.com`
- Check that your email matches exactly (case-insensitive)

### Image upload fails
- Check file size (max 10MB)
- Check file type (JPG, PNG, GIF, WebP only)
- Ensure `/data/images/` directory exists and is writable

### Posts not showing
- Check `published` status (must be 1)
- Verify API endpoint is working: `GET /api/v1/blog`
- Check browser console for errors























