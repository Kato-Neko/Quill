package com.hexagram.quill.dto;

public class TodoItem {

    private String id;
    private String text;
    private Boolean completed = false;

    // Default constructor
    public TodoItem() {
    }

    // Constructor
    public TodoItem(String id, String text, Boolean completed) {
        this.id = id;
        this.text = text;
        this.completed = completed;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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
                "id=" + id +
                ", text='" + text + '\'' +
                ", completed=" + completed +
                '}';
    }
}
