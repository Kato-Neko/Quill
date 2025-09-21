import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotePage from "./pages/NotePage";
import NotesList from "./pages/NotesList";
import ArchivePage from "./pages/ArchivePage";
import TrashPage from "./pages/TrashPage";
import FavoritesPage from "./pages/FavoritesPage";
import TodoListPage from "./pages/TodoListPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NotesList />} />
        <Route path="/note" element={<NotePage />} />
        <Route path="/note/:id" element={<NotePage />} />
        <Route path="/todo-lists" element={<TodoListPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
