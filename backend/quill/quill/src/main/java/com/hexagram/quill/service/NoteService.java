package com.hexagram.quill.service;

import com.hexagram.quill.dto.NoteDTO;
import com.hexagram.quill.entity.Note;
import com.hexagram.quill.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    /**
     * Retrieves a paginated list of notes. If a search term is provided, it filters
     * notes by title or content using a custom JPQL query. Otherwise, it returns
     * all
     * notes sorted by the last update time (most recently updated first).
     *
     * @param searchTerm The term to search for in note titles and content. Can be
     *                   null or empty.
     * @param pageable   Pagination and sorting information.
     * @return A page of notes.
     */
    public Page<Note> getAllNotes(String searchTerm, Pageable pageable) {
        return getAllNotes(searchTerm, pageable, false, false, false);
    }

    /**
     * Retrieves a paginated list of notes with optional filtering.
     *
     * @param searchTerm The term to search for in note titles and content. Can be
     *                   null or empty.
     * @param pageable   Pagination and sorting information.
     * @param archived   Filter by archived status (true = only archived, false =
     *                   all)
     * @param starred    Filter by starred status (true = only starred, false = all)
     * @param deleted    Filter by deleted status (true = only deleted, false = all)
     * @return A page of notes.
     */
    public Page<Note> getAllNotes(String searchTerm, Pageable pageable, boolean archived, boolean starred,
            boolean deleted) {
        // Ensure consistent sorting by updatedAt desc when no custom sorting is
        // provided
        Pageable finalPageable = ensureDefaultSorting(pageable);

        // Handle deleted notes filter
        if (deleted) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                return noteRepository.findDeletedNotesBySearchTerm(searchTerm.trim(), finalPageable);
            }
            return noteRepository.findByDeletedTrueOrderByUpdatedAtDesc(finalPageable);
        }

        // Handle archived notes filter
        if (archived) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                return noteRepository.findArchivedNotesBySearchTerm(searchTerm.trim(), finalPageable);
            }
            return noteRepository.findByArchivedTrueAndDeletedFalseOrderByUpdatedAtDesc(finalPageable);
        }

        // Handle starred notes filter
        if (starred) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                return noteRepository.findStarredNotesBySearchTerm(searchTerm.trim(), finalPageable);
            }
            return noteRepository.findByStarredTrueAndDeletedFalseOrderByUpdatedAtDesc(finalPageable);
        }

        // Default: return active notes (not deleted, not archived)
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            // For active notes with search, we need to filter out archived and deleted
            return noteRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
                    searchTerm.trim(), finalPageable);
        }

        // Return active notes (not deleted, not archived)
        return noteRepository.findByDeletedFalseAndArchivedFalseOrderByUpdatedAtDesc(finalPageable);
    }

    /**
     * Ensures that pagination requests have a default sorting by updatedAt desc if
     * no sorting is specified.
     * This provides consistent ordering across all note listings.
     *
     * @param pageable The original pageable
     * @return A pageable with default sorting if none was specified
     */
    private Pageable ensureDefaultSorting(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return PageRequest.of(
                    pageable.getPageNumber(),
                    pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "updatedAt"));
        }
        return pageable;
    }

    /**
     * Creates and saves a new note.
     *
     * @param note The note object to be created.
     * @return The saved note with its generated ID and timestamps.
     */
    public Note createNote(Note note) {
        // Ensure createdAt is set by JPA/Hibernate
        return noteRepository.save(note);
    }

    /**
     * Retrieves a single note by its ID.
     *
     * @param id The ID of the note.
     * @return The note object wrapped in Optional.
     */
    public Optional<Note> getNoteById(Long id) {
        return noteRepository.findById(id);
    }

    /**
     * Retrieves a single note by its ID or throws an exception if not found.
     *
     * @param id The ID of the note.
     * @return The note object.
     * @throws NoteNotFoundException if note not found.
     */
    public Note getNoteByIdOrThrow(Long id) {
        return getNoteById(id)
                .orElseThrow(() -> new NoteNotFoundException("Note not found with id: " + id));
    }

    /**
     * Updates an existing note.
     *
     * @param id          The ID of the note to update.
     * @param noteDetails The note object with updated details.
     * @return The updated note.
     * @throws NoteNotFoundException if note not found.
     */
    public Note updateNote(Long id, Note noteDetails) {
        Note existingNote = getNoteByIdOrThrow(id);

        // Update fields
        existingNote.setTitle(noteDetails.getTitle());
        existingNote.setContent(noteDetails.getContent());
        existingNote.setCategory(noteDetails.getCategory());

        // `updatedAt` will be automatically handled by @UpdateTimestamp
        return noteRepository.save(existingNote);
    }

    /**
     * Deletes a note by its ID (soft delete - marks as deleted).
     *
     * @param id The ID of the note to delete.
     * @throws NoteNotFoundException if note not found.
     */
    public void deleteNote(Long id) {
        Note note = getNoteByIdOrThrow(id);
        note.setDeleted(true);
        noteRepository.save(note);
    }

    /**
     * Archives a note by its ID.
     *
     * @param id The ID of the note to archive.
     * @throws NoteNotFoundException if note not found.
     */
    public void archiveNote(Long id) {
        Note note = getNoteByIdOrThrow(id);
        note.setArchived(true);
        noteRepository.save(note);
    }

    /**
     * Unarchives a note by its ID.
     *
     * @param id The ID of the note to unarchive.
     * @throws NoteNotFoundException if note not found.
     */
    public void unarchiveNote(Long id) {
        Note note = getNoteByIdOrThrow(id);
        note.setArchived(false);
        noteRepository.save(note);
    }

    /**
     * Restores a deleted note by its ID.
     *
     * @param id The ID of the note to restore.
     * @throws NoteNotFoundException if note not found.
     */
    public void restoreNote(Long id) {
        Note note = getNoteByIdOrThrow(id);
        note.setDeleted(false);
        noteRepository.save(note);
    }

    /**
     * Permanently deletes a note by its ID (hard delete).
     *
     * @param id The ID of the note to permanently delete.
     * @throws NoteNotFoundException if note not found.
     */
    public void permanentDeleteNote(Long id) {
        if (!noteRepository.existsById(id)) {
            throw new NoteNotFoundException("Note not found with id: " + id);
        }
        noteRepository.deleteById(id);
    }

    /**
     * Toggles the starred status of a note.
     *
     * @param id The ID of the note to toggle.
     * @throws NoteNotFoundException if note not found.
     */
    public void toggleStar(Long id) {
        Note note = getNoteByIdOrThrow(id);
        note.setStarred(!note.getStarred());
        noteRepository.save(note);
    }

    /**
     * Toggles the pinned status of a note.
     *
     * @param id The ID of the note to toggle.
     * @throws NoteNotFoundException if note not found.
     */
    public void togglePin(Long id) {
        Note note = getNoteByIdOrThrow(id);
        note.setIsPinned(!note.getIsPinned());
        noteRepository.save(note);
    }

    /**
     * Custom exception for when a note is not found
     */
    public static class NoteNotFoundException extends RuntimeException {
        public NoteNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Counts the total number of notes (useful for statistics)
     *
     * @return The total number of notes in the database
     */
    public long countAllNotes() {
        return noteRepository.count();
    }

    /**
     * Counts the number of notes for a specific category
     *
     * @param category The category to count
     * @return The number of notes in the specified category
     */
    public long countNotesByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return 0;
        }
        return noteRepository.countByCategoryIgnoreCase(category.trim());
    }

    /**
     * Convert Note entity to NoteDTO
     */
    public NoteDTO convertToDTO(Note note) {
        NoteDTO dto = new NoteDTO();
        dto.setId(note.getId());
        dto.setTitle(note.getTitle());
        dto.setContent(note.getContent());
        dto.setCategory(note.getCategory());
        dto.setStarred(note.getStarred());
        dto.setArchived(note.getArchived());
        dto.setDeleted(note.getDeleted());
        dto.setIsPinned(note.getIsPinned());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setUpdatedAt(note.getUpdatedAt());

        return dto;
    }

    /**
     * Convert NoteDTO to Note entity
     */
    public Note convertToEntity(NoteDTO dto) {
        Note note = new Note();
        note.setId(dto.getId());
        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        note.setCategory(dto.getCategory());
        note.setStarred(dto.getStarred());
        note.setArchived(dto.getArchived());
        note.setDeleted(dto.getDeleted());
        note.setIsPinned(dto.getIsPinned());

        return note;
    }

    /**
     * Convert Page<Note> to Page<NoteDTO>
     */
    public Page<NoteDTO> convertToDTOPage(Page<Note> notePage) {
        return notePage.map(this::convertToDTO);
    }
}