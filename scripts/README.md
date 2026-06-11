# Database Scripts

## Admin User Seeding

### Quick Start

Seed the default admin user:

```bash
npm run seed:admin
```

Default credentials:
- Username: `admin`
- Password: `admin123`

### Custom Credentials

Use environment variables to set custom credentials:

```bash
USERNAME=myadmin PASSWORD=securepass npm run seed:admin
```

### What It Does

The seed script will:
1. Connect to your MongoDB database (using `MONGODB_URI` from `.env.local`)
2. Check if the username already exists
3. If exists: Update the password hash
4. If new: Create a new admin user with the provided credentials
5. Remove any legacy plain-text passwords

### Security Notes

- Passwords are hashed using bcrypt with 12 rounds
- Always change the default password after first login
- The script can be run multiple times safely (it's idempotent)
- Never commit credentials to version control

### Troubleshooting

**Error: MONGODB_URI not found**
- Ensure `.env.local` exists and contains a valid `MONGODB_URI`
- Copy from `.env.local.example` if needed

**Connection refused**
- Check that MongoDB is running and accessible
- Verify the connection string in `MONGODB_URI`
