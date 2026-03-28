(function(){function s(){var o,r;const a=document.contentType||"",e=((r=(o=document.body)==null?void 0:o.innerText)==null?void 0:r.trim())||"";if(a.includes("application/json"))return!0;if(e){const n=e.trim();if(n.startsWith("{")&&n.endsWith("}")||n.startsWith("[")&&n.endsWith("]"))try{return JSON.parse(n),!0}catch{return!1}}return!1}function d(){var e,o;if(!s())return;const a=document.body.innerText.trim();try{const r=JSON.parse(a),n=JSON.stringify(r,null,2),t=window.matchMedia("(prefers-color-scheme: dark)").matches,c=document.createElement("pre");c.style.cssText=`
        background: ${t?"#1e1e1e":"#f5f5f5"};
        color: ${t?"#d4d4d4":"#333"};
        padding: 20px;
        border-radius: 8px;
        overflow: auto;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      `,c.textContent=n,document.body.innerHTML="",document.body.setAttribute("style",""),document.body.style.cssText=`
        margin: 0 !important;
        padding: 20px !important;
        min-height: 100vh !important;
        background: ${t?"#1e1e1e":"#f5f5f5"} !important;
        color: ${t?"#d4d4d4":"#333"} !important;
      `,document.documentElement.style.background=t?"#1e1e1e":"#f5f5f5",document.body.appendChild(c);const m=document.createElement("div");m.style.cssText=`
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        background: ${t?"#2d2d2d":"white"} !important;
        color: ${t?"#e0e0e0":"#333"} !important;
        padding: 10px !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 14px !important;
        z-index: 100000 !important;
      `,m.innerHTML=`
        <span style="font-weight: bold !important; margin-right: 10px !important; color: ${t?"#e0e0e0":"#333"} !important;">JSON Master</span>
        <button id="json-master-copy" style="
          background: #4CAF50 !important;
          color: white !important;
          border: none !important;
          padding: 5px 10px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          margin-right: 5px !important;
        ">复制</button>
        <button id="json-master-raw" style="
          background: ${t?"#3d3d3d":"#f0f0f0"} !important;
          color: ${t?"#e0e0e0":"#333"} !important;
          border: 1px solid ${t?"#555":"#ccc"} !important;
          padding: 5px 10px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
        ">查看原始</button>
      `,document.body.appendChild(m),(e=document.getElementById("json-master-copy"))==null||e.addEventListener("click",()=>{navigator.clipboard.writeText(n).then(()=>{const i=document.getElementById("json-master-copy");if(i){const u=i.textContent;i.textContent="已复制!",setTimeout(()=>{i.textContent=u},2e3)}})}),(o=document.getElementById("json-master-raw"))==null||o.addEventListener("click",()=>{location.reload()})}catch(r){console.error("JSON Master: Failed to format JSON",r)}}chrome.runtime.onMessage.addListener((a,e,o)=>{var r;switch(a.action){case"getSelectedText":{const n=((r=window.getSelection())==null?void 0:r.toString())||"";o({text:n});break}case"formatPageJson":d(),o({success:!0});break;case"getPageUrl":o({url:location.href});break;default:o({error:"Unknown action"})}return!0});function p(){s()&&d()}p(),chrome.storage.sync.get("json_master_settings",a=>{const e=a.json_master_settings;(e==null?void 0:e.autoFormat)!==!1&&s()&&d()}),console.log("JSON Master content script loaded")})();
