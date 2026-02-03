# School Cloud Backend - Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Redis installed (optional, for background jobs)
- [ ] npm 9+ installed

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and update:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/school_cloud"
JWT_SECRET=your-random-secret-key
JWT_REFRESH_SECRET=your-random-refresh-secret
```

### 3. Setup Database
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data
npm run prisma:seed
```

### 4. Start Server
```bash
npm run dev
```

Server runs at: **http://localhost:5000**

## Test the API

### 1. Health Check
```bash
curl http://localhost:5000/api/v1/health
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "password123"
  }'
```

Copy the `accessToken` from the response.

### 3. Get Profile
```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@example.com | password123 |
| School Admin | admin@school1.com | password123 |
| Teacher | teacher@school1.com | password123 |
| Student | student@school1.com | password123 |

## Next Steps

1. **Connect Frontend**: Update Frontend `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

2. **Test Integration**: Login from frontend should now work!

3. **Add More Endpoints**: Extend with student management, attendance, etc.

## Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Create database manually
psql -U postgres
CREATE DATABASE school_cloud;
```

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

## Development Tools

### Prisma Studio
Visual database editor:
```bash
npm run prisma:studio
```

### View Logs
```bash
tail -f logs/combined.log
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update JWT secrets with strong random values
3. Configure production database
4. Set up Redis for background jobs
5. Enable HTTPS
6. Configure CORS origins
7. Set up monitoring and logging

---

**Need help?** Check README.md and API_DOCS.md for detailed documentation.
