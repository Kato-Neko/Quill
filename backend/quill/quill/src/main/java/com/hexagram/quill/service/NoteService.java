package com.hexagram.quill.service;

import com.hexagram.quill.entity.Note;
import com.hexagram.quill.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    /**
     * Retrieves a paginated list of notes. If a search term is provided, it filters
     * notes by title or content. Otherwise, it returns all notes sorted by the last
     * update time.
     *
     * @param searchTerm The term to search for in note titles and content. Can be null.
     * @param pageable   Pagination and sorting information.
     * @return A page of notes.
     */
    public Page<Note> getAllNotes(String searchTerm, Pageable pageable) {
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            return noteRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(searchTerm, searchTerm, pageable);
        }
        return noteRepository.findAllByOrderByUpdatedAtDesc(pageable);
    }

    /**
     * Creates and saves a new note.
     *
     * @param note The note object to be created.
     * @return The saved note with its generated ID and timestamps.
     */
    public Note createNote(Note note) {
        return noteRepository.save(note);
    }
}
