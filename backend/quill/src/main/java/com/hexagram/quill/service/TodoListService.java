package com.hexagram.quill.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hexagram.quill.dto.TodoListDTO;
import com.hexagram.quill.dto.TodoItem;
import com.hexagram.quill.entity.TodoList;
import com.hexagram.quill.repository.TodoListRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TodoListService {

    @Autowired
    private TodoListRepository todoListRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Retrieves a paginated list of todo lists. If a search term is provided, it
     * filters
     * todo lists by title or category using a custom JPQL query. Otherwise, it
     * returns
     * all todo lists sorted by the last update time (most recently updated first).
     *
     * @param searchTerm The term to search for in todo list titles and categories.
     *                   Can be
     *                   null or empty.
     * @param pageable   Pagination and sorting information.
     * @return A page of todo lists.
     */
    public Page<TodoList> getAllTodoLists(String searchTerm, Pageable pageable) {
        return getAllTodoLists(searchTerm, pageable, false, false, false);
    }

    /**
     * Retrieves a paginated list of todo lists with optional filtering.
     *
     * @param searchTerm The term to search for in todo list titles and categories.
     *                   Can be
     *                   null or empty.
     * @param pageable   Pagination and sorting information.
     * @param archived   Filter by archived status (true = only archived, false =
     *                   all)
     * @param starred    Filter by starred status (true = only starred, false = all)
     * @param deleted    Filter by deleted status (true = only deleted, false = all)
     * @return A page of todo lists.
     */
    public Page<TodoList> getAllTodoLists(String searchTerm, Pageable pageable, boolean archived, boolean starred,
            boolean deleted) {
        // Ensure consistent sorting by updatedAt desc when no custom sorting is
        // provided
        Pageable finalPageable = ensureDefaultSorting(pageable);

        // Handle deleted todo lists filter
        if (deleted) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                return todoListRepository.findDeletedTodoListsBySearchTerm(searchTerm.trim(), finalPageable);
            }
            return todoListRepository.findByDeletedTrueOrderByUpdatedAtDesc(finalPageable);
        }

        // Handle archived todo lists filter
        if (archived) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                return todoListRepository.findArchivedTodoListsBySearchTerm(searchTerm.trim(), finalPageable);
            }
            return todoListRepository.findByArchivedTrueAndDeletedFalseOrderByUpdatedAtDesc(finalPageable);
        }

        // Handle starred todo lists filter
        if (starred) {
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                return todoListRepository.findStarredTodoListsBySearchTerm(searchTerm.trim(), finalPageable);
            }
            return todoListRepository.findByStarredTrueAndDeletedFalseOrderByUpdatedAtDesc(finalPageable);
        }

        // Default: return active todo lists (not deleted, not archived)
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            return todoListRepository.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(
                    searchTerm.trim(), finalPageable);
        }

        // Return active todo lists (not deleted, not archived)
        return todoListRepository.findByDeletedFalseAndArchivedFalseOrderByUpdatedAtDesc(finalPageable);
    }

    /**
     * Ensures that pagination requests have a default sorting by updatedAt desc if
     * no sorting is specified.
     * This provides consistent ordering across all todo list listings.
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
     * Creates and saves a new todo list.
     *
     * @param todoList The todo list object to be created.
     * @return The saved todo list with its generated ID and timestamps.
     */
    public TodoList createTodoList(TodoList todoList) {
        return todoListRepository.save(todoList);
    }

    /**
     * Retrieves a single todo list by its ID.
     *
     * @param id The ID of the todo list.
     * @return The todo list object wrapped in Optional.
     */
    public Optional<TodoList> getTodoListById(Long id) {
        return todoListRepository.findById(id);
    }

    /**
     * Retrieves a single todo list by its ID or throws an exception if not found.
     *
     * @param id The ID of the todo list.
     * @return The todo list object.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public TodoList getTodoListByIdOrThrow(Long id) {
        return getTodoListById(id)
                .orElseThrow(() -> new TodoListNotFoundException("Todo list not found with id: " + id));
    }

    /**
     * Updates an existing todo list.
     *
     * @param id              The ID of the todo list to update.
     * @param todoListDetails The todo list object with updated details.
     * @return The updated todo list.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public TodoList updateTodoList(Long id, TodoList todoListDetails) {
        TodoList existingTodoList = getTodoListByIdOrThrow(id);

        // Update fields
        existingTodoList.setTitle(todoListDetails.getTitle());
        existingTodoList.setCategory(todoListDetails.getCategory());
        existingTodoList.setTodos(todoListDetails.getTodos());

        // `updatedAt` will be automatically handled by @UpdateTimestamp
        return todoListRepository.save(existingTodoList);
    }

    /**
     * Deletes a todo list by its ID (soft delete - marks as deleted).
     *
     * @param id The ID of the todo list to delete.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public void deleteTodoList(Long id) {
        TodoList todoList = getTodoListByIdOrThrow(id);
        todoList.setDeleted(true);
        todoListRepository.save(todoList);
    }

    /**
     * Archives a todo list by its ID.
     *
     * @param id The ID of the todo list to archive.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public void archiveTodoList(Long id) {
        TodoList todoList = getTodoListByIdOrThrow(id);
        todoList.setArchived(true);
        todoListRepository.save(todoList);
    }

    /**
     * Unarchives a todo list by its ID.
     *
     * @param id The ID of the todo list to unarchive.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public void unarchiveTodoList(Long id) {
        TodoList todoList = getTodoListByIdOrThrow(id);
        todoList.setArchived(false);
        todoListRepository.save(todoList);
    }

    /**
     * Restores a deleted todo list by its ID.
     *
     * @param id The ID of the todo list to restore.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public void restoreTodoList(Long id) {
        TodoList todoList = getTodoListByIdOrThrow(id);
        todoList.setDeleted(false);
        todoListRepository.save(todoList);
    }

    /**
     * Permanently deletes a todo list by its ID (hard delete).
     *
     * @param id The ID of the todo list to permanently delete.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public void permanentDeleteTodoList(Long id) {
        if (!todoListRepository.existsById(id)) {
            throw new TodoListNotFoundException("Todo list not found with id: " + id);
        }
        todoListRepository.deleteById(id);
    }

    /**
     * Toggles the starred status of a todo list.
     *
     * @param id The ID of the todo list to toggle.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public void toggleStar(Long id) {
        TodoList todoList = getTodoListByIdOrThrow(id);
        todoList.setStarred(!todoList.getStarred());
        todoListRepository.save(todoList);
    }

    /**
     * Toggles the pinned status of a todo list.
     *
     * @param id The ID of the todo list to toggle.
     * @throws TodoListNotFoundException if todo list not found.
     */
    public void togglePin(Long id) {
        TodoList todoList = getTodoListByIdOrThrow(id);
        todoList.setIsPinned(!todoList.getIsPinned());
        todoListRepository.save(todoList);
    }

    /**
     * Custom exception for when a todo list is not found
     */
    public static class TodoListNotFoundException extends RuntimeException {
        public TodoListNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Counts the total number of todo lists (useful for statistics)
     *
     * @return The total number of todo lists in the database
     */
    public long countAllTodoLists() {
        return todoListRepository.count();
    }

    /**
     * Counts the number of todo lists for a specific category
     *
     * @param category The category to count
     * @return The number of todo lists in the specified category
     */
    public long countTodoListsByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return 0;
        }
        return todoListRepository.countByCategoryIgnoreCase(category.trim());
    }

    /**
     * Convert TodoList entity to TodoListDTO
     */
    public TodoListDTO convertToDTO(TodoList todoList) {
        TodoListDTO dto = new TodoListDTO();
        dto.setId(todoList.getId());
        dto.setTitle(todoList.getTitle());
        dto.setCategory(todoList.getCategory());
        dto.setStarred(todoList.getStarred());
        dto.setArchived(todoList.getArchived());
        dto.setDeleted(todoList.getDeleted());
        dto.setIsPinned(todoList.getIsPinned());
        dto.setCreatedAt(todoList.getCreatedAt());
        dto.setUpdatedAt(todoList.getUpdatedAt());

        // Convert todos JSON string to List<TodoItem>
        if (todoList.getTodos() != null && !todoList.getTodos().trim().isEmpty()) {
            try {
                List<TodoItem> todos = objectMapper.readValue(todoList.getTodos(), new TypeReference<List<TodoItem>>() {
                });
                dto.setTodos(todos);
            } catch (JsonProcessingException e) {
                // If parsing fails, set empty list
                dto.setTodos(null);
            }
        }

        return dto;
    }

    /**
     * Convert TodoListDTO to TodoList entity
     */
    public TodoList convertToEntity(TodoListDTO dto) {
        TodoList todoList = new TodoList();
        todoList.setId(dto.getId());
        todoList.setTitle(dto.getTitle());
        todoList.setCategory(dto.getCategory());
        todoList.setStarred(dto.getStarred());
        todoList.setArchived(dto.getArchived());
        todoList.setDeleted(dto.getDeleted());
        todoList.setIsPinned(dto.getIsPinned());

        // Convert todos List<TodoItem> to JSON string
        if (dto.getTodos() != null && !dto.getTodos().isEmpty()) {
            try {
                String todosJson = objectMapper.writeValueAsString(dto.getTodos());
                todoList.setTodos(todosJson);
            } catch (JsonProcessingException e) {
                // If serialization fails, set null
                todoList.setTodos(null);
            }
        } else {
            todoList.setTodos(null);
        }

        return todoList;
    }

    /**
     * Convert Page<TodoList> to Page<TodoListDTO>
     */
    public Page<TodoListDTO> convertToDTOPage(Page<TodoList> todoListPage) {
        return todoListPage.map(this::convertToDTO);
    }
}
