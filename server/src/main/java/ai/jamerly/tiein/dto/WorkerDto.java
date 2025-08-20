package ai.jamerly.tiein.dto;

public class WorkerDto {
    private Long id;
    private String name;
    private String script;

    // Constructors
    public WorkerDto() {
    }

    public WorkerDto(Long id, String name, String script) {
        this.id = id;
        this.name = name;
        this.script = script;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }
}
