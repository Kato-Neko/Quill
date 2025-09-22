import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotePage from "./pages/NotePage";
import NotesList from "./pages/NotesList";
import ArchivePage from "./pages/ArchivePage";
import TrashPage from "./pages/TrashPage";
import FavoritesPage from "./pages/FavoritesPage";
// Standalone TodoListPage removed in hybrid setup

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NotesList />} />
        <Route path="/note" element={<NotePage />} />
        <Route path="/note/:id" element={<NotePage />} />
        {/* /todo-lists route removed */}
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
