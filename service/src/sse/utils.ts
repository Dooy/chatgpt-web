export class mError extends Error {
    reason:any
    status:number
    constructor(reason:any,status?:number){
        super(reason)
        this.reason=reason
        this.status=status??428
    }

}