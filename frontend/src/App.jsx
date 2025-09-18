import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotePage from "./pages/NotePage";
import NotesList from "./pages/NotesList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NotesList />} />
        <Route path="/note" element={<NotePage />} />
        <Route path="/note/:id" element={<NotePage />} />
      </Routes>
    </Router>
  );
}

export default App;
