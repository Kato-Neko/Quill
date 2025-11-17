package com.hexagram.quill.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for BlockchainTransaction entity.
 */
public class BlockchainTransactionDTO {

    private Long id;

    @NotBlank(message = "Transaction hash cannot be blank")
    private String txHash;

    @NotBlank(message = "Operation type cannot be blank")
    private String operationType; // 'note_create', 'note_update', 'note_delete'

    private Long noteId;

    @NotBlank(message = "Wallet address cannot be blank")
    private String walletAddress;

    private BigDecimal amount;

    private BigDecimal fee;

    private String network;

    @NotBlank(message = "Status cannot be blank")
    private String status;

    private String metadata;

    private String noteTitle;

    private String description;

    private String errorMessage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime confirmedAt;

    // Default constructor
    public BlockchainTransactionDTO() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTxHash() {
        return txHash;
    }

    public void setTxHash(String txHash) {
        this.txHash = txHash;
    }

    public String getOperationType() {
        return operationType;
    }

    public void setOperationType(String operationType) {
        this.operationType = operationType;
    }

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public String getNoteTitle() {
        return noteTitle;
    }

    public void setNoteTitle(String noteTitle) {
        this.noteTitle = noteTitle;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
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

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    @Override
    public String toString() {
        return "BlockchainTransactionDTO{" +
                "id=" + id +
                ", txHash='" + txHash + '\'' +
                ", operationType='" + operationType + '\'' +
                ", noteId=" + noteId +
                ", walletAddress='" + walletAddress + '\'' +
                ", amount=" + amount +
                ", fee=" + fee +
                ", network='" + network + '\'' +
                ", status='" + status + '\'' +
                ", noteTitle='" + noteTitle + '\'' +
                ", createdAt=" + createdAt +
                ", confirmedAt=" + confirmedAt +
                '}';
    }
}

