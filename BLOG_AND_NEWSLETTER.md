# Blog and Newsletter Management

## Overview

The blog and newsletter functionality is now fully implemented with database storage and API endpoints.

## Database Tables

1. **`blog_posts`** - Stores blog post data
2. **`newsletter_subscribers`** - Stores newsletter subscriber emails

## How to Add Blog Posts

You have three options:

### Option 1: Using the Python Script (Recommended)

Run the script to add the default example posts:

```bash
cd backend
python add_blog_post.py
```

To add your own posts, edit the `posts` list in `backend/add_blog_post.py` and run it again.

### Option 2: Using the API Endpoint

Use a REST client (Postman, curl, etc.) to POST to the blog endpoint:

```bash
curl -X POST "http://localhost:8000/api/v1/blog" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Your Blog Post Title",
    "category": "Recovery Science",
    "reading_time": "5 min",
    "preview": "Your preview text here...",
    "slug": "your-blog-post-slug",
    "published": 1
  }'
```

### Option 3: Direct Database Insert

You can also add posts directly via SQL:

```sql
INSERT INTO blog_posts (title, category, reading_time, preview, slug, published)
VALUES (
  'Your Blog Post Title',
  'Recovery Science',
  '5 min',
  'Your preview text...',
  'your-blog-post-slug',
  1
);
```

## Blog Post Fields

- `title` (required): The blog post title
- `category` (required): Category (e.g., "Recovery Science", "Training Insights", etc.)
- `reading_time` (optional): Estimated reading time (e.g., "5 min")
- `preview` (required): Preview/description text shown on the blog list page
- `content` (optional): Full blog post content (for future use)
- `slug` (required): URL-friendly identifier (auto-generated if not provided)
- `published` (optional): 1 = published, 0 = draft (default: 1)

## Newsletter Subscription

The newsletter subscription form is now functional. When users enter their email and click "Subscribe":

1. The email is validated
2. If the email already exists:
   - If subscribed: Shows "already subscribed" message
   - If unsubscribed: Resubscribes them
3. If new: Creates a new subscription record
4. Success/error messages are displayed to the user

## API Endpoints

### Blog Endpoints

- `GET /api/v1/blog` - List all blog posts (query param: `published_only=true`)
- `GET /api/v1/blog/{post_id}` - Get a specific blog post by ID
- `GET /api/v1/blog/slug/{slug}` - Get a blog post by slug
- `POST /api/v1/blog` - Create a new blog post (admin)
- `PUT /api/v1/blog/{post_id}` - Update a blog post (admin)
- `DELETE /api/v1/blog/{post_id}` - Delete a blog post (admin)

### Newsletter Endpoints

- `POST /api/v1/newsletter/subscribe` - Subscribe an email address
  ```json
  { "email": "user@example.com" }
  ```
- `POST /api/v1/newsletter/unsubscribe` - Unsubscribe an email address
  ```json
  { "email": "user@example.com" }
  ```

## Frontend Integration

The blog page (`/blog`) now:
- Fetches blog posts from the API on load
- Displays a loading state while fetching
- Shows an empty state if no posts are available
- Connects the newsletter subscription form to the API
- Shows success/error messages for subscription attempts

## Database Migration

To create the new tables, you'll need to run a migration. The tables will be created automatically when you start the backend if using SQLAlchemy's `create_all()`, or you can use Alembic migrations.

If using the main.py startup event that creates tables:

```python
Base.metadata.create_all(bind=engine)
```

The new tables (`blog_posts` and `newsletter_subscribers`) will be created automatically.

## Next Steps

1. **Run the blog post script** to add the example posts:
   ```bash
   cd backend
   python add_blog_post.py
   ```

2. **Restart your backend** to register the new endpoints (if needed)

3. **Test the blog page** at `/blog` - it should now fetch posts from the API

4. **Test newsletter subscription** by entering an email and clicking Subscribe

5. **Add more blog posts** using any of the three methods above

## Admin Interface (Future Enhancement)

Consider creating an admin interface for managing blog posts. For now, you can:
- Use the API endpoints directly
- Use the Python script
- Access the database directly























