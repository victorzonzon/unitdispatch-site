import b1 from "./seo-bundle-1.js";
import b2 from "./seo-bundle-2.js";
import b3 from "./seo-bundle-3.js";
import b4 from "./seo-bundle-4.js";
import b5 from "./seo-bundle-5.js";
const DATA = b1 + b2 + b3 + b4 + b5;
let bundlePromise;
async function bundle(){
  if(!bundlePromise) bundlePromise=(async()=>{
    const raw=Uint8Array.from(atob(DATA),c=>c.charCodeAt(0));
    const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  })();
  return bundlePromise;
}
function secure(headers=new Headers()){
  const h=new Headers(headers);
  h.set("X-Content-Type-Options","nosniff");
  h.set("Referrer-Policy","strict-origin-when-cross-origin");
  h.set("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  h.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  return h;
}
function homeSEO(response){
  const description="Done-for-you AI receptionist for HVAC, plumbing, electrical, roofing, garage door, and home service businesses. Answer, qualify, book, and route calls 24/7.";
  const title="AI Receptionist for HVAC, Plumbing & Home Services | UnitDispatch";
  const rewriter=new HTMLRewriter()
    .on("html",{element(e){e.setAttribute("lang","en-US");}})
    .on("title",{element(e){e.setInnerContent(title);}})
    .on('meta[name="description"]',{element(e){e.setAttribute("content",description);}})
    .on('meta[property="og:title"]',{element(e){e.setAttribute("content",title);}})
    .on('meta[property="og:description"]',{element(e){e.setAttribute("content",description);}})
    .on("head",{element(e){e.append('<link rel="canonical" href="https://unitdispatch.com/"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"><meta property="og:site_name" content="UnitDispatch"><meta property="og:url" content="https://unitdispatch.com/"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","@id":"https://unitdispatch.com/#website","url":"https://unitdispatch.com/","name":"UnitDispatch","publisher":{"@id":"https://unitdispatch.com/#organization"}},{"@type":"Organization","@id":"https://unitdispatch.com/#organization","name":"UnitDispatch","url":"https://unitdispatch.com/","logo":"https://unitdispatch.com/assets/unitdispatch-logo.svg","email":"victorzonzon.work@gmail.com","telephone":"+14698254387","description":"Done-for-you AI receptionist implementation for local service businesses.","areaServed":{"@type":"Country","name":"United States"}},{"@type":"Service","@id":"https://unitdispatch.com/#service","name":"AI Receptionist for Home Service Businesses","serviceType":"Done-for-you AI receptionist and AI answering service","url":"https://unitdispatch.com/","provider":{"@id":"https://unitdispatch.com/#organization"},"areaServed":{"@type":"Country","name":"United States"}}]}</script>',{html:true});}})
    .on("footer.site-footer",{element(e){e.prepend('<nav aria-label="Explore UnitDispatch services" style="max-width:1200px;margin:0 auto;padding:18px 24px 6px;display:flex;gap:16px 24px;flex-wrap:wrap;font:500 12px/1.5 Inter,system-ui,sans-serif;opacity:.72"><a href="/ai-receptionist/">AI receptionist</a><a href="/ai-answering-service-for-contractors/">Contractor answering</a><a href="/after-hours-answering-service/">After-hours answering</a><a href="/hvac-ai-receptionist/">HVAC</a><a href="/plumbing-ai-receptionist/">Plumbing</a><a href="/electrical-ai-receptionist/">Electrical</a><a href="/roofing-ai-receptionist/">Roofing</a><a href="/garage-door-ai-receptionist/">Garage doors</a><a href="/guides/">Guides</a><a href="/about/">About</a><a href="/contact/">Contact</a></nav>',{html:true});}});
  return rewriter.transform(response);
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.hostname.startsWith("www.")){ url.hostname=url.hostname.slice(4); return Response.redirect(url.toString(),301); }
    if(url.protocol!=="https:"){ url.protocol="https:"; return Response.redirect(url.toString(),301); }
    const path=url.pathname;
    if(path==="/"){
      const asset=await env.ASSETS.fetch(request);
      const transformed=homeSEO(asset);
      const h=secure(transformed.headers); h.set("Cache-Control","public, max-age=300, s-maxage=1800");
      return new Response(transformed.body,{status:transformed.status,statusText:transformed.statusText,headers:h});
    }
    const data=await bundle();
    if(!path.endsWith("/") && data[path+"/"]?.type?.startsWith("text/html")){ url.pathname=path+"/"; return Response.redirect(url.toString(),301); }
    const entry=data[path];
    if(entry){
      const headers=secure(); headers.set("Content-Type",entry.type);
      headers.set("Cache-Control",entry.type.startsWith("text/html")?"public, max-age=300, s-maxage=3600":"public, max-age=3600, s-maxage=86400");
      if(path==="/sitemap.xml"||path==="/robots.txt") headers.set("Cache-Control","public, max-age=300, s-maxage=3600");
      return new Response(entry.body,{status:200,headers});
    }
    const response=await env.ASSETS.fetch(request);
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers:secure(response.headers)});
  }
};
