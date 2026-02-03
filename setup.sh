#!/bin/bash

echo "🚀 School Cloud Backend - Quick Setup Script"
echo "==========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running."
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "📝 Step 2: Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update .env with your database credentials!"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "🗄️  Step 3: Setting up database..."
read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:generate
    npm run prisma:migrate
    
    echo ""
    read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run prisma:seed
        echo ""
        echo "✅ Database seeded with demo users:"
        echo "   - Super Admin: superadmin@example.com / password123"
        echo "   - School Admin: admin@school1.com / password123"
        echo "   - Teacher: teacher@school1.com / password123"
        echo "   - Student: student@school1.com / password123"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "Server will be available at: http://localhost:5000"
echo "API endpoint: http://localhost:5000/api/v1"
echo ""
echo "📖 Documentation:"
echo "  - README.md - Complete setup and usage guide"
echo "  - API_DOCS.md - Detailed API documentation"
echo ""
