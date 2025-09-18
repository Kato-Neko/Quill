import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import NotePage from "./pages/NotePage";
import NotesList from "./pages/NotesList";

function App() {
  return (
    <Router>
      <nav className="flex gap-4 p-4 bg-gray-100 shadow">
        <Link to="/" className="text-blue-600">Notes List</Link>
        <Link to="/note" className="text-blue-600">Note Page</Link>
      </nav>

      <Routes>
        <Route path="/" element={<NotesList />} />
        <Route path="/note" element={<NotePage />} />
      </Routes>
    </Router>
  );
}

export default App;
