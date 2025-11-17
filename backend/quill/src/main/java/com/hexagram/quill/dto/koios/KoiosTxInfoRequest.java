package com.hexagram.quill.dto.koios;

import java.util.List;

public class KoiosTxInfoRequest {
    private String network;
    private List<String> txHashes;

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }

    public List<String> getTxHashes() {
        return txHashes;
    }

    public void setTxHashes(List<String> txHashes) {
        this.txHashes = txHashes;
    }
}

