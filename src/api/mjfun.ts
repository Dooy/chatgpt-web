
import { myTranslate } from './api';
export function upImg(file:any   ):Promise<any>
{
    return new Promise((h,r)=>{
        //const file = input.target.files[0];
        const filename = file.name;
        //console.log('selectFile', file )
        if(file.size>(1024*1024)){
            //msgRef.value.showError('图片大小不能超过1M');
            r('图片大小不能超过1M')
            return ;
        }
        if (! (filename.endsWith('.jpg') ||
            filename.endsWith('.gif') ||
            filename.endsWith('.png') ||
            filename.endsWith('.jpeg') )) {
            r('图片仅支持jpg,gif,png,jpeg格式');
            return ;
        }
        const reader = new FileReader();
        // 当读取操作完成时触发该事件
        //reader.onload = (e:any)=> st.value.fileBase64 = e.target.result;
        reader.onload = (e:any)=>  h( e.target.result);
        reader.readAsDataURL(file);
    })
    
}

function containsChinese(str:string ) {
  return false; //11.18 都不需要翻译
//   var reg = /[\u4e00-\u9fa5]/g; // 匹配中文的正则表达式
//   return reg.test(str);
}

export  async function train( text:string){

    return new Promise<string>((resolve, reject) => {


        if( text.trim()  =='') {
           reject('请填写提示词！');
            return ;
        }

        
        if( !containsChinese(text.trim()) ){
            resolve( text.trim() );
            return ;
        }
        
        myTranslate( text.trim())
            .then((d:any)=>  resolve( d.content.replace(/[?.!]+$/, "")))
            .catch(( )=>   reject('翻译发生错误'))
    })
     
    
   
   
}