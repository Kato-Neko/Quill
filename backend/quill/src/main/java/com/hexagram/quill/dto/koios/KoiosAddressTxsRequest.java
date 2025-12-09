package com.hexagram.quill.dto.koios;

import java.util.List;

public class KoiosAddressTxsRequest {
    private String network;
    private List<String> addresses;
    private Integer limit;

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }

    public List<String> getAddresses() {
        return addresses;
    }

    public void setAddresses(List<String> addresses) {
        this.addresses = addresses;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }
}

