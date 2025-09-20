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

    /**
     * Retrieves a single note by its ID.
     *
     * @param id The ID of the note.
     * @return The note object.
     * @throws java.util.NoSuchElementException if note not found.
     */
    public Note getNoteById(Long id) {
        return noteRepository.findById(id).orElseThrow();
    }

    /**
     * Updates an existing note.
     *
     * @param id The ID of the note to update.
     * @param noteDetails The note object with updated details.
     * @return The updated note.
     * @throws java.util.NoSuchElementException if note not found.
     */
    public Note updateNote(Long id, Note noteDetails) {
        Note note = getNoteById(id);
        note.setTitle(noteDetails.getTitle());
        note.setContent(noteDetails.getContent());
        // `updatedAt` will be handled by @UpdateTimestamp
        return noteRepository.save(note);
    }

    /**
     * Deletes a note by its ID.
     *
     * @param id The ID of the note to delete.
     */
    public void deleteNote(Long id) {
        noteRepository.deleteById(id);
    }
}
