# Quill - Notes dApp (Cardano)

A full-stack notes app with on-chain recording of note actions. The frontend is React (Vite) with Mesh SDK + Koios for Cardano transactions; the backend is Spring Boot + MySQL for fast local caching of notes and transaction metadata. Wallet connection acts as authentication (no username/password).

## 🚀 Tech Stack

### Frontend
- React (Vite), Tailwind, shadcn/ui, React Router
- Mesh SDK (@meshsdk/core) for building/signing/submitting Cardano txs
- Koios (via backend proxy) for balance/tx info; Blockfrost is optional

### Backend
- Spring Boot (Java), Spring Data JPA, MySQL
- Exposes REST for notes + blockchain transaction records
- Koios proxy endpoints for tx/balance/address history

### Authentication
- Wallet integration only (no login/signup). Connecting a Cardano wallet (e.g., Lace) is the auth gate.

## 📁 Project Structure (high level)

```
quill/
├── frontend/                    # React app (Mesh SDK + Koios)
│   └── src/
│       ├── contexts/WalletContext.jsx  # wallet, tx building, polling
│       ├── lib/transactionBuilder.js   # Mesh tx build/sign/submit + metadata
│       ├── components/TransactionLedger.jsx
│       └── pages/NotePage.jsx
├── backend/                     # Spring Boot app
│   └── src/main/java/com/hexagram/quill
│       ├── controller/NoteController.java
│       ├── controller/BlockchainTransactionController.java
│       ├── controller/KoiosProxyController.java
│       ├── entity/Note.java
│       ├── entity/BlockchainTransaction.java
│       └── service/NoteService.java
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Java 17+ (Spring Boot)
- Maven 3.6+
- MySQL 8+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/quill.git
cd quill
```

### 2. Database Setup
1. Install and start MySQL
2. Create a new database:
```sql
CREATE DATABASE notes_db;
```
3. Create a MySQL user (optional):
```sql
CREATE USER 'quill_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON notes_db.* TO 'quill_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Backend Setup
```bash
cd backend/quill
```
Configure `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/notes_db
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
server.port=8080
```
Run:
```bash
mvn clean install
mvn spring-boot:run
```
Backend: `http://localhost:8080`

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:5173`

Environment (frontend):
- `VITE_API_URL=http://localhost:8080/api` (default fallback)

Environment (Koios proxy is built-in backend):
- No extra keys required for preview/preprod/mainnet public Koios.
- Blockfrost is optional and not required for current flow.

## 🔌 Key API Endpoints (backend)

- Notes: `GET/POST/PUT/PATCH/DELETE /api/notes`
- Note status update: `PATCH /api/notes/{id}/status?status=pending|confirmed&txHash=...`
- Blockchain txs: `GET/POST/PUT/PATCH /api/blockchain-transactions`
- Koios proxy:
  - `POST /api/koios/address-info`
  - `POST /api/koios/address-txs`
  - `POST /api/koios/tx-info`

## 🧭 Blockchain behavior (what matters)

- Wallet-only auth; no login/signup.
- On create/update/delete, frontend builds/signs/submits a real Cardano tx via Mesh SDK; includes metadata labels 674 and 1337 with note details and chunked content (64-byte safe).
- Notes are saved locally with `status: pending`, `txHash`, `walletAddress`, `network` so the UI is instant while chain confirms.
- Client background poll (every ~20s) uses Koios `tx_info` via backend proxy to flip pending → confirmed and backfill fee; confirmed txs are stored in `blockchain_transactions`.
- Transaction Ledger UI shows pending and “Fee pending…” until the fee is fetched; links to Cardanoscan per network.
- Blockfrost is optional; current implementation uses Koios. Blaze is not used—Mesh SDK is the tx builder.

## 🧪 Testing
- Backend: `cd backend/quill && mvn test`
- Frontend: `cd frontend && npm run test`
- Manual: use a Cardano wallet (e.g., Lace) on Preview and perform note create/update/delete; watch Transaction Ledger for pending → confirmed and fee backfill.

## 👥 Development Team

- **Nick Carter Lacanglacang** - Project Lead & Full-Stack Developer
- **Franco Magno** - Database Lead & Integration
- **Rigel Baltazar** - Backend Developer
- **Joshua Pusing** - Backend Developer
- **Jermaine Gadiano** - Frontend Developer
- **Katrina Amores** - QA, Integration Testing & Documentation

## 📋 Development Phases

### Phase 1: Setup ✅
- Create GitHub repository with frontend and backend folders
- Configure .gitignore for node_modules + target
- Set up shared README.md (project instructions)

### Phase 2+: Core dApp Work (summary)
- Wallet connect (Mesh) replaces login/signup.
- Cardano tx integration for note create/update/delete with metadata + chunking.
- Pending/confirmed status model with local DB caching; tx ledger UI.
- Koios proxy + client polling for confirmations and fee backfill.

## 🚀 Features

- ✅ Create/Update/Delete notes with Cardano transactions and on-chain metadata
- ✅ Wallet-only auth (no login/signup)
- ✅ Pending/confirmed status with fast local cache (MySQL)
- ✅ Transaction Ledger with fee backfill and explorer links
- ✅ Search, archive, pin, star, delete, restore


## 📝 Git Workflow - IMPORTANT!

### Branch Rules
- **Setup Phase Only**: Nick can push directly to main for initial setup
- **All Other Work**: MUST be done on separate branches first, then merged

### Step-by-Step Process


1. **Work on your feature and commit changes**

2. **IMPORTANT - Commit Message Rule**: 
   **Copy and paste the EXACT Trello card title as your commit message**
   ```bash
   git commit -m "Create basic routing (NotePage, NotesList)"
   git commit -m "Implement POST /api/notes"
   git commit -m "Configure MySQL connection in Spring Boot"
   ```

3. **Push your branch**:
   ```bash
   git push origin feature/your-trello-card-title
   ```

4. **Create Pull Request** and request review from Nick or Katrina (You can proceed to merge if you feel confident enough.)

5. **After approval**: Merge to main

### Example Workflow:
```bash
# 1. Create branch (use exact Trello card title)
git checkout -b "Create Note Page UI (create, edit, delete buttons)"

# 2. Work on your code...

# 3. Commit with EXACT card title
git commit -m "Create Note Page UI (create, edit, delete buttons)"

# 4. Push branch
git push origin "Create Note Page UI (create, edit, delete buttons)"

# 5. Create PR on GitHub
```

**Remember**: Always use the exact Trello card title for both branch names and commit messages!

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
- Check MySQL is running
- Verify database credentials in `application.properties`
- Ensure correct Java version (JDK 11+)

#### Frontend build fails
- Delete `node_modules` and run `npm install` again
- Check Node.js version (v16+)
- Clear npm cache: `npm cache clean --force`

#### Database connection issues
- Verify MySQL service is running
- Check database name and credentials
- Ensure MySQL port 3306 is not blocked

#### CORS errors
- Verify CORS configuration in Spring Boot
- Check frontend API base URL configuration

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions:
- Check the troubleshooting section above
- Create an issue in the GitHub repository
- Contact the development team. Send an email to nickcarter.lacang@gmail.com.

---

**Happy coding! 🎉**