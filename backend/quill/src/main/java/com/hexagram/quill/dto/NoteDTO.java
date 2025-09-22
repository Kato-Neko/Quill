package com.hexagram.quill.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTO for Note entity.
 */
public class NoteDTO {

    private Long id;

    @NotBlank(message = "Title cannot be blank")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @Size(max = 10000, message = "Content must be less than 10000 characters")
    private String content;

    @Size(max = 50, message = "Category must be less than 50 characters")
    private String category;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Boolean archived = false;

    private Boolean starred = false;

    private Boolean deleted = false;

    private Boolean isPinned = false;

    private java.util.List<com.hexagram.quill.dto.TodoItem> todos;

    // Default constructor
    public NoteDTO() {
    }

    // Constructor with required fields
    public NoteDTO(String title, String content) {
        this.title = title;
        this.content = content;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getArchived() {
        return archived;
    }

    public void setArchived(Boolean archived) {
        this.archived = archived;
    }

    public Boolean getStarred() {
        return starred;
    }

    public void setStarred(Boolean starred) {
        this.starred = starred;
    }

    public Boolean getDeleted() {
        return deleted;
    }

    public void setDeleted(Boolean deleted) {
        this.deleted = deleted;
    }

    public Boolean getIsPinned() {
        return isPinned;
    }

    public void setIsPinned(Boolean isPinned) {
        this.isPinned = isPinned;
    }

    public java.util.List<com.hexagram.quill.dto.TodoItem> getTodos() {
        return todos;
    }

    public void setTodos(java.util.List<com.hexagram.quill.dto.TodoItem> todos) {
        this.todos = todos;
    }

    @Override
    public String toString() {
        return "NoteDTO{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", category='" + category + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", archived=" + archived +
                ", starred=" + starred +
                ", deleted=" + deleted +
                ", isPinned=" + isPinned +
                ", todos=" + todos +
                '}';
    }
}
