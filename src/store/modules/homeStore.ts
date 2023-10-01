import { reactive } from 'vue'
export const homeStore = reactive({
    myData:{
        act:'',//红枣
        actData:{} //动作类别
        //,userInfo:initUserInfo()
        //,client:'mobile' //mobile pc
    }
    
    ,setMyData( v:object){
        this.myData={...this.myData,...v};
        //console.log('my', v );
        if( Object.keys(v).indexOf('act')>-1){
            //this.myData.act=v.act
            
            setTimeout(()=> {
                this.myData.act=''
                this.myData.actData=''
            }, 2000 );
        }
    }
 
})