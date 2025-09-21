package com.hexagram.quill.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for individual todo items within a todo list.
 */
public class TodoItem {

    @NotBlank(message = "Todo item text cannot be blank")
    @Size(max = 500, message = "Todo item text must be less than 500 characters")
    private String text;

    private Boolean completed = false;

    // Default constructor
    public TodoItem() {
    }

    // Constructor with text
    public TodoItem(String text) {
        this.text = text;
        this.completed = false;
    }

    // Constructor with text and completed status
    public TodoItem(String text, Boolean completed) {
        this.text = text;
        this.completed = completed;
    }

    // Getters and Setters
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    @Override
    public String toString() {
        return "TodoItem{" +
                "text='" + text + '\'' +
                ", completed=" + completed +
                '}';
    }
}
