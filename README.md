# Quill - Notes Application

A modern, full-stack notes application built with React, Spring Boot, and MySQL. Create, edit, search, and organize your notes with a clean, intuitive interface.

## 🚀 Tech Stack

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation

### Backend
- **Spring Boot** (Java)
- **Spring Data JPA** for database operations
- **MySQL** database
- **Maven** for dependency management

### Development Tools
- **Git** for version control
- **Postman** for API testing
- **Trello** for project management

## 📁 Project Structure

```
quill/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service calls
│   │   └── styles/         # CSS and styling
│   ├── public/
│   └── package.json
├── backend/                  # Spring Boot application
│   ├── src/main/java/
│   │   ├── controller/     # REST controllers
│   │   ├── entity/         # JPA entities
│   │   ├── repository/     # Data repositories
│   │   └── service/        # Business logic
│   ├── src/main/resources/
│   └── pom.xml
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **Java** (JDK 11 or higher)
- **Maven** (v3.6 or higher)
- **MySQL** (v8.0 or higher)
- **Git**

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
cd backend
```

1. Configure database connection in `src/main/resources/application.properties`:
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/notes_db
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Server Configuration
server.port=8080
```

2. Install dependencies and run:
```bash
mvn clean install
mvn spring-boot:run
```

The backend server will start on `http://localhost:8080`

### 4. Frontend Setup
```bash
cd frontend
```

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🔌 API Endpoints

### Notes Management
- `GET /api/notes` - Retrieve all notes (with pagination)
- `POST /api/notes` - Create a new note
- `GET /api/notes/{id}` - Get a specific note
- `PUT /api/notes/{id}` - Update a note
- `DELETE /api/notes/{id}` - Delete a note
- `GET /api/notes/search?query={searchTerm}` - Search notes

### Example API Usage

#### Create a Note
```bash
curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "This is the content of my note",
    "category": "Personal"
  }'
```

#### Get All Notes
```bash
curl http://localhost:8080/api/notes
```

#### Search Notes
```bash
curl "http://localhost:8080/api/notes/search?query=meeting"
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
mvn test
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### API Testing with Postman
1. Import the provided Postman collection (if available)
2. Test all CRUD operations
3. Verify search functionality
4. Test error handling scenarios

## 👥 Development Team

- **Nick Carter Lacanglacang** - Project Lead & Setup
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

### Phase 2: Core Development 🔄
#### Frontend
- Initialize frontend boilerplate
- Create basic routing (NotePage, NotesList)
- Create Note Page UI (create, edit, delete buttons)
- Create Results Page UI (list + search)

#### Backend
- Initialize backend boilerplate
- Initialize Spring Boot project configuration
- Create Note entity + repository
- Implement POST /api/notes
- Implement GET /api/notes + search functionality
- Test APIs with Postman

#### Database
- Create notes_db in MySQL
- Configure MySQL connection in Spring Boot
- Verify schema (table auto-created by JPA)
- Insert sample data manually for testing

### Phase 3: Integration 📋
- Connect frontend Note Page → POST API
- Connect Results Page → GET API
- Verify notes persist in MySQL
- Test with multiple scenarios

### Phase 4: Testing and Bug Fixes 🐛
- Comprehensive testing of all features
- Bug identification and tracking
- Fix assigned bugs

## 🚀 Features

- ✅ **Create Notes** - Add new notes with title, content, and categories
- ✅ **View Notes** - Browse all notes in a clean, organized interface
- ✅ **Search Notes** - Find notes quickly using search functionality
- ✅ **Edit Notes** - Update existing notes seamlessly
- ✅ **Delete Notes** - Remove notes you no longer need


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
- Contact the development team

---

**Happy coding! 🎉**