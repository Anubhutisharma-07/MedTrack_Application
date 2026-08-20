package com.medtrack.auth.scim.dto;

import java.util.List;

public class ScimListResponseDto<T> {

    private List<String> schemas = List.of("urn:ietf:params:scim:api:messages:2.0:ListResponse");
    private int totalResults;
    private int startIndex;
    private int itemsPerPage;
    private List<T> Resources;

    public ScimListResponseDto(List<T> resources, int totalResults, int startIndex, int itemsPerPage) {
        this.Resources = resources;
        this.totalResults = totalResults;
        this.startIndex = startIndex;
        this.itemsPerPage = itemsPerPage;
    }

    public List<String> getSchemas() { return schemas; }
    public int getTotalResults() { return totalResults; }
    public int getStartIndex() { return startIndex; }
    public int getItemsPerPage() { return itemsPerPage; }
    public List<T> getResources() { return Resources; }
}
