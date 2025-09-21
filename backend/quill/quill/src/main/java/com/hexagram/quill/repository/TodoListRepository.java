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

    // Find active todo lists (not deleted, not archived)
    Page<TodoList> findByDeletedFalseAndArchivedFalseOrderByUpdatedAtDesc(Pageable pageable);

    // Find archived todo lists
    Page<TodoList> findByArchivedTrueAndDeletedFalseOrderByUpdatedAtDesc(Pageable pageable);

    // Find starred todo lists
    Page<TodoList> findByStarredTrueAndDeletedFalseOrderByUpdatedAtDesc(Pageable pageable);

    // Find deleted todo lists
    Page<TodoList> findByDeletedTrueOrderByUpdatedAtDesc(Pageable pageable);

    // Search methods for active todo lists
    @Query("SELECT t FROM TodoList t WHERE " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "t.deleted = false AND t.archived = false")
    Page<TodoList> findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            @Param("searchTerm") String searchTerm, Pageable pageable);

    // Search methods for archived todo lists
    @Query("SELECT t FROM TodoList t WHERE " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "t.archived = true AND t.deleted = false")
    Page<TodoList> findArchivedTodoListsBySearchTerm(
            @Param("searchTerm") String searchTerm, Pageable pageable);

    // Search methods for starred todo lists
    @Query("SELECT t FROM TodoList t WHERE " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "t.starred = true AND t.deleted = false")
    Page<TodoList> findStarredTodoListsBySearchTerm(
            @Param("searchTerm") String searchTerm, Pageable pageable);

    // Search methods for deleted todo lists
    @Query("SELECT t FROM TodoList t WHERE " +
            "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
            "t.deleted = true")
    Page<TodoList> findDeletedTodoListsBySearchTerm(
            @Param("searchTerm") String searchTerm, Pageable pageable);

    // Count methods
    long countByCategoryIgnoreCase(String category);
}
