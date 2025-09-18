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

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @GetMapping
    public ResponseEntity<Page<Note>> getAllNotes(
            Pageable pageable) {
        // This endpoint now only fetches all notes, without searching.
        Page<Note> notes = noteService.getAllNotes(null, pageable);
        return ResponseEntity.ok(notes);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Note>> searchNotes(
            @RequestParam(name = "query") String searchTerm,
            Pageable pageable) {
        Page<Note> notes = noteService.getAllNotes(searchTerm, pageable);
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<Note> createNote(@Valid @RequestBody Note note) {
        Note createdNote = noteService.createNote(note);
        return new ResponseEntity<>(createdNote, HttpStatus.CREATED);
    }
}
