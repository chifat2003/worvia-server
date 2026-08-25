# Phase 3: Posts & Feed - API Testing Documentation

## Overview
Phase 3 implements the core content creation, distribution, and engagement system for Worvia. This document provides comprehensive API specifications, test cases, and expected responses.

**Base URL**: `http://localhost:5000/api`

---

## Database Schema

### New Tables (Phase 3)
- **posts** - User-generated content with engagement metrics
- **comments** - Nested comment threads on posts
- **likes** - Tracks likes on posts and comments (UNIQUE constraint on user_id, post_id, comment_id)
- **hashtags** - Normalized hashtag storage with usage counts
- **post_hashtags** - Many-to-many junction table for posts and hashtags
- **trends** - Denormalized trending topics for performance

**Engagement Score Formula**: `engagement_score = (likes × 2) + (comments × 3) + (shares × 5)`

---

## 1. POSTS ENDPOINTS

### 1.1 Create Post
**POST** `/v1/posts`
- **Auth**: Required (Bearer token)
- **Body**:
```json
{
  "content": "This is my first post! #hello #world",
  "contentHtml": "<p>This is my first post! <a href='#hello'>#hello</a> <a href='#world'>#world</a></p>",
  "image": "https://example.com/image.jpg",
  "visibility": "public"
}
```
- **Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "content": "This is my first post! #hello #world",
    "contentHtml": "...",
    "image": "https://example.com/image.jpg",
    "visibility": "public",
    "likeCount": 0,
    "commentCount": 0,
    "shareCount": 0,
    "engagementScore": 0,
    "createdAt": "2026-08-25T10:00:00Z",
    "updatedAt": "2026-08-25T10:00:00Z",
    "author": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "profilePhoto": "..."
    }
  }
}
```

### 1.2 Get All Posts (Public Feed)
**GET** `/v1/posts?limit=20&offset=0&sortBy=recent`
- **Auth**: Not required
- **Query Params**: 
  - `limit` (default: 20)
  - `offset` (default: 0)
  - `sortBy` (recent | engagement)
- **Response (200)**: Array of posts

### 1.3 Get Post by ID
**GET** `/v1/posts/:id`
- **Auth**: Not required
- **Response (200)**: Single post object

### 1.4 Get Posts by User
**GET** `/v1/posts/user/:userId?limit=20&offset=0`
- **Auth**: Not required
- **Response (200)**: Array of posts by user

### 1.5 Get User's Personalized Feed
**GET** `/v1/posts/feed/personalized?limit=20&offset=0`
- **Auth**: Required
- **Description**: Posts from followed users
- **Response (200)**: Array of posts

### 1.6 Update Post
**PUT** `/v1/posts/:id`
- **Auth**: Required (Must be post owner)
- **Body**:
```json
{
  "content": "Updated content",
  "contentHtml": "...",
  "image": "...",
  "visibility": "connections"
}
```
- **Response (200)**: Updated post object

### 1.7 Delete Post
**DELETE** `/v1/posts/:id`
- **Auth**: Required (Must be post owner)
- **Response (200)**:
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### 1.8 Get Post Engagement Metrics
**GET** `/v1/posts/:id/metrics`
- **Auth**: Not required
- **Response (200)**:
```json
{
  "success": true,
  "data": {
    "postId": 1,
    "likeCount": 42,
    "commentCount": 15,
    "shareCount": 8,
    "engagementScore": 123
  }
}
```

---

## 2. COMMENTS ENDPOINTS

### 2.1 Create Comment
**POST** `/v1/comments`
- **Auth**: Required
- **Body**:
```json
{
  "postId": 1,
  "content": "Great post!",
  "contentHtml": "<p>Great post!</p>",
  "parentCommentId": null
}
```
- **Response (201)**: Comment object with author details

### 2.2 Get Comment by ID
**GET** `/v1/comments/:id`
- **Auth**: Not required
- **Response (200)**: Comment object

### 2.3 Get Top-Level Comments for Post
**GET** `/v1/comments/post/:postId?limit=20&offset=0`
- **Auth**: Not required
- **Response (200)**: Array of top-level comments

### 2.4 Get Comments Threaded (with nested replies)
**GET** `/v1/comments/post/:postId/threaded?limit=20&offset=0`
- **Auth**: Not required
- **Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "postId": 1,
      "userId": 2,
      "content": "Great post!",
      "likeCount": 5,
      "createdAt": "...",
      "author": {...},
      "replies": [
        {
          "id": 2,
          "postId": 1,
          "parentCommentId": 1,
          "userId": 3,
          "content": "I agree!",
          "likeCount": 2,
          "createdAt": "...",
          "author": {...},
          "replies": []
        }
      ]
    }
  ]
}
```

### 2.5 Get Comment Replies
**GET** `/v1/comments/:commentId/replies?limit=10&offset=0`
- **Auth**: Not required
- **Response (200)**: Array of reply comments

### 2.6 Get Full Comment Thread
**GET** `/v1/comments/:commentId/thread`
- **Auth**: Not required
- **Response (200)**: Comment with all nested replies recursively

### 2.7 Update Comment
**PUT** `/v1/comments/:id`
- **Auth**: Required (Must be comment owner)
- **Body**:
```json
{
  "content": "Updated comment",
  "contentHtml": "..."
}
```
- **Response (200)**: Updated comment

### 2.8 Delete Comment
**DELETE** `/v1/comments/:id`
- **Auth**: Required (Must be comment owner)
- **Response (200)**: Success message

### 2.9 Search Comments in Post
**GET** `/v1/comments/search?postId=1&query=hello&limit=20`
- **Auth**: Not required
- **Response (200)**: Array of matching comments

---

## 3. LIKES ENDPOINTS

### 3.1 Like Post or Comment
**POST** `/v1/likes`
- **Auth**: Required
- **Body**:
```json
{
  "postId": 1,
  "commentId": null
}
```
- **Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "postId": 1,
    "commentId": null,
    "createdAt": "..."
  }
}
```
- **Error (400)**: "Already liked this item"

### 3.2 Unlike Post or Comment
**DELETE** `/v1/likes?postId=1`
- **Auth**: Required
- **Query Params**: Either `postId` or `commentId` required
- **Response (200)**: Success message

### 3.3 Check If User Liked
**GET** `/v1/likes/check?postId=1`
- **Auth**: Required
- **Response (200)**:
```json
{
  "success": true,
  "data": { "liked": true }
}
```

### 3.4 Get Users Who Liked Post
**GET** `/v1/likes/post/:postId?limit=20&offset=0`
- **Auth**: Not required
- **Response (200)**: Array of user likes

### 3.5 Get Users Who Liked Comment
**GET** `/v1/likes/comment/:commentId?limit=20&offset=0`
- **Auth**: Not required
- **Response (200)**: Array of user likes

### 3.6 Get Like Stats with User Preference
**GET** `/v1/likes/stats?postId=1`
- **Auth**: Required
- **Response (200)**:
```json
{
  "success": true,
  "data": {
    "postId": 1,
    "likeCount": 42,
    "userLiked": true
  }
}
```

### 3.7 Get User's Likes
**GET** `/v1/likes/user?limit=50&offset=0`
- **Auth**: Required
- **Response (200)**: Array of user's likes

### 3.8 Toggle Like
**POST** `/v1/likes/toggle`
- **Auth**: Required
- **Body**:
```json
{
  "postId": 1
}
```
- **Response (200)**:
```json
{
  "success": true,
  "data": { "liked": true },
  "message": "Liked successfully"
}
```

---

## 4. HASHTAGS ENDPOINTS

### 4.1 Search Hashtags
**GET** `/v1/hashtags/search?query=tech&limit=20`
- **Auth**: Not required
- **Response (200)**: Array of matching hashtags

### 4.2 Get Trending Hashtags
**GET** `/v1/hashtags/trending?limit=10`
- **Auth**: Not required
- **Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tag": "javascript",
      "postCount": 150,
      "engagementScore": 2500,
      "lastUpdatedAt": "...",
      "createdAt": "..."
    }
  ]
}
```

### 4.3 Get Hashtag by Name
**GET** `/v1/hashtags/:tag`
- **Auth**: Not required
- **Response (200)**: Hashtag object with usage stats

### 4.4 Get Posts with Hashtag
**GET** `/v1/hashtags/:tag/posts?limit=20&offset=0`
- **Auth**: Not required
- **Response (200)**: Array of posts with hashtag

### 4.5 Get Hashtags for Post
**GET** `/v1/hashtags/post/:postId`
- **Auth**: Not required
- **Response (200)**: Array of hashtags in post

### 4.6 Calculate Trends (Admin/Maintenance)
**POST** `/v1/hashtags/trends/calculate`
- **Auth**: Required
- **Response (200)**:
```json
{
  "success": true,
  "message": "Trends calculated successfully"
}
```

---

## 5. FEED ENDPOINTS

### 5.1 Get Personalized Feed
**GET** `/v1/feed/personalized?limit=20&offset=0&algorithm=hybrid&timeWindow=168`
- **Auth**: Required
- **Query Params**:
  - `algorithm` (engagement | recency | hybrid, default: hybrid)
  - `timeWindow` (hours, default: 168)
- **Scoring**: `hybrid = (engagement × 0.4) + (recency × 0.3) + (personalization × 0.3)`
- **Response (200)**: Array of ranked posts

### 5.2 Get Discovery Feed
**GET** `/v1/feed/discovery?limit=20&offset=0`
- **Auth**: Required
- **Description**: Trending posts from users you don't follow
- **Response (200)**: Array of high-engagement posts

### 5.3 Get Hashtag Feed
**GET** `/v1/feed/hashtag/:tag?limit=20&offset=0`
- **Auth**: Required
- **Response (200)**: Array of posts with hashtag

### 5.4 Get Ranking Metrics (Debug)
**GET** `/v1/feed/metrics/:postId`
- **Auth**: Required
- **Response (200)**:
```json
{
  "success": true,
  "data": {
    "postId": 1,
    "engagementScore": 123,
    "recencyScore": 85.5,
    "personalizedScore": 50,
    "finalScore": 110.25
  }
}
```

---

## TEST CASES

### Scenario 1: Create and Engage with a Post
1. Create post: `POST /v1/posts`
2. Like post: `POST /v1/likes` with postId
3. Get post metrics: `GET /v1/posts/:id/metrics`
4. Create comment: `POST /v1/comments` with postId
5. Like comment: `POST /v1/likes` with commentId
6. Verify engagement score updated: `(2 likes × 2) + (1 comment × 3) = 7`

### Scenario 2: Comment Threading
1. Create post
2. Create top-level comment
3. Create reply to comment: `POST /v1/comments` with parentCommentId
4. Get threaded comments: `GET /v1/comments/post/:postId/threaded`
5. Verify nested structure in response

### Scenario 3: Feed Ranking
1. Create 5 posts with different:
   - Engagement levels (likes, comments)
   - Creation times (recent vs old)
   - By followed vs unfollowed users
2. Get personalized feed: `GET /v1/feed/personalized?algorithm=hybrid`
3. Verify ranking matches algorithm (engagement × 0.4 + recency × 0.3 + personalization × 0.3)

### Scenario 4: Hashtag Extraction and Trending
1. Create post with hashtags: "#javascript #react #webdev"
2. Verify hashtags created: `GET /v1/hashtags/search?query=javascript`
3. Create multiple posts with same hashtags
4. Calculate trends: `POST /v1/hashtags/trends/calculate`
5. Get trending: `GET /v1/hashtags/trending`
6. Verify top trending hashtags appear

### Scenario 5: Visibility and Feed Access
1. Create posts with different visibility (public, connections, private)
2. Public feed should only show public posts: `GET /v1/posts`
3. User feed should show public + connections + own: `GET /v1/feed/personalized`
4. Private posts should not appear in anyone else's feeds

---

## ERROR HANDLING

### Common Errors

**400 Bad Request**:
- Missing required fields
- Invalid post/comment/hashtag ID
- Already liked item
- Cannot like both post and comment simultaneously

**401 Unauthorized**:
- Missing or invalid authentication token

**403 Forbidden**:
- Attempting to update/delete post/comment not owned by user

**404 Not Found**:
- Post, comment, or hashtag does not exist
- User not found

**500 Internal Server Error**:
- Database errors
- Service failures

---

## Performance Expectations

- Post creation: < 100ms
- Feed generation (20 items): < 500ms with hybrid algorithm
- Comment threading (recursive): < 200ms for 10 top-level + replies
- Hashtag search: < 100ms
- Like toggle: < 50ms (duplicate prevention via UNIQUE constraint)

---

## Production Readiness Checklist

- [x] Database schema with proper indexes
- [x] Engagement scoring algorithm
- [x] Feed ranking algorithm (hybrid)
- [x] Error handling and validation
- [x] Authorization checks (ownership verification)
- [x] Comment threading with recursion
- [x] Hashtag extraction and management
- [x] Like deduplication (UNIQUE constraint)
- [x] API routes integrated
- [ ] Frontend UI implementation
- [ ] End-to-end testing
- [ ] Load testing for feed algorithm
- [ ] Caching strategy for trending
- [ ] Rate limiting for API endpoints

---

## Next Steps (Phase 4)

1. **Frontend Implementation**: Build React components for feed, posts, comments
2. **Real-time Updates**: Implement WebSocket for live notifications
3. **Advanced Search**: Full-text search on posts and comments
4. **Analytics**: Track engagement patterns, user behavior
5. **Caching Layer**: Redis for trending hashtags, feed caching
6. **Content Moderation**: Flagging system for inappropriate content

---

## Database Queries Reference

### Get Top Posts This Week
```sql
SELECT * FROM posts 
WHERE created_at >= NOW() - INTERVAL '7 days' 
ORDER BY engagement_score DESC 
LIMIT 10;
```

### Get User's Feed
```sql
SELECT p.* FROM posts p
JOIN followers f ON p.user_id = f.following_id
WHERE f.follower_id = $1 AND p.visibility IN ('public', 'connections')
ORDER BY p.engagement_score DESC;
```

### Get Trending Hashtags
```sql
SELECT * FROM trends 
ORDER BY engagement_score DESC, post_count DESC 
LIMIT 10;
```

### Get Comment Thread
```sql
WITH RECURSIVE comment_tree AS (
  SELECT * FROM comments WHERE id = $1
  UNION ALL
  SELECT c.* FROM comments c
  JOIN comment_tree ct ON c.parent_comment_id = ct.id
)
SELECT * FROM comment_tree ORDER BY created_at;
```

---

**Document Version**: 1.0
**Last Updated**: August 25, 2026
**Author**: Worvia Development Team
