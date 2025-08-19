package ai.jamerly.tiein.util;


public class BizException extends RuntimeException {
    public Integer getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(Integer errorCode) {
        this.errorCode = errorCode;
    }

    private Integer errorCode;

    public BizException() {
        super();
    }

    public BizException( String message,Integer errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

}