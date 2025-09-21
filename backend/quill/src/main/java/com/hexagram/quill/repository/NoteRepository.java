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
     * 
     * @param searchTerm the term to search for in both title and content
     * @param pageable pagination information
     * @return a page of notes matching the search criteria
     */
    @Query("SELECT n FROM Note n WHERE " +
           "LOWER(n.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(n.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Note> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
        @Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Find all notes ordered by update date (most recently updated first)
     * 
     * @param pageable pagination information
     * @return page of notes ordered by update date descending
     */
    Page<Note> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * Count notes by category (case-insensitive)
     * 
     * @param category the category to count
     * @return number of notes in the specified category
     */
    long countByCategoryIgnoreCase(String category);

    /**
     * Find notes by category (case-insensitive)
     * 
     * @param category the category to filter by
     * @param pageable pagination information
     * @return page of notes in the specified category
     */
    Page<Note> findByCategoryIgnoreCase(String category, Pageable pageable);
}