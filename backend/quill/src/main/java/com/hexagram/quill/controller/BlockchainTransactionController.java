package com.hexagram.quill.controller;

import com.hexagram.quill.dto.BlockchainTransactionDTO;
import com.hexagram.quill.entity.BlockchainTransaction;
import com.hexagram.quill.service.BlockchainTransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller para gerenciar transações blockchain.
 */
@RestController
@RequestMapping("/api/blockchain-transactions")
@CrossOrigin(origins = { "http://localhost:5173", "http://127.0.0.1:5173" })
public class BlockchainTransactionController {

    @Autowired
    private BlockchainTransactionService transactionService;

    /**
     * Criar uma nova transação blockchain.
     * 
     * @param transactionDTO O DTO da transação a ser criada
     * @return A transação criada com status 201
     */
    @PostMapping
    public ResponseEntity<BlockchainTransactionDTO> createTransaction(
            @Valid @RequestBody BlockchainTransactionDTO transactionDTO) {
        try {
            BlockchainTransaction transaction = transactionService.convertToEntity(transactionDTO);
            BlockchainTransaction createdTransaction = transactionService.createTransaction(transaction);
            BlockchainTransactionDTO createdDTO = transactionService.convertToDTO(createdTransaction);
            return new ResponseEntity<>(createdDTO, HttpStatus.CREATED);
        } catch (BlockchainTransactionService.DuplicateTransactionException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    /**
     * Buscar transação por ID.
     * 
     * @param id O ID da transação
     * @return A transação ou 404 se não encontrada
     */
    @GetMapping("/{id}")
    public ResponseEntity<BlockchainTransactionDTO> getTransactionById(@PathVariable Long id) {
        return transactionService.getTransactionById(id)
                .map(transaction -> {
                    BlockchainTransactionDTO dto = transactionService.convertToDTO(transaction);
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Buscar transação por hash.
     * 
     * @param txHash O hash da transação
     * @return A transação ou 404 se não encontrada
     */
    @GetMapping("/hash/{txHash}")
    public ResponseEntity<BlockchainTransactionDTO> getTransactionByHash(@PathVariable String txHash) {
        return transactionService.getTransactionByHash(txHash)
                .map(transaction -> {
                    BlockchainTransactionDTO dto = transactionService.convertToDTO(transaction);
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Buscar transações de uma carteira com filtros opcionais.
     * 
     * @param walletAddress O endereço da carteira (opcional)
     * @param operationType O tipo de operação (opcional)
     * @param status        O status (opcional)
     * @param network       A rede (opcional)
     * @param pageable      Informações de paginação
     * @return Página de transações
     */
    @GetMapping
    public ResponseEntity<Page<BlockchainTransactionDTO>> getTransactions(
            @RequestParam(required = false) String walletAddress,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String network,
            Pageable pageable) {

        Page<BlockchainTransaction> transactions = transactionService.getTransactionsWithFilters(
                walletAddress, operationType, status, network, pageable);
        Page<BlockchainTransactionDTO> transactionDTOs = transactionService.convertToDTOPage(transactions);
        return ResponseEntity.ok(transactionDTOs);
    }

    /**
     * Buscar transações de uma nota específica.
     * 
     * @param noteId   O ID da nota
     * @param pageable Informações de paginação
     * @return Página de transações
     */
    @GetMapping("/note/{noteId}")
    public ResponseEntity<Page<BlockchainTransactionDTO>> getTransactionsByNote(
            @PathVariable Long noteId,
            Pageable pageable) {

        Page<BlockchainTransaction> transactions = transactionService.getTransactionsByNote(noteId, pageable);
        Page<BlockchainTransactionDTO> transactionDTOs = transactionService.convertToDTOPage(transactions);
        return ResponseEntity.ok(transactionDTOs);
    }

    /**
     * Buscar últimas transações de uma carteira.
     * 
     * @param walletAddress O endereço da carteira
     * @return Lista das últimas 10 transações
     */
    @GetMapping("/wallet/{walletAddress}/recent")
    public ResponseEntity<List<BlockchainTransactionDTO>> getRecentTransactions(
            @PathVariable String walletAddress) {

        List<BlockchainTransaction> transactions = transactionService.getRecentTransactions(walletAddress);
        List<BlockchainTransactionDTO> transactionDTOs = transactions.stream()
                .map(transactionService::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(transactionDTOs);
    }

    /**
     * Atualizar status de uma transação.
     * 
     * @param id     O ID da transação
     * @param status O novo status
     * @return A transação atualizada
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<BlockchainTransactionDTO> updateTransactionStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        try {
            BlockchainTransaction updatedTransaction = transactionService.updateTransactionStatus(id, status);
            BlockchainTransactionDTO dto = transactionService.convertToDTO(updatedTransaction);
            return ResponseEntity.ok(dto);
        } catch (BlockchainTransactionService.TransactionNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Atualizar uma transação.
     * 
     * @param id             O ID da transação
     * @param transactionDTO Os dados atualizados
     * @return A transação atualizada
     */
    @PutMapping("/{id}")
    public ResponseEntity<BlockchainTransactionDTO> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody BlockchainTransactionDTO transactionDTO) {

        try {
            BlockchainTransaction transactionDetails = transactionService.convertToEntity(transactionDTO);
            BlockchainTransaction updatedTransaction = transactionService.updateTransaction(id, transactionDetails);
            BlockchainTransactionDTO dto = transactionService.convertToDTO(updatedTransaction);
            return ResponseEntity.ok(dto);
        } catch (BlockchainTransactionService.TransactionNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Excluir uma transação.
     * 
     * @param id O ID da transação
     * @return 204 No Content em sucesso, 404 se não encontrada
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        try {
            transactionService.deleteTransaction(id);
            return ResponseEntity.noContent().build();
        } catch (BlockchainTransactionService.TransactionNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obter estatísticas de transações.
     * 
     * @param walletAddress O endereço da carteira (opcional)
     * @return Estatísticas básicas
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getTransactionStats(
            @RequestParam(required = false) String walletAddress) {

        Map<String, Object> stats = new HashMap<>();

        if (walletAddress != null) {
            stats.put("totalTransactions", transactionService.countByWallet(walletAddress));
        }

        stats.put("noteCreateCount", transactionService.countByOperationType("note_create"));
        stats.put("noteUpdateCount", transactionService.countByOperationType("note_update"));
        stats.put("noteDeleteCount", transactionService.countByOperationType("note_delete"));

        return ResponseEntity.ok(stats);
    }
}

