# ATOM 2K26 — Backend

> **IEEE Student Chapter Event Portal** — Node.js + Express + MongoDB

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 22 (Alpine) |
| Framework | Express.js 4 |
| Database | MongoDB 8 (Mongoose) |
| Auth | bcryptjs + express-session |
| Email | Nodemailer (SMTP) |
| Security | helmet, express-rate-limit, httpOnly cookies |
| Container | Docker + Docker Compose |

---

## Quick Start — Local Dev

### Prerequisites
- Node.js v18+
- MongoDB v6+ running locally

```bash
# 1. Install dependencies
cd atom_bknd
npm install

# 2. Create .env (see Environment section below)
cp .env.example .env   # or create manually

# 3. Start MongoDB
sudo systemctl start mongod

# 4. Run dev server
npm run dev
```

Expected output:
```
✅ MongoDB connected: mongodb://localhost:27017/atom2k26
🚀 ATOM 2K26 Backend running at http://0.0.0.0:3000
```

---

## Quick Start — Docker (For Others to Run)

To run this backend on any machine, you **only** need Docker and Git installed. No Node.js or MongoDB required!

**1. Clone the repository:**
```bash
git clone https://github.com/rocky-557/ATOM2k26.git
cd ATOM2k26
```

**2. Start the application:**
```bash
docker-compose up -d --build
```
This single command will:
- Download the MongoDB database image
- Build the Node.js application from source
- Connect them together and start them in the background

The backend will then be accessible at `http://localhost:3000`.

**Useful Docker Commands:**
```bash
docker-compose ps              # verify containers are running
docker-compose logs -f app     # stream the Node.js logs
docker-compose down            # stop everything
docker-compose down -v         # stop + delete all database data
```

---

## Environment Variables

Create a `.env` file in `atom_bknd/`:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# MongoDB
MONGO_URI=mongodb://localhost:27017/atom2k26

# Session (generate a 64-char random hex)
SESSION_SECRET=your_64_char_hex_secret

# Admin password (bcrypt hash)
ADMIN_PASSWORD_HASH=your_bcrypt_hash

# SMTP — for OTP password reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password      # Gmail: use App Password, not regular password
SMTP_FROM="ATOM 2K26 <your@gmail.com>"
```

> **Gmail App Password:** account.google.com → Security → 2-Step Verification → App Passwords

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/signup` | `name, email, mobile, password, college` | Register new user |
| `POST` | `/login` | `email, password` | Login, creates session |
| `POST` | `/logout` | — | Destroy session |
| `GET`  | `/session` | — | Check current session |
| `POST` | `/forgot-password` | `email` | Send 6-digit OTP via email |
| `POST` | `/verify-otp` | `email, otp` | Verify OTP (valid 10 min) |
| `POST` | `/reset-password` | `email, otp, newPassword` | Reset password after OTP |

#### Password Rules
- Min 8 characters
- At least 1 uppercase, 1 number, 1 special character

### Events — `/api/events`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register for an event (auth required) |
| `GET`  | `/my` | Get current user's registrations |

### Admin — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Admin login (password from `.env`) |
| `GET`  | `/users` | List all users |
| `GET`  | `/registrations` | List all event registrations |

---

## Project Structure

```
atom_bknd/
├── config/
│   ├── db.js              # MongoDB connection
│   └── mailer.js          # Nodemailer SMTP transporter
├── controllers/
│   ├── authController.js  # Signup, login, logout, OTP reset
│   ├── eventController.js # Event registration & profile
│   └── adminController.js # Admin dashboard
├── middleware/
│   ├── authGuard.js       # Session-based route protection
│   └── errorHandler.js    # Global error handler
├── models/
│   ├── User.js            # User schema
│   └── Registration.js    # Event registration schema
├── routes/
│   ├── auth.js            # /api/auth/*
│   ├── events.js          # /api/events/*
│   └── admin.js           # /api/admin/*
├── utils/
│   └── otpStore.js        # In-memory OTP store (10-min TTL)
├── public/                # Frontend (HTML, CSS, JS, assets)
├── server.js              # Entry point
├── Dockerfile
├── docker-compose.yml
└── .env                   # Local config (never commit this)
```

---

## OTP Password Reset Flow

```
User → "Forgot Password?" → Enter Email
     → POST /forgot-password → OTP emailed (expires 10 min)
     → Enter OTP on site
     → POST /verify-otp → verified
     → Enter new password
     → POST /reset-password → password updated, OTP consumed
     → Login with new password
```

---

## Pages

| URL | Description |
|---|---|
| `/` | Homepage |
| `/home.html` | Main landing |
| `/events.html` | Event listing |
| `/event-details.html?event=<slug>` | Event detail page |
| `/login.html` | Login + OTP password reset |
| `/signin.html` | Register new account |
| `/about.html` | About page |
| `/contacts.html` | Contact page |

---

## Troubleshooting

**Port 3000 in use:**
```bash
sudo fuser -k 3000/tcp
```

**MongoDB won't connect:**
```bash
sudo systemctl status mongod        # local
docker-compose logs mongo           # docker
```

**SMTP email not sending:**
- Ensure `SMTP_PASS` is a Gmail **App Password**, not your regular password
- Gmail requires 2FA enabled before App Passwords can be generated
- Restart the server after editing `.env` (nodemon doesn't auto-reload `.env`)

**Reset all data:**
```bash
docker-compose down -v && docker-compose up -d     # docker
mongosh atom2k26 --eval "db.dropDatabase()"        # local
```

---

MIT © IEEE Student Chapter — PSG College of Technology
