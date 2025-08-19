package ai.jamerly.tiein.dto;

import lombok.Data;

@Data
public class PageerDto {
    private Integer page = 1;
    private Integer pageSize = 20;
}
