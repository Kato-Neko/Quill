package com.hexagram.quill.service;

import com.hexagram.quill.dto.BlockchainTransactionDTO;
import com.hexagram.quill.entity.BlockchainTransaction;
import com.hexagram.quill.repository.BlockchainTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Serviço para gerenciar transações blockchain.
 */
@Service
@Transactional
public class BlockchainTransactionService {

    @Autowired
    private BlockchainTransactionRepository transactionRepository;

    /**
     * Criar uma nova transação blockchain.
     * 
     * @param transaction A entidade de transação a ser criada
     * @return A transação salva
     */
    public BlockchainTransaction createTransaction(BlockchainTransaction transaction) {
        // Validar se já existe uma transação com o mesmo hash
        if (transaction.getTxHash() != null && 
            transactionRepository.existsByTxHash(transaction.getTxHash())) {
            throw new DuplicateTransactionException(
                "Transaction with hash " + transaction.getTxHash() + " already exists");
        }
        
        // Definir confirmedAt se status for 'confirmed'
        if ("confirmed".equalsIgnoreCase(transaction.getStatus()) && 
            transaction.getConfirmedAt() == null) {
            transaction.setConfirmedAt(LocalDateTime.now());
        }
        
        return transactionRepository.save(transaction);
    }

    /**
     * Buscar transação por ID.
     * 
     * @param id O ID da transação
     * @return Optional contendo a transação se encontrada
     */
    public Optional<BlockchainTransaction> getTransactionById(Long id) {
        return transactionRepository.findById(id);
    }

    /**
     * Buscar transação por hash.
     * 
     * @param txHash O hash da transação
     * @return Optional contendo a transação se encontrada
     */
    public Optional<BlockchainTransaction> getTransactionByHash(String txHash) {
        return transactionRepository.findByTxHash(txHash);
    }

    /**
     * Buscar todas as transações de uma carteira.
     * 
     * @param walletAddress O endereço da carteira
     * @param pageable      Informações de paginação
     * @return Página de transações
     */
    public Page<BlockchainTransaction> getTransactionsByWallet(String walletAddress, Pageable pageable) {
        return transactionRepository.findByWalletAddressOrderByCreatedAtDesc(walletAddress, pageable);
    }

    /**
     * Buscar transações de uma nota específica.
     * 
     * @param noteId   O ID da nota
     * @param pageable Informações de paginação
     * @return Página de transações
     */
    public Page<BlockchainTransaction> getTransactionsByNote(Long noteId, Pageable pageable) {
        return transactionRepository.findByNoteIdOrderByCreatedAtDesc(noteId, pageable);
    }

    /**
     * Buscar transações com filtros.
     * 
     * @param walletAddress O endereço da carteira (opcional)
     * @param operationType O tipo de operação (opcional)
     * @param status        O status (opcional)
     * @param network       A rede (opcional)
     * @param pageable      Informações de paginação
     * @return Página de transações
     */
    public Page<BlockchainTransaction> getTransactionsWithFilters(
            String walletAddress, String operationType, String status, String network, Pageable pageable) {
        return transactionRepository.findByFilters(walletAddress, operationType, status, network, pageable);
    }

    /**
     * Atualizar status de uma transação.
     * 
     * @param id     O ID da transação
     * @param status O novo status
     * @return A transação atualizada
     * @throws TransactionNotFoundException se a transação não for encontrada
     */
    public BlockchainTransaction updateTransactionStatus(Long id, String status) {
        BlockchainTransaction transaction = getTransactionById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));
        
        transaction.setStatus(status);
        
        // Definir confirmedAt se o status for 'confirmed'
        if ("confirmed".equalsIgnoreCase(status) && transaction.getConfirmedAt() == null) {
            transaction.setConfirmedAt(LocalDateTime.now());
        }
        
        return transactionRepository.save(transaction);
    }

    /**
     * Atualizar uma transação existente.
     * 
     * @param id                O ID da transação
     * @param transactionDetails Os detalhes atualizados
     * @return A transação atualizada
     * @throws TransactionNotFoundException se a transação não for encontrada
     */
    public BlockchainTransaction updateTransaction(Long id, BlockchainTransaction transactionDetails) {
        BlockchainTransaction existingTransaction = getTransactionById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));
        
        // Atualizar campos
        if (transactionDetails.getStatus() != null) {
            existingTransaction.setStatus(transactionDetails.getStatus());
            
            // Definir confirmedAt se status mudou para 'confirmed'
            if ("confirmed".equalsIgnoreCase(transactionDetails.getStatus()) && 
                existingTransaction.getConfirmedAt() == null) {
                existingTransaction.setConfirmedAt(LocalDateTime.now());
            }
        }
        
        if (transactionDetails.getErrorMessage() != null) {
            existingTransaction.setErrorMessage(transactionDetails.getErrorMessage());
        }
        
        if (transactionDetails.getMetadata() != null) {
            existingTransaction.setMetadata(transactionDetails.getMetadata());
        }
        
        return transactionRepository.save(existingTransaction);
    }

    /**
     * Excluir uma transação.
     * 
     * @param id O ID da transação
     * @throws TransactionNotFoundException se a transação não for encontrada
     */
    public void deleteTransaction(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new TransactionNotFoundException("Transaction not found with id: " + id);
        }
        transactionRepository.deleteById(id);
    }

    /**
     * Contar transações por tipo de operação.
     * 
     * @param operationType O tipo de operação
     * @return Número de transações
     */
    public long countByOperationType(String operationType) {
        return transactionRepository.countByOperationType(operationType);
    }

    /**
     * Contar transações de uma carteira.
     * 
     * @param walletAddress O endereço da carteira
     * @return Número de transações
     */
    public long countByWallet(String walletAddress) {
        return transactionRepository.countByWalletAddress(walletAddress);
    }

    /**
     * Buscar as últimas 10 transações de uma carteira.
     * 
     * @param walletAddress O endereço da carteira
     * @return Lista de transações
     */
    public List<BlockchainTransaction> getRecentTransactions(String walletAddress) {
        return transactionRepository.findTop10ByWalletAddressOrderByCreatedAtDesc(walletAddress);
    }

    /**
     * Converter entidade para DTO.
     * 
     * @param transaction A entidade de transação
     * @return O DTO
     */
    public BlockchainTransactionDTO convertToDTO(BlockchainTransaction transaction) {
        BlockchainTransactionDTO dto = new BlockchainTransactionDTO();
        dto.setId(transaction.getId());
        dto.setTxHash(transaction.getTxHash());
        dto.setOperationType(transaction.getOperationType());
        dto.setNoteId(transaction.getNoteId());
        dto.setWalletAddress(transaction.getWalletAddress());
        dto.setAmount(transaction.getAmount());
        dto.setFee(transaction.getFee());
        dto.setNetwork(transaction.getNetwork());
        dto.setStatus(transaction.getStatus());
        dto.setMetadata(transaction.getMetadata());
        dto.setNoteTitle(transaction.getNoteTitle());
        dto.setDescription(transaction.getDescription());
        dto.setErrorMessage(transaction.getErrorMessage());
        dto.setCreatedAt(transaction.getCreatedAt());
        dto.setUpdatedAt(transaction.getUpdatedAt());
        dto.setConfirmedAt(transaction.getConfirmedAt());
        return dto;
    }

    /**
     * Converter DTO para entidade.
     * 
     * @param dto O DTO
     * @return A entidade
     */
    public BlockchainTransaction convertToEntity(BlockchainTransactionDTO dto) {
        BlockchainTransaction transaction = new BlockchainTransaction();
        transaction.setId(dto.getId());
        transaction.setTxHash(dto.getTxHash());
        transaction.setOperationType(dto.getOperationType());
        transaction.setNoteId(dto.getNoteId());
        transaction.setWalletAddress(dto.getWalletAddress());
        transaction.setAmount(dto.getAmount());
        transaction.setFee(dto.getFee());
        transaction.setNetwork(dto.getNetwork());
        transaction.setStatus(dto.getStatus());
        transaction.setMetadata(dto.getMetadata());
        transaction.setNoteTitle(dto.getNoteTitle());
        transaction.setDescription(dto.getDescription());
        transaction.setErrorMessage(dto.getErrorMessage());
        transaction.setConfirmedAt(dto.getConfirmedAt());
        return transaction;
    }

    /**
     * Converter Page de entidades para Page de DTOs.
     * 
     * @param transactionPage A página de entidades
     * @return A página de DTOs
     */
    public Page<BlockchainTransactionDTO> convertToDTOPage(Page<BlockchainTransaction> transactionPage) {
        return transactionPage.map(this::convertToDTO);
    }

    /**
     * Exceção personalizada para transação não encontrada.
     */
    public static class TransactionNotFoundException extends RuntimeException {
        public TransactionNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Exceção personalizada para transação duplicada.
     */
    public static class DuplicateTransactionException extends RuntimeException {
        public DuplicateTransactionException(String message) {
            super(message);
        }
    }
}

