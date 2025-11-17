package com.hexagram.quill.repository;

import com.hexagram.quill.entity.BlockchainTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for BlockchainTransaction entity.
 */
@Repository
public interface BlockchainTransactionRepository extends JpaRepository<BlockchainTransaction, Long> {

    /**
     * Buscar uma transação pelo hash.
     * 
     * @param txHash O hash da transação
     * @return Optional contendo a transação se encontrada
     */
    Optional<BlockchainTransaction> findByTxHash(String txHash);

    /**
     * Verificar se existe uma transação com o hash fornecido.
     * 
     * @param txHash O hash da transação
     * @return true se existe, false caso contrário
     */
    boolean existsByTxHash(String txHash);

    /**
     * Buscar todas as transações de um endereço de carteira específico.
     * 
     * @param walletAddress O endereço da carteira
     * @param pageable      Informações de paginação
     * @return Página de transações
     */
    Page<BlockchainTransaction> findByWalletAddressOrderByCreatedAtDesc(String walletAddress, Pageable pageable);

    /**
     * Buscar todas as transações associadas a uma nota específica.
     * 
     * @param noteId   O ID da nota
     * @param pageable Informações de paginação
     * @return Página de transações
     */
    Page<BlockchainTransaction> findByNoteIdOrderByCreatedAtDesc(Long noteId, Pageable pageable);

    /**
     * Buscar transações por tipo de operação.
     * 
     * @param operationType O tipo de operação
     * @param pageable      Informações de paginação
     * @return Página de transações
     */
    Page<BlockchainTransaction> findByOperationTypeOrderByCreatedAtDesc(String operationType, Pageable pageable);

    /**
     * Buscar transações por status.
     * 
     * @param status   O status da transação
     * @param pageable Informações de paginação
     * @return Página de transações
     */
    Page<BlockchainTransaction> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /**
     * Buscar transações por rede.
     * 
     * @param network  A rede Cardano
     * @param pageable Informações de paginação
     * @return Página de transações
     */
    Page<BlockchainTransaction> findByNetworkOrderByCreatedAtDesc(String network, Pageable pageable);

    /**
     * Buscar transações de uma carteira específica e rede.
     * 
     * @param walletAddress O endereço da carteira
     * @param network       A rede Cardano
     * @param pageable      Informações de paginação
     * @return Página de transações
     */
    Page<BlockchainTransaction> findByWalletAddressAndNetworkOrderByCreatedAtDesc(
            String walletAddress, String network, Pageable pageable);

    /**
     * Buscar transações com filtros combinados.
     * 
     * @param walletAddress O endereço da carteira (opcional)
     * @param operationType O tipo de operação (opcional)
     * @param status        O status (opcional)
     * @param network       A rede (opcional)
     * @param pageable      Informações de paginação
     * @return Página de transações
     */
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE " +
            "(:walletAddress IS NULL OR bt.walletAddress = :walletAddress) AND " +
            "(:operationType IS NULL OR bt.operationType = :operationType) AND " +
            "(:status IS NULL OR bt.status = :status) AND " +
            "(:network IS NULL OR bt.network = :network) " +
            "ORDER BY bt.createdAt DESC")
    Page<BlockchainTransaction> findByFilters(
            @Param("walletAddress") String walletAddress,
            @Param("operationType") String operationType,
            @Param("status") String status,
            @Param("network") String network,
            Pageable pageable);

    /**
     * Contar transações por tipo de operação.
     * 
     * @param operationType O tipo de operação
     * @return Número de transações
     */
    long countByOperationType(String operationType);

    /**
     * Contar transações por endereço de carteira.
     * 
     * @param walletAddress O endereço da carteira
     * @return Número de transações
     */
    long countByWalletAddress(String walletAddress);

    /**
     * Buscar as últimas N transações de uma carteira.
     * 
     * @param walletAddress O endereço da carteira
     * @param pageable      Informações de paginação (use PageRequest.of(0, n))
     * @return Lista de transações
     */
    List<BlockchainTransaction> findTop10ByWalletAddressOrderByCreatedAtDesc(String walletAddress);
}

