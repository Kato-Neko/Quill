package com.hexagram.quill.repository;

import com.hexagram.quill.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    
    /**
     * Search notes by title or content containing the search term (case-insensitive)
     * @param searchTerm the term to search for
     * @return list of notes matching the search criteria
     */
    Page<Note> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content, Pageable pageable);

    // The List-based search is also possible with a derived query if needed
    // List<Note> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content);

    /**
     * Find notes by title containing the search term (case-insensitive)
     * @param title the title to search for
     * @return list of notes with matching titles
     */
    List<Note> findByTitleContainingIgnoreCase(String title);
    
    /**
     * Find notes by content containing the search term (case-insensitive)
     * @param content the content to search for
     * @return list of notes with matching content
     */
    List<Note> findByContentContainingIgnoreCase(String content);
    
    /**
     * Find all notes ordered by creation date (newest first)
     * @return list of notes ordered by creation date descending
     */
    List<Note> findAllByOrderByCreatedAtDesc();
    
    /**
     * Find all notes with pagination ordered by creation date (newest first)
     * @param pageable pagination information
     * @return page of notes ordered by creation date descending
     */
    Page<Note> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * Find all notes ordered by update date (most recently updated first)
     * @return list of notes ordered by update date descending
     */
    List<Note> findAllByOrderByUpdatedAtDesc();
    
    /**
     * Find all notes with pagination ordered by update date (most recently updated first)
     * @param pageable pagination information
     * @return page of notes ordered by update date descending
     */

    Page<Note> findAllByOrderByUpdatedAtDesc(Pageable pageable);
}
