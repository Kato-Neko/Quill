package com.hexagram.quill.dto.koios;

import java.util.List;

public class KoiosAddressInfoRequest {
    private String network;
    private List<String> addresses;

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
}

