package com.hexagram.quill.controller;

import com.hexagram.quill.dto.NoteDTO;
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
@CrossOrigin(origins = { "http://localhost:5173", "http://127.0.0.1:5173" })
public class NoteController {

    @Autowired
    private NoteService noteService;

    /**
     * Get all notes with optional search, filtering, and pagination.
     * 
     * @param search   Optional search term
     * @param archived Filter by archived status
     * @param starred  Filter by starred status
     * @param deleted  Filter by deleted status
     * @param pageable Spring Data Pageable object for pagination and sorting
     * @return Page of notes
     */
    @GetMapping
    public ResponseEntity<Page<NoteDTO>> getAllNotes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean archived,
            @RequestParam(required = false) Boolean starred,
            @RequestParam(required = false) Boolean deleted,
            Pageable pageable) {

        // Use the search parameter directly from @RequestParam
        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        // Convert Boolean parameters to boolean primitives with default false
        boolean archivedFilter = archived != null ? archived : false;
        boolean starredFilter = starred != null ? starred : false;
        boolean deletedFilter = deleted != null ? deleted : false;

        Page<Note> notes = noteService.getAllNotes(searchTerm, pageable, archivedFilter, starredFilter, deletedFilter);
        Page<NoteDTO> noteDTOs = noteService.convertToDTOPage(notes);
        return ResponseEntity.ok(noteDTOs);
    }

    /**
     * Search notes by title or content with optional filtering.
     * 
     * @param searchTerm The search query
     * @param archived   Filter by archived status
     * @param starred    Filter by starred status
     * @param deleted    Filter by deleted status
     * @param pageable   Pagination information
     * @return Page of matching notes
     */
    @GetMapping("/search")
    public ResponseEntity<Page<NoteDTO>> searchNotes(
            @RequestParam(name = "query") String searchTerm,
            @RequestParam(required = false) Boolean archived,
            @RequestParam(required = false) Boolean starred,
            @RequestParam(required = false) Boolean deleted,
            Pageable pageable) {

        // Convert Boolean parameters to boolean primitives with default false
        boolean archivedFilter = archived != null ? archived : false;
        boolean starredFilter = starred != null ? starred : false;
        boolean deletedFilter = deleted != null ? deleted : false;

        Page<Note> notes = noteService.getAllNotes(searchTerm, pageable, archivedFilter, starredFilter, deletedFilter);
        Page<NoteDTO> noteDTOs = noteService.convertToDTOPage(notes);
        return ResponseEntity.ok(noteDTOs);
    }

    /**
     * Create a new note.
     * 
     * @param noteDTO The note to create
     * @return The created note with 201 status
     */
    @PostMapping
    public ResponseEntity<NoteDTO> createNote(@Valid @RequestBody NoteDTO noteDTO) {
        Note note = noteService.convertToEntity(noteDTO);
        Note createdNote = noteService.createNote(note);
        NoteDTO createdNoteDTO = noteService.convertToDTO(createdNote);
        return new ResponseEntity<>(createdNoteDTO, HttpStatus.CREATED);
    }

    /**
     * Get a single note by ID.
     * 
     * @param id The note ID
     * @return The note or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<NoteDTO> getNoteById(@PathVariable Long id) {
        return noteService.getNoteById(id)
                .map(note -> {
                    NoteDTO noteDTO = noteService.convertToDTO(note);
                    return ResponseEntity.ok(noteDTO);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update an existing note.
     * 
     * @param id      The note ID
     * @param noteDTO The updated note data
     * @return The updated note or 404 if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<NoteDTO> updateNote(@PathVariable Long id, @Valid @RequestBody NoteDTO noteDTO) {
        try {
            Note noteDetails = noteService.convertToEntity(noteDTO);
            Note updatedNote = noteService.updateNote(id, noteDetails);
            NoteDTO updatedNoteDTO = noteService.convertToDTO(updatedNote);
            return ResponseEntity.ok(updatedNoteDTO);
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
     * Archive a note by ID.
     * 
     * @param id The note ID to archive
     * @return 204 No Content on success, 404 if not found
     */
    @PostMapping("/{id}/archive")
    public ResponseEntity<Void> archiveNote(@PathVariable Long id) {
        try {
            noteService.archiveNote(id);
            return ResponseEntity.noContent().build();
        } catch (NoteService.NoteNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Unarchive a note by ID.
     * 
     * @param id The note ID to unarchive
     * @return 204 No Content on success, 404 if not found
     */
    @PostMapping("/{id}/unarchive")
    public ResponseEntity<Void> unarchiveNote(@PathVariable Long id) {
        try {
            noteService.unarchiveNote(id);
            return ResponseEntity.noContent().build();
        } catch (NoteService.NoteNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Restore a deleted note by ID.
     * 
     * @param id The note ID to restore
     * @return 204 No Content on success, 404 if not found
     */
    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restoreNote(@PathVariable Long id) {
        try {
            noteService.restoreNote(id);
            return ResponseEntity.noContent().build();
        } catch (NoteService.NoteNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Permanently delete a note by ID.
     * 
     * @param id The note ID to permanently delete
     * @return 204 No Content on success, 404 if not found
     */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentDeleteNote(@PathVariable Long id) {
        try {
            noteService.permanentDeleteNote(id);
            return ResponseEntity.noContent().build();
        } catch (NoteService.NoteNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Toggle star status of a note by ID.
     * 
     * @param id The note ID to toggle star status
     * @return 204 No Content on success, 404 if not found
     */
    @PostMapping("/{id}/star")
    public ResponseEntity<Void> toggleStar(@PathVariable Long id) {
        try {
            noteService.toggleStar(id);
            return ResponseEntity.noContent().build();
        } catch (NoteService.NoteNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Toggle pin status of a note by ID.
     * 
     * @param id The note ID to toggle pin status
     * @return 204 No Content on success, 404 if not found
     */
    @PostMapping("/{id}/pin")
    public ResponseEntity<Void> togglePin(@PathVariable Long id) {
        try {
            noteService.togglePin(id);
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