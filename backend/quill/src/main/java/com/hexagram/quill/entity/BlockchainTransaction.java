package com.hexagram.quill.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing blockchain transactions for note operations.
 * Records all Cardano blockchain transactions associated with note CRUD operations.
 */
@Entity
@Table(name = "blockchain_transactions")
public class BlockchainTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Transaction hash cannot be null")
    @Column(name = "tx_hash", nullable = false, unique = true, length = 128)
    private String txHash;

    @NotNull(message = "Operation type cannot be null")
    @Column(name = "operation_type", nullable = false, length = 20)
    private String operationType; // 'note_create', 'note_update', 'note_delete'

    @Column(name = "note_id")
    private Long noteId;

    @Column(name = "wallet_address", nullable = false, length = 255)
    private String walletAddress;

    @Column(name = "amount", precision = 20, scale = 6)
    private BigDecimal amount; // Transaction amount in ADA

    @Column(name = "fee", precision = 20, scale = 6)
    private BigDecimal fee; // Transaction fee in ADA

    @Column(name = "network", length = 20)
    private String network; // 'preview', 'preprod', 'mainnet'

    @Column(name = "status", nullable = false, length = 20)
    private String status; // 'pending', 'confirmed', 'failed'

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON metadata from blockchain

    @Column(name = "note_title", length = 255)
    private String noteTitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    // Default constructor
    public BlockchainTransaction() {
    }

    // Constructor with required fields
    public BlockchainTransaction(String txHash, String operationType, String walletAddress, String status) {
        this.txHash = txHash;
        this.operationType = operationType;
        this.walletAddress = walletAddress;
        this.status = status;
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
        return "BlockchainTransaction{" +
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

