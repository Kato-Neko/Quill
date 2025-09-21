package com.hexagram.quill.controller;

import com.hexagram.quill.dto.TodoListDTO;
import com.hexagram.quill.entity.TodoList;
import com.hexagram.quill.service.TodoListService;
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
@RequestMapping("/api/todo-lists")
@CrossOrigin(origins = { "http://localhost:5173", "http://127.0.0.1:5173" })
public class TodoListController {

    @Autowired
    private TodoListService todoListService;

    /**
     * Get all todo lists with optional search and filtering.
     * 
     * @param search   Optional search term
     * @param archived Filter by archived status
     * @param starred  Filter by starred status
     * @param deleted  Filter by deleted status
     * @param pageable Pagination parameters
     * @return Page of todo lists
     */
    @GetMapping
    public ResponseEntity<Page<TodoListDTO>> getAllTodoLists(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean archived,
            @RequestParam(required = false) Boolean starred,
            @RequestParam(required = false) Boolean deleted,
            Pageable pageable) {

        try {
            Page<TodoList> todoListPage = todoListService.getAllTodoLists(
                    search, pageable,
                    archived != null ? archived : false,
                    starred != null ? starred : false,
                    deleted != null ? deleted : false);

            Page<TodoListDTO> todoListDTOPage = todoListService.convertToDTOPage(todoListPage);
            return ResponseEntity.ok(todoListDTOPage);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get a specific todo list by ID.
     * 
     * @param id The todo list ID
     * @return The todo list or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<TodoListDTO> getTodoListById(@PathVariable Long id) {
        try {
            TodoList todoList = todoListService.getTodoListByIdOrThrow(id);
            TodoListDTO todoListDTO = todoListService.convertToDTO(todoList);
            return ResponseEntity.ok(todoListDTO);
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create a new todo list.
     * 
     * @param todoListDTO The todo list to create
     * @return The created todo list with 201 status
     */
    @PostMapping
    public ResponseEntity<TodoListDTO> createTodoList(@Valid @RequestBody TodoListDTO todoListDTO) {
        TodoList todoList = todoListService.convertToEntity(todoListDTO);
        TodoList createdTodoList = todoListService.createTodoList(todoList);
        TodoListDTO createdTodoListDTO = todoListService.convertToDTO(createdTodoList);
        return new ResponseEntity<>(createdTodoListDTO, HttpStatus.CREATED);
    }

    /**
     * Update an existing todo list.
     * 
     * @param id          The todo list ID
     * @param todoListDTO The updated todo list data
     * @return The updated todo list or 404 if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<TodoListDTO> updateTodoList(@PathVariable Long id,
            @Valid @RequestBody TodoListDTO todoListDTO) {
        try {
            TodoList todoListDetails = todoListService.convertToEntity(todoListDTO);
            TodoList updatedTodoList = todoListService.updateTodoList(id, todoListDetails);
            TodoListDTO updatedTodoListDTO = todoListService.convertToDTO(updatedTodoList);
            return ResponseEntity.ok(updatedTodoListDTO);
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete a todo list (soft delete).
     * 
     * @param id The todo list ID
     * @return 204 No Content on success, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodoList(@PathVariable Long id) {
        try {
            todoListService.deleteTodoList(id);
            return ResponseEntity.noContent().build();
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Permanently delete a todo list (hard delete).
     * 
     * @param id The todo list ID
     * @return 204 No Content on success, 404 if not found
     */
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentDeleteTodoList(@PathVariable Long id) {
        try {
            todoListService.permanentDeleteTodoList(id);
            return ResponseEntity.noContent().build();
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Archive a todo list.
     * 
     * @param id The todo list ID
     * @return 200 OK on success, 404 if not found
     */
    @PostMapping("/{id}/archive")
    public ResponseEntity<Map<String, String>> archiveTodoList(@PathVariable Long id) {
        try {
            todoListService.archiveTodoList(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Todo list archived successfully");
            return ResponseEntity.ok(response);
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Unarchive a todo list.
     * 
     * @param id The todo list ID
     * @return 200 OK on success, 404 if not found
     */
    @PostMapping("/{id}/unarchive")
    public ResponseEntity<Map<String, String>> unarchiveTodoList(@PathVariable Long id) {
        try {
            todoListService.unarchiveTodoList(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Todo list unarchived successfully");
            return ResponseEntity.ok(response);
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Restore a deleted todo list.
     * 
     * @param id The todo list ID
     * @return 200 OK on success, 404 if not found
     */
    @PostMapping("/{id}/restore")
    public ResponseEntity<Map<String, String>> restoreTodoList(@PathVariable Long id) {
        try {
            todoListService.restoreTodoList(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Todo list restored successfully");
            return ResponseEntity.ok(response);
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Toggle the starred status of a todo list.
     * 
     * @param id The todo list ID
     * @return 200 OK on success, 404 if not found
     */
    @PostMapping("/{id}/star")
    public ResponseEntity<Map<String, String>> toggleStar(@PathVariable Long id) {
        try {
            todoListService.toggleStar(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Todo list star status toggled successfully");
            return ResponseEntity.ok(response);
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Toggle the pinned status of a todo list.
     * 
     * @param id The todo list ID
     * @return 200 OK on success, 404 if not found
     */
    @PostMapping("/{id}/pin")
    public ResponseEntity<Map<String, String>> togglePin(@PathVariable Long id) {
        try {
            todoListService.togglePin(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Todo list pin status toggled successfully");
            return ResponseEntity.ok(response);
        } catch (TodoListService.TodoListNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get statistics about todo lists.
     * 
     * @return Map containing statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTodoListStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTodoLists", todoListService.countAllTodoLists());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
