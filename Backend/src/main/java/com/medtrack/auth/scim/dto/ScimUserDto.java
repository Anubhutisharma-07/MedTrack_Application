package com.medtrack.auth.scim.dto;

import java.util.List;
import java.util.Map;

public class ScimUserDto {

    private List<String> schemas = List.of("urn:ietf:params:scim:schemas:core:2.0:User");
    private String id;
    private String externalId;
    private String userName;
    private Map<String, String> name;
    private List<Map<String, Object>> emails;
    private boolean active;
    private Map<String, String> meta;

    public ScimUserDto() {}

    public List<String> getSchemas() { return schemas; }
    public void setSchemas(List<String> schemas) { this.schemas = schemas; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Map<String, String> getName() { return name; }
    public void setName(Map<String, String> name) { this.name = name; }

    public List<Map<String, Object>> getEmails() { return emails; }
    public void setEmails(List<Map<String, Object>> emails) { this.emails = emails; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Map<String, String> getMeta() { return meta; }
    public void setMeta(Map<String, String> meta) { this.meta = meta; }
}
