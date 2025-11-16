# letsfindsanity

a space for builders to journal, support and ask for advice anonymously !


## overview

letsfindsanity is an open-source platform where builders can:
- journal anonymously with ai analysis
- share reflections with the community
- support others through reactions and comments
- discover posts through semantic search
- browse by topics and intents

## why open source?

transparency builds trust. when you're sharing vulnerable thoughts, you deserve to know exactly how your data is handled. that's why we're open-sourcing everything—from how journal entries are encrypted to how the ai analyzes your writing.

**key transparency principles:**
- **end-to-end encryption** - your private journal entries are encrypted with fernet symmetric encryption. admins cannot read them.
- **open ai prompts** - all claude prompts are visible in the codebase. no hidden instructions.
- **public analytics** - see exactly what metrics we track and how.
- **community-driven** - fork it, customize it, make it yours.

for a detailed technical breakdown, visit [/tech](https://letsfindsanity.com/tech) on the live site.

## tech stack

**backend:**
- flask (python web framework)
- postgresql with pgvector (database with vector embeddings)
- anthropic claude sonnet 4.5 (ai analysis with prompt caching)
- openai (text embeddings for semantic search)
- sendgrid (email for passwordless auth)
- cryptography/fernet (journal encryption)

**frontend:**
- next.js 14 (react framework with app router)
- typescript
- server and client components

## features

- **passwordless auth** - email otp login
- **application system** - verified builders only
- **writing interface** - 10-minute minimum with autosave
- **ai analysis** - private reflection and safety check using claude
- **encrypted journals** - fernet symmetric encryption for private entries
- **anonymous sharing** - three-word identities
- **semantic search** - find similar posts using openai embeddings
- **topic system** - organize by themes
- **intent-based prompts** - 7 different ai response styles (processing, agreeing, challenging, solution, venting, advice, reflecting)
- **reactions & comments** - community engagement
- **admin dashboard** - application review, moderation, analytics
- **dark/light themes** - user preference

## setup

### prerequisites

- python 3.9+
- node.js 18+
- postgresql database (neon.tech recommended)
- anthropic api key
- openai api key
- sendgrid api key

### database setup

1. create a postgresql database (neon.tech recommended)

2. enable pgvector extension and run the schema:
```bash
psql $DATABASE_URL < backend/scripts/init_db.sql
```

3. run analytics tables migration:
```bash
psql $DATABASE_URL < backend/scripts/add_analytics_tracking.sql
```

### backend setup

1. navigate to backend directory:
```bash
cd backend
```

2. create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # on windows: venv\Scripts\activate
```

3. install dependencies:
```bash
pip install -r requirements.txt
```

4. create `.env` file:
```env
DATABASE_URL=your_neon_database_url
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
FLASK_SECRET_KEY=generate_random_secret_key
JWT_SECRET=generate_random_jwt_secret
JWT_EXPIRES_HOURS=720
FRONTEND_URL=http://localhost:3000
ENCRYPTION_KEY=generate_with_fernet_key_generate
```

5. generate encryption key:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

6. create an admin user:
```bash
python scripts/create_admin.py your@email.com
```

7. run the server:
```bash
python app.py
```

backend will run on `http://localhost:5000`

### frontend setup

1. navigate to frontend directory:
```bash
cd frontend
```

2. install dependencies:
```bash
npm install
```

3. create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. run the development server:
```bash
npm run dev
```

frontend will run on `http://localhost:3000`

## usage

### user flow

1. **signup/login** - enter email, receive otp code
2. **apply** - submit application (what you're building, why join)
3. **wait for approval** - admin reviews application
4. **choose identity** - select from 5 generated three-word identities
5. **start writing** - choose intent, write for 10+ minutes
6. **get analysis** - claude provides private reflection based on intent
7. **share or save** - post anonymously or keep private (encrypted)

### admin flow

1. **login as admin** - use email from create_admin script
2. **review applications** - approve/reject/request more info
3. **monitor analytics** - view growth, sessions, api usage
4. **moderate content** - review flagged posts

## api endpoints

### auth
- `POST /api/auth/request-otp` - request otp code
- `POST /api/auth/verify-otp` - verify otp and login
- `POST /api/auth/logout` - logout
- `GET /api/auth/me` - get current user
- `PATCH /api/auth/theme` - update theme preference

### application
- `POST /api/application/submit` - submit application
- `GET /api/application/status` - get application status
- `PATCH /api/application/update` - update application

### identity
- `POST /api/identity/choose` - choose three-word identity
- `GET /api/identity/generate` - generate identity options
- `POST /api/identity/reset` - reset identity

### sessions (writing)
- `POST /api/sessions/start` - start writing session
- `PATCH /api/sessions/:id/autosave` - autosave content
- `POST /api/sessions/:id/analyze` - analyze with claude
- `POST /api/sessions/:id/save-private` - save privately (encrypted)
- `POST /api/sessions/:id/share` - share as public post
- `GET /api/sessions/mine` - get private sessions

### posts
- `GET /api/posts` - get feed
- `GET /api/posts/:id` - get single post
- `GET /api/posts/by-identity/:id` - get posts by identity
- `POST /api/posts/:id/react` - add reaction
- `DELETE /api/posts/:id/react/:type` - remove reaction
- `POST /api/posts/:id/comment` - add comment
- `POST /api/posts/:id/flag` - flag post

### topics
- `GET /api/topics` - get all topics
- `GET /api/topics/following` - get followed topics
- `POST /api/topics/follow` - follow topic
- `DELETE /api/topics/unfollow/:topic` - unfollow topic
- `GET /api/topics/:topic/posts` - get topic posts

### search
- `GET /api/search` - semantic search posts using embeddings

### admin
- `GET /api/admin/stats` - get platform stats
- `GET /api/admin/analytics` - get analytics charts data
- `GET /api/admin/applications` - get application queue
- `PATCH /api/admin/applications/:id/approve` - approve
- `PATCH /api/admin/applications/:id/reject` - reject
- `PATCH /api/admin/applications/:id/request-info` - request more info
- `GET /api/admin/flags` - get flagged posts
- `DELETE /api/admin/posts/:id` - delete post
- `GET /api/admin/search` - search users and posts
- `GET /api/admin/comments` - view all comments

### stats
- `GET /api/stats/live` - get live public stats

## deployment

this guide covers deploying letsfindsanity to production using recommended platforms.

### prerequisites

- neon.tech postgresql database (or any postgresql with pgvector support)
- anthropic api key
- openai api key
- sendgrid api key with verified sender
- github account (for vercel deployment)
- domain name (optional but recommended)

### step 1: database setup

1. **create neon database:**
   - sign up at [neon.tech](https://neon.tech)
   - create a new project
   - copy the connection string (DATABASE_URL)

2. **enable pgvector and run schema:**
   ```bash
   # install psql if needed
   brew install postgresql  # macos
   sudo apt install postgresql-client  # ubuntu

   # run initial schema
   psql $DATABASE_URL < backend/scripts/init_db.sql

   # run analytics migration
   psql $DATABASE_URL < backend/scripts/add_analytics_tracking.sql
   ```

3. **create admin user:**
   ```bash
   cd backend
   python scripts/create_admin.py your@email.com
   ```

### step 2: backend deployment (railway)

we recommend [railway.app](https://railway.app) for the flask backend.

1. **create railway account:**
   - sign up at railway.app
   - connect your github account

2. **create new project:**
   - click "new project"
   - select "deploy from github repo"
   - choose your fork of letsfindsanity
   - select the `backend` directory as the root

3. **configure environment variables:**

   in railway dashboard, add these variables:
   ```env
   DATABASE_URL=your_neon_connection_string
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   SENDGRID_API_KEY=SG...
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   FLASK_SECRET_KEY=generate_random_64_char_string
   JWT_SECRET=generate_random_64_char_string
   JWT_EXPIRES_HOURS=720
   FRONTEND_URL=https://yourdomain.com
   ENCRYPTION_KEY=generate_with_fernet
   PORT=5000
   ```

   **generate secrets:**
   ```bash
   # encryption key
   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

   # flask/jwt secrets
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **configure build settings:**
   - root directory: `/backend`
   - build command: `pip install -r requirements.txt`
   - start command: `python app.py`

5. **deploy:**
   - railway will auto-deploy on push to main branch
   - copy the deployment url (e.g., `https://your-app.up.railway.app`)

### step 3: sendgrid email setup

1. **verify sender email:**
   - go to [sendgrid.com](https://sendgrid.com)
   - navigate to "sender authentication"
   - verify your domain or single sender email
   - use this as `SENDGRID_FROM_EMAIL`

2. **create api key:**
   - go to "api keys" in sendgrid dashboard
   - create new api key with "mail send" permissions
   - copy the key and add to environment variables

### step 4: frontend deployment (vercel)

1. **create vercel account:**
   - sign up at [vercel.com](https://vercel.com)
   - connect your github account

2. **import project:**
   - click "new project"
   - import your letsfindsanity repository
   - vercel will auto-detect next.js

3. **configure project settings:**
   - root directory: `frontend`
   - framework preset: next.js
   - build command: `npm run build` (default)
   - output directory: `.next` (default)

4. **add environment variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

5. **deploy:**
   - click "deploy"
   - vercel will build and deploy your frontend
   - copy the deployment url

6. **add custom domain (optional):**
   - in vercel dashboard, go to "settings" → "domains"
   - add your custom domain
   - configure dns records as instructed
   - vercel will auto-provision ssl certificate

### step 5: update cors settings

1. **update backend cors:**

   in `backend/app.py`, update CORS origins:
   ```python
   CORS(app,
        origins=[
            "https://yourdomain.com",
            "http://localhost:3000"  # for local dev
        ],
        supports_credentials=True
   )
   ```

2. **redeploy backend:**
   - push changes to github
   - railway will auto-deploy

### step 6: verify deployment

1. **test backend health:**
   ```bash
   curl https://your-backend.up.railway.app/api/stats/live
   ```
   should return json with platform stats

2. **test frontend:**
   - visit your frontend url
   - try to login with admin email
   - check that email otp is received
   - verify all pages load correctly

3. **test full flow:**
   - create a test user account
   - submit an application
   - approve it as admin
   - choose identity
   - write a journal entry
   - analyze with ai
   - share a public post

### alternative deployment options

#### backend alternatives:

**fly.io:**
```bash
# install flyctl
curl -L https://fly.io/install.sh | sh

# login
flyctl auth login

# create app
cd backend
flyctl launch

# set secrets
flyctl secrets set DATABASE_URL=...
flyctl secrets set ANTHROPIC_API_KEY=...
# ... set all other env vars

# deploy
flyctl deploy
```

**heroku:**
```bash
# install heroku cli
brew tap heroku/brew && brew install heroku

# login
heroku login

# create app
cd backend
heroku create your-app-name

# add buildpack
heroku buildpacks:set heroku/python

# set config vars
heroku config:set DATABASE_URL=...
heroku config:set ANTHROPIC_API_KEY=...
# ... set all other env vars

# deploy
git push heroku main
```

#### frontend alternatives:

**netlify:**
- similar to vercel
- connect github repo
- set root directory to `frontend`
- add environment variables
- deploy

**cloudflare pages:**
- connect github repo
- build command: `npm run build`
- output directory: `.next`
- add environment variables

### monitoring and maintenance

1. **api usage monitoring:**
   - check admin dashboard for token usage
   - anthropic billing: [console.anthropic.com](https://console.anthropic.com)
   - openai billing: [platform.openai.com](https://platform.openai.com)

2. **database monitoring:**
   - neon provides built-in monitoring
   - watch for connection limits
   - monitor storage usage

3. **error tracking (optional):**
   - add sentry for error tracking
   - install: `pip install sentry-sdk[flask]` (backend)
   - install: `npm install @sentry/nextjs` (frontend)

4. **backups:**
   - neon provides automatic backups
   - export database periodically: `pg_dump $DATABASE_URL > backup.sql`

5. **log rotation:**
   - railway provides log retention (7 days free tier)
   - export logs if needed for long-term storage

### security checklist

- [ ] all secrets are in environment variables (not in code)
- [ ] https enabled on both frontend and backend
- [ ] cors origins restricted to your domain
- [ ] sendgrid sender email verified
- [ ] database uses ssl connection
- [ ] jwt secret is strong random string
- [ ] encryption key is securely stored
- [ ] admin email is controlled by you
- [ ] rate limiting enabled (optional but recommended)

### cost estimates (approximate)

**free tier (suitable for small communities):**
- neon: free tier (3 projects, 10gb storage)
- railway: $5/month usage-based
- vercel: free tier (100gb bandwidth)
- anthropic: pay per token (~$20-50/month for moderate use)
- openai: pay per token (~$5-10/month for embeddings)
- sendgrid: free tier (100 emails/day)

**total: ~$30-70/month** depending on usage

**scaling up:**
- neon pro: $19/month (increased storage and connections)
- railway pro: $20/month + usage
- vercel pro: $20/month (increased bandwidth)
- increase anthropic budget as needed

### troubleshooting

**backend won't start:**
- check all environment variables are set
- verify database connection string is correct
- check logs in railway dashboard
- ensure requirements.txt dependencies installed

**emails not sending:**
- verify sendgrid sender email
- check sendgrid api key has mail send permissions
- look for errors in backend logs
- check sendgrid activity dashboard

**cors errors:**
- verify FRONTEND_URL in backend matches your domain
- check cors origins in app.py includes your frontend url
- ensure credentials are enabled in cors config

**database connection errors:**
- verify DATABASE_URL is correct
- check neon project is active (not paused)
- ensure pgvector extension is enabled
- verify migrations have been run

**ai analysis not working:**
- check anthropic api key is valid
- verify you have credits in anthropic account
- check backend logs for error messages
- ensure encryption key is set correctly

### post-deployment tasks

1. **update application:**
   - test the application flow end-to-end
   - approve your first test user
   - verify ai analysis works
   - test public post sharing

2. **content moderation:**
   - monitor flagged posts in admin dashboard
   - review applications regularly
   - set expectations for response times

3. **community guidelines:**
   - share the terms and privacy policy with users
   - communicate moderation standards
   - be transparent about data handling

4. **analytics:**
   - monitor builder growth in admin dashboard
   - track api usage to manage costs
   - review session activity patterns

### need help?

- **github issues:** [github.com/tejassudsfp/letsfindsanity/issues](https://github.com/tejassudsfp/letsfindsanity/issues)
- **email:** [hello@letsfindsanity.com](mailto:hello@letsfindsanity.com)
- **discussions:** [github.com/tejassudsfp/letsfindsanity/discussions](https://github.com/tejassudsfp/letsfindsanity/discussions)

## key design decisions

- **passwordless auth** - reduces friction, email-based
- **10-minute minimum** - encourages deep reflection
- **intent-based prompts** - claude adapts response style based on what you need (7 different modes)
- **prompt caching** - master system prompt is cached to reduce api costs
- **ai safety check** - prevents harmful content sharing
- **mental health safeguards** - detect crisis-level content and suggest professional help
- **three-word identities** - anonymity with personality
- **autosave** - never lose writing progress
- **encryption** - fernet symmetric encryption for private journals
- **vector search** - find similar experiences using openai embeddings
- **real-time analytics** - admin dashboard with live metrics
- **dark/light themes** - user preference

## privacy & security

### encryption
- **private journal entries** are encrypted with fernet (symmetric encryption)
- encryption key stored server-side (env variable)
- admins **cannot read** encrypted journal content
- only you can see your private journals when logged in

### authentication
- httponly cookies for jwt tokens
- otp codes expire in 10 minutes
- jwt tokens expire after 720 hours (configurable)

### database
- parameterized sql queries (prevent injection)
- pgvector for embeddings (no raw sql)

### admin access
- admin-only routes protected with middleware
- admins can see: public posts, applications, user emails, analytics
- admins **cannot see**: encrypted journal entries, otp codes

### production recommendations
- use https for all traffic
- enable rate limiting (not included in base repo)
- rotate encryption keys periodically
- use secure session cookies
- monitor api usage for anomalies

## ai transparency

### claude prompts
all claude prompts are visible in `backend/services/claude_service.py`:
- master system prompt (cached for cost efficiency)
- intent-based instructions (7 different modes)
- safety check criteria
- anonymization rules

### what claude sees
- your raw journal content (sent to anthropic api)
- your chosen intent (processing, agreeing, challenging, etc.)
- nothing else (no user id, email, or identity)

### what claude does
1. provides private analysis based on intent
2. checks content safety (identifies harmful content, mental health crisis, identifying info)
3. suggests anonymized version for sharing
4. auto-generates journal title

### data retention
- anthropic: 30 days (per their policy)
- openai: 30 days (per their policy)
- letsfindsanity: encrypted journals stored indefinitely until you delete

## analytics tracking

we track:
- api token usage (input/output tokens, cache hits)
- builder growth (daily new signups)
- session activity (writing sessions completed)
- post creation (public shares)

**we do not track:**
- individual user behavior
- reading patterns
- ip addresses
- device fingerprints

admin dashboard shows aggregate metrics only.

## contributing

contributions are welcome! here's how:

1. fork the repo
2. create a feature branch (`git checkout -b feature/amazing-feature`)
3. commit your changes (`git commit -m 'add amazing feature'`)
4. push to the branch (`git push origin feature/amazing-feature`)
5. open a pull request

### areas we'd love help with
- accessibility improvements
- additional languages/internationalization
- performance optimizations
- security audits
- mobile app (react native?)

## license

MIT license - see [LICENSE](LICENSE) file for details.

you're free to:
- use commercially
- modify
- distribute
- private use

just include the original license and copyright notice.

## acknowledgments

- built with [claude code 1.0](https://code.claude.com)
- inspired by the builder community
- powered by anthropic claude and openai

## support

- **email**: [hello@letsfindsanity.com](mailto:hello@letsfindsanity.com)
- **issues**: [github issues](https://github.com/tejassudsfp/letsfindsanity/issues)
- **discussions**: [github discussions](https://github.com/tejassudsfp/letsfindsanity/discussions)
- **live site**: [letsfindsanity.com](https://letsfindsanity.com)

## repository

[https://github.com/tejassudsfp/letsfindsanity](https://github.com/tejassudsfp/letsfindsanity)

---

built with care for the builder community. your struggles are valid. you're not alone.
