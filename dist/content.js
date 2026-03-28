(function(){function c(){var e,o;const r=document.contentType||"",t=((o=(e=document.body)==null?void 0:e.innerText)==null?void 0:o.trim())||"";if(r.includes("application/json"))return!0;if(t){const n=t.trim();if(n.startsWith("{")&&n.endsWith("}")||n.startsWith("[")&&n.endsWith("]"))try{return JSON.parse(n),!0}catch{return!1}}return!1}function d(){var t,e;if(!c())return;const r=document.body.innerText.trim();try{const o=JSON.parse(r),n=JSON.stringify(o,null,2),a=document.createElement("pre");a.style.cssText=`
        background: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        overflow: auto;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      `,a.textContent=n,document.body.innerHTML="",document.body.appendChild(a);const i=document.createElement("div");i.style.cssText=`
        position: fixed;
        top: 10px;
        right: 10px;
        background: white;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        z-index: 10000;
      `,i.innerHTML=`
        <span style="font-weight: bold; margin-right: 10px;">JSON Master</span>
        <button id="json-master-copy" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 5px;
        ">复制</button>
        <button id="json-master-raw" style="
          background: #f0f0f0;
          border: 1px solid #ccc;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        ">查看原始</button>
      `,document.body.appendChild(i),(t=document.getElementById("json-master-copy"))==null||t.addEventListener("click",()=>{navigator.clipboard.writeText(n).then(()=>{const s=document.getElementById("json-master-copy");if(s){const p=s.textContent;s.textContent="已复制!",setTimeout(()=>{s.textContent=p},2e3)}})}),(e=document.getElementById("json-master-raw"))==null||e.addEventListener("click",()=>{location.reload()})}catch(o){console.error("JSON Master: Failed to format JSON",o)}}chrome.runtime.onMessage.addListener((r,t,e)=>{var o;switch(r.action){case"getSelectedText":const n=((o=window.getSelection())==null?void 0:o.toString())||"";e({text:n});break;case"formatPageJson":d(),e({success:!0});break;case"getPageUrl":e({url:location.href});break;default:e({error:"Unknown action"})}return!0}),chrome.storage.sync.get("json_master_settings",r=>{const t=r.json_master_settings;t!=null&&t.autoFormat&&c()&&d()}),console.log("JSON Master content script loaded")})();
