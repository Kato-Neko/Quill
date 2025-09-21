package com.hexagram.quill.controller;

import com.hexagram.quill.entity.Note;
import com.hexagram.quill.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class NoteController {

    @Autowired
    private NoteService noteService;

    /**
     * Get all notes with optional search and pagination.
     * 
     * @param pageable Spring Data Pageable object for pagination and sorting
     * @return Page of notes
     */
    @GetMapping
    public ResponseEntity<Page<Note>> getAllNotes(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        
        // Use the search parameter directly from @RequestParam
        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        
        Page<Note> notes = noteService.getAllNotes(searchTerm, pageable);
        return ResponseEntity.ok(notes);
    }

    /**
     * Search notes by title or content.
     * 
     * @param searchTerm The search query
     * @param pageable   Pagination information
     * @return Page of matching notes
     */
    @GetMapping("/search")
    public ResponseEntity<Page<Note>> searchNotes(
            @RequestParam(name = "query") String searchTerm,
            Pageable pageable) {
        Page<Note> notes = noteService.getAllNotes(searchTerm, pageable);
        return ResponseEntity.ok(notes);
    }

    /**
     * Create a new note.
     * 
     * @param note The note to create
     * @return The created note with 201 status
     */
    @PostMapping
    public ResponseEntity<Note> createNote(@Valid @RequestBody Note note) {
        Note createdNote = noteService.createNote(note);
        return new ResponseEntity<>(createdNote, HttpStatus.CREATED);
    }

    /**
     * Get a single note by ID.
     * 
     * @param id The note ID
     * @return The note or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable Long id) {
        return noteService.getNoteById(id)
            .map(note -> ResponseEntity.ok(note))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update an existing note.
     * 
     * @param id The note ID
     * @param noteDetails The updated note data
     * @return The updated note or 404 if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @Valid @RequestBody Note noteDetails) {
        try {
            Note updatedNote = noteService.updateNote(id, noteDetails);
            return ResponseEntity.ok(updatedNote);
        } catch (NoteService.NoteNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a note by ID.
     * 
     * @param id The note ID
     * @return 204 No Content on success, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        try {
            noteService.deleteNote(id);
            return ResponseEntity.noContent().build();
        } catch (NoteService.NoteNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get notes statistics (optional endpoint)
     * 
     * @return Basic statistics about notes
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalNotes", noteService.countAllNotes());
        
        // Add category counts if you implement the repository method
        // stats.put("byCategory", getCategoryCounts());
        
        return ResponseEntity.ok(stats);
    }
}