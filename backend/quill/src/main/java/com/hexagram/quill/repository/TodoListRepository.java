package com.hexagram.quill.repository;

import com.hexagram.quill.entity.TodoList;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TodoListRepository extends JpaRepository<TodoList, Long> {

    /**
     * Search todo lists by title or category containing the search term
     * (case-insensitive)
     * 
     * @param searchTerm the term to search for in both title and category
     * @param pageable   pagination information
     * @return a page of todo lists matching the search criteria
     */
    @Query("SELECT t FROM TodoList t WHERE " +
            "LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<TodoList> findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            @Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Find all todo lists ordered by update date (most recently updated first)
     * 
     * @param pageable pagination information
     * @return page of todo lists ordered by update date descending
     */
    Page<TodoList> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * Count todo lists by category (case-insensitive)
     * 
     * @param category the category to count
     * @return number of todo lists in the specified category
     */
    long countByCategoryIgnoreCase(String category);

    /**
     * Find todo lists by category (case-insensitive)
     * 
     * @param category the category to filter by
     * @param pageable pagination information
     * @return page of todo lists in the specified category
     */
    Page<TodoList> findByCategoryIgnoreCase(String category, Pageable pageable);

    /**
     * Find archived todo lists (not deleted)
     * 
     * @param pageable pagination information
     * @return page of archived todo lists
     */
    Page<TodoList> findByArchivedTrueAndDeletedFalseOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * Find starred todo lists (not deleted)
     * 
     * @param pageable pagination information
     * @return page of starred todo lists
     */
    Page<TodoList> findByStarredTrueAndDeletedFalseOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * Find deleted todo lists
     * 
     * @param pageable pagination information
     * @return page of deleted todo lists
     */
    Page<TodoList> findByDeletedTrueOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * Find active todo lists (not deleted, not archived)
     * 
     * @param pageable pagination information
     * @return page of active todo lists
     */
    Page<TodoList> findByDeletedFalseAndArchivedFalseOrderByUpdatedAtDesc(Pageable pageable);

    /**
     * Search archived todo lists by title or category
     * 
     * @param searchTerm the term to search for
     * @param pageable   pagination information
     * @return page of matching archived todo lists
     */
    @Query("SELECT t FROM TodoList t WHERE " +
            "t.archived = true AND t.deleted = false AND " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<TodoList> findArchivedTodoListsBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Search starred todo lists by title or category
     * 
     * @param searchTerm the term to search for
     * @param pageable   pagination information
     * @return page of matching starred todo lists
     */
    @Query("SELECT t FROM TodoList t WHERE " +
            "t.starred = true AND t.deleted = false AND " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<TodoList> findStarredTodoListsBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Search deleted todo lists by title or category
     * 
     * @param searchTerm the term to search for
     * @param pageable   pagination information
     * @return page of matching deleted todo lists
     */
    @Query("SELECT t FROM TodoList t WHERE " +
            "t.deleted = true AND " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<TodoList> findDeletedTodoListsBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);
}