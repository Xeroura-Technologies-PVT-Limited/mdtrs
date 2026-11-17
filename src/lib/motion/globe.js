/* Medtours hero globe: Canvas2D dot-matrix earth with flight arcs into India.
   createGlobe(canvas, opts) -> { setProgress(p), redraw(), destroy() } ; p in 0..1 drives the story. */
const D = Math.PI/180;
// Simplified coastlines [lon,lat], hand-drawn for a dot globe (not survey-accurate).
const LAND = [
 // North America
 [[-168,66],[-162,70],[-156,71.3],[-140,69.6],[-128,70],[-115,68.5],[-95,71],[-82,73],[-70,67],[-62,60],[-56,52.5],[-66,45],[-70,42],[-75.5,38],[-76,35],[-81,31],[-80,25.3],[-82.5,27.5],[-84,30],[-89,30],[-94,29.5],[-97.4,26],[-97.5,22],[-96,19],[-91,18.7],[-90.5,21],[-87,21.5],[-88,16],[-83.5,15],[-83.5,11],[-79.5,9],[-77.4,8.6],[-80,7.5],[-83,8.3],[-86,11],[-88,13.2],[-92,14.5],[-96,15.7],[-100,17],[-105.5,20],[-105.7,23],[-109.5,26.5],[-112.7,29.5],[-114.6,31.4],[-112,26],[-109.5,23],[-111,24],[-114,28],[-115,30],[-117,32.5],[-120.6,34.5],[-122.5,37.5],[-124.2,41],[-124,46],[-124.7,48.4],[-123,49],[-127,50.5],[-130,54],[-134,57.5],[-138,59],[-145,60.5],[-152,59],[-158,57],[-164,54.5],[-157,58.5],[-162,59.8],[-165,62],[-165,64.5]],
 [[-73,78],[-60,82],[-30,83.5],[-20,80],[-18,76],[-21,72],[-24,69],[-32,68],[-40,65],[-43,60],[-48,61],[-52,64.5],[-54,68],[-55,72],[-62,76]],
 [[-80,63.7],[-77,65.5],[-73,67.5],[-77,70],[-88,70.5],[-90,73.5],[-80,73.7],[-71,70.5],[-66,68],[-62,66.5],[-64,63],[-68.5,62.5],[-73,64.5]],
 [[-100,69],[-115,69],[-120,72],[-110,76.5],[-95,76],[-80,76.5],[-75,79],[-62,82.5],[-90,82],[-100,79],[-105,73]],
 [[-84.9,21.9],[-80.5,23.1],[-77.5,21.8],[-74.2,20.2],[-77.7,19.9],[-81.8,22.6]],
 [[-74.4,18.6],[-71,19.9],[-68.4,18.6],[-71.4,17.6]],
 // South America
 [[-77.4,8.6],[-75.5,10.5],[-72,12],[-68,10.6],[-62,10.6],[-60,8.3],[-57,6],[-52,4.5],[-50,1],[-48,-1],[-44,-2.5],[-38.5,-4],[-35,-7],[-35,-9],[-37,-12],[-39,-15],[-39.5,-18],[-41,-22],[-44,-23],[-48.5,-26],[-48.6,-28.5],[-51,-31.5],[-53,-34],[-57,-35.5],[-57.5,-38],[-62,-39],[-65,-41],[-65,-45],[-67.5,-46.5],[-66,-48.5],[-69,-51],[-68.5,-53],[-71,-54],[-74.5,-52],[-75.5,-47],[-73.7,-42],[-73.5,-37],[-71.6,-33],[-71.4,-28],[-70.5,-24],[-70.2,-18.5],[-72,-17],[-76,-14],[-77.5,-11],[-79.5,-7],[-81.2,-5],[-80.3,-1],[-80,1],[-78.8,1.8],[-77.5,4],[-77.3,7]],
 // Eurasia + Africa
 [[-9.5,37],[-9,43],[-1.5,43.5],[-1.5,46.5],[-4.6,48],[-1.5,49.5],[2,51],[4.5,52.5],[8.5,54],[8.2,56.5],[10.5,57.6],[10.5,54.5],[12.5,54.4],[14,53.9],[19,54.4],[21,55.5],[21.5,57.5],[24,58],[28,59.6],[25,60.2],[21.5,61],[21.5,63.5],[25,65],[24,66],[22,65.8],[21,64.5],[19,63.5],[17.5,62],[17.5,60.6],[18.8,59.6],[16.5,57],[16,56],[13,55.4],[12.5,56.5],[11.5,58.5],[10.5,59.5],[8,58],[5.5,59],[5,62],[8,63.5],[12,65],[14,67.5],[16.5,69],[19,70],[23,70.8],[28,71],[31,70],[33,69.3],[40,67.5],[41,66.5],[44,68.5],[53,68.5],[59,68.8],[66,69.5],[68.5,72.5],[73,72.5],[73,68.5],[80,72.5],[87,74],[98,76],[105,77.7],[113,73.7],[120,73],[130,71],[140,72.5],[150,71.5],[160,69.7],[170,70],[180,68.9],[180,65],[178,64.5],[174,61.8],[166,60],[162.5,57.5],[163,55],[156.5,51],[156,57.5],[160,61.5],[155,59.5],[147,59.3],[142.5,59],[137,54],[141,53],[140.5,48.5],[135,43.5],[131.8,43],[129.5,40.5],[129.4,37],[129,35.2],[126.5,34.5],[126.2,37.5],[125,39.6],[121.5,40.5],[122,39],[121,37.5],[122.5,36.8],[119.5,35],[120.8,32],[121.9,31],[121.8,29.5],[119.5,25.5],[117,23.5],[113,22],[110.5,20.5],[108,21.5],[106.5,20.2],[105.7,18.5],[109,13.5],[109,11.5],[105,8.7],[104.8,10.5],[102.5,12.3],[101,12.7],[100,13.5],[99.2,10.2],[100.4,7.2],[103.4,4.2],[104.2,1.4],[101.3,2.9],[98.3,8],[98.4,12.5],[97.6,16.5],[94.4,16],[94.2,19],[92.3,20.8],[92,22.5],[90.6,22.3],[88.8,21.8],[86.8,21.3],[85,19.4],[82.3,16.6],[80.3,15.8],[80,13.1],[79.8,10.3],[78.2,8.9],[77.5,8.1],[76.6,8.9],[75.7,11.4],[74.6,14.7],[73.4,16.5],[72.8,19.2],[72.6,21.3],[70.4,20.8],[69,22.5],[70,22.9],[68.5,23.6],[67.4,24.6],[66.4,25.4],[61.5,25.2],[57.3,25.8],[56.4,27.2],[54.5,26.6],[51.5,27.9],[50.1,30.1],[48,30],[49.3,27.4],[50.8,24.8],[51.6,25.9],[51.6,24.3],[54,24.1],[56.3,26.2],[56.5,24.4],[58.8,23.5],[59.8,22.4],[58.5,20.5],[57.8,19],[55.4,17.6],[52.2,15.6],[49.6,14.6],[45.1,12.9],[43.3,12.6],[42.8,15],[42.6,16.8],[40.9,19.5],[39.1,21.8],[38.4,24],[37,25.8],[35.2,28],[34.7,29.4],[34.9,29.6],[32.6,29.9],[33.5,27],[35.5,24],[37,21],[37.5,18.5],[38.6,17.5],[39.7,15.5],[41.7,13.9],[43.3,12.3],[44.3,10.4],[46.5,10.7],[51.2,11.9],[51,10.4],[49.5,7],[47.9,4.3],[44,0.5],[41.5,-1.8],[39.6,-4.7],[38.9,-6.5],[39.6,-8.7],[40.5,-11],[40.5,-15],[36.8,-18.5],[34.8,-20.5],[35.5,-24],[32.9,-26],[32.4,-29],[30,-31.4],[27.5,-33.3],[24.8,-34.2],[20,-34.8],[18.4,-34.1],[18.2,-31.5],[16.4,-28.6],[15,-26.5],[14.4,-22.7],[13.3,-20.5],[11.7,-17.5],[11.8,-15.8],[13.6,-12.4],[13,-8.8],[12.2,-6],[11.8,-4],[9.6,-2],[9.3,1],[9.6,3.5],[8.5,4.5],[5.8,4.3],[4.5,6.3],[1.6,6.2],[-2,4.8],[-4.6,5.2],[-7.5,4.4],[-9.3,5.5],[-11.4,6.9],[-13.2,8.9],[-15,10.9],[-16.7,12.5],[-17.4,14.7],[-16.3,19.4],[-17,21],[-15.6,24],[-14.4,26.2],[-12.6,28],[-9.8,29.9],[-9.5,32.5],[-6.8,34],[-5.9,35.8],[-2,35.1],[1,36.5],[5.5,36.8],[9.8,37.3],[11,35.2],[10.4,33.8],[11.5,33],[15.3,32.3],[19,30.4],[20,32],[23,32.6],[25,31.8],[29,30.9],[32.3,31.3],[34.3,31.3],[35,33],[35.9,35],[36.1,36.7],[32,36.2],[29.6,36.2],[27.3,37.2],[26.3,38.6],[26.4,40.2],[29,41],[26.3,40.9],[23,40.5],[22.5,37],[21.7,36.8],[21,38.3],[19.5,40.5],[19.4,42],[16,43.5],[13.7,45.5],[12.3,45.3],[12.4,44.2],[13.6,43.5],[16,41.5],[18.5,40.2],[17,39],[16,38],[15.7,40],[13.8,41.2],[12,42],[10.5,43],[8.8,44.4],[7,43.6],[4.6,43.4],[3.1,42.4],[3.2,41.9],[0.8,41],[-0.3,39.4],[0.2,38.7],[-0.7,37.6],[-2.1,36.7],[-4.5,36.6],[-5.6,36],[-6.5,36.9],[-7.4,37.2],[-8.9,37]],
 [[-5.7,50],[1.4,51.2],[1.7,52.7],[0,53.5],[-1.5,55],[-2,56],[-1.8,57.6],[-3,58.6],[-5,58.6],[-6.2,57.3],[-5.6,55.4],[-4.8,54.8],[-3,54],[-3,53.4],[-4.6,53.2],[-4.2,52.3],[-5.3,51.7],[-3.5,51.4]],
 [[-6,52.2],[-6,53.8],[-5.6,54.5],[-7.5,55.3],[-10,54.2],[-10,51.7],[-8,51.6]],
 [[-22,64],[-14,64.5],[-14,66],[-17,66.5],[-24,66]],
 [[130.9,34],[135,34.6],[136.9,34.4],[139.5,35],[140.9,36],[141,38.5],[142,40],[141.3,41.4],[140,40.5],[139.8,38.5],[138.5,37.5],[136.7,37],[135.5,35.6],[133,35.5]],
 [[140,41.5],[141.7,42.6],[145.5,43.3],[144,44],[141.7,45.4],[141.4,43]],
 [[129.8,33.2],[131.9,33.9],[131.4,31.4],[130.2,31.2]],
 [[79.8,6],[80.1,9.8],[81.9,7.4],[81.2,6.2]],
 [[120.1,23],[121,25.3],[121.9,25],[120.8,21.9]],
 [[120.3,18.5],[122.3,18.5],[122,16.2],[124,13],[121,13.6],[120.6,15.4]],
 [[122,7],[125.5,9.8],[126.6,7.2],[125.4,5.6],[123.6,7.8]],
 [[109,1.5],[110,1.7],[111.6,2.9],[113.5,4.7],[115.4,5.4],[117,7],[119.2,5.3],[118,4.3],[118.4,1],[117.6,0],[116.5,-2.5],[116,-3.8],[114.6,-3.6],[111.5,-3],[110,-1.6],[109,0.3]],
 [[95.3,5.6],[97.5,5.2],[100.3,2.1],[103.7,-0.9],[106,-3.1],[105.8,-5.8],[104.5,-5.9],[102.3,-4],[100.9,-2.1],[99.1,0.2],[98,2]],
 [[105.2,-6.8],[108,-6.3],[110.5,-6.9],[112.6,-6.9],[114.5,-7.8],[114.4,-8.7],[111,-8.3],[108.3,-7.8],[105.4,-6.9]],
 [[119.4,-5.5],[120.4,-5.5],[121,-2.7],[123.2,-4.6],[122.4,-3.1],[121.3,-1.9],[123.4,-0.9],[124.6,0.5],[125,1.6],[120.9,1.3],[119.6,0.4],[119.3,-3.4]],
 [[131,-1.3],[134,-0.9],[135.2,-3.4],[138,-1.6],[141,-2.6],[144.5,-3.8],[146,-5.5],[147.7,-6],[147.2,-7.4],[150.5,-10.4],[147.9,-10.1],[146,-8],[143.3,-9],[142.6,-9.3],[141,-9.1],[139,-8.1],[138,-8.4],[137.6,-5.2],[134,-4],[132.5,-3.6],[131.8,-2.7]],
 [[113.4,-22],[114.2,-26],[115,-30],[115.5,-33.7],[117.9,-35.1],[121,-33.8],[124,-33],[126.2,-32.2],[129,-31.6],[131.3,-31.5],[134.3,-32.7],[135.8,-34.8],[137.8,-33],[137.6,-35.3],[139.5,-35.9],[140.6,-38],[143.6,-38.8],[146.3,-39.1],[149.9,-37.5],[150.1,-36.2],[151.3,-33.6],[153.1,-31],[153.6,-28.1],[153.1,-25.2],[150.8,-22.6],[149.2,-21],[146.3,-18.9],[145.4,-16.3],[145.3,-14.9],[143.6,-14],[142.5,-10.7],[141.6,-13.3],[141.5,-15.8],[140.6,-17.6],[139.3,-17.4],[137.4,-16],[135.8,-15],[136.9,-12.3],[135.9,-11.9],[132.6,-11.5],[131.8,-12.3],[129.7,-14.9],[128.3,-14.9],[126.1,-14.1],[124.4,-16.3],[122.2,-17.9],[121.1,-19.5],[118.8,-20.3],[116.7,-20.6],[114.6,-21.8]],
 [[144.6,-40.7],[148.3,-40.9],[148,-43.2],[146,-43.6]],
 [[172.7,-34.4],[174.3,-35.3],[176,-37.6],[178.5,-37.7],[177.9,-39.2],[176.9,-39.4],[175.2,-41.6],[174.6,-39.9],[173.8,-39.2],[174.6,-38]],
 [[172.6,-40.5],[174.3,-41.4],[173.6,-43],[171.3,-44.4],[169.3,-46.6],[166.5,-46],[168.4,-44],[171,-42.4]],
 [[49.3,-12],[50.5,-15.2],[49.5,-17.1],[47.1,-24.9],[45.4,-25.6],[43.8,-23.6],[43.3,-21.8],[44.4,-16.2],[46.3,-15.7],[48.8,-13.1]]
];
const INDIA = [[68.18,23.7],[68.75,23.97],[68.85,24.3],[69.6,24.28],[70.1,24.2],[70.65,24.25],[71.05,24.4],[71.1,24.7],[70.85,25.1],[70.55,25.45],[70.3,25.75],[70.05,26.1],[69.65,26.45],[69.5,26.8],[69.55,27.15],[69.9,27.4],[70.2,27.8],[70.6,28.0],[70.9,28.0],[71.6,28.3],[72.2,28.8],[72.9,29.3],[73.3,29.6],[73.4,29.95],[74.03,30.4],[74.55,30.9],[74.55,31.3],[74.57,31.6],[74.85,31.95],[75.05,32.05],[74.95,32.4],[74.65,32.55],[74.6,32.85],[74.0,32.85],[73.65,33.0],[73.45,33.45],[73.55,34.0],[73.35,34.35],[73.45,34.75],[73.6,35.2],[73.1,35.5],[72.6,35.85],[72.5,36.35],[73.2,36.75],[74.2,36.95],[74.9,37.05],[75.4,36.95],[75.9,36.6],[76.4,36.2],[76.8,36.0],[77.6,35.95],[78.1,35.8],[78.6,35.95],[79.3,35.8],[80.1,35.6],[80.3,35.25],[80.05,34.75],[79.6,34.35],[79.0,34.0],[78.75,33.65],[79.1,33.2],[79.45,32.75],[78.75,32.55],[78.4,32.5],[78.75,31.95],[78.75,31.8],[79.05,31.4],[79.4,31.05],[79.95,30.85],[80.25,30.45],[80.95,30.2],[80.55,29.95],[80.25,29.4],[80.05,28.85],[80.4,28.65],[81.1,28.4],[81.7,27.95],[82.4,27.65],[83.0,27.45],[83.4,27.45],[84.1,27.45],[84.6,27.35],[85.2,26.85],[85.85,26.6],[86.6,26.5],[87.3,26.35],[88.05,26.45],[88.15,26.95],[88.05,27.45],[88.0,27.85],[88.15,28.12],[88.6,28.1],[88.85,27.9],[88.8,27.45],[88.9,27.15],[88.9,26.95],[89.6,26.75],[90.3,26.85],[91.0,26.8],[91.6,26.85],[92.1,26.85],[91.9,27.4],[91.66,27.85],[92.5,28.0],[93.3,28.75],[94.2,29.3],[95.4,29.05],[96.1,29.4],[96.6,28.75],[97.35,28.2],[97.1,27.6],[96.6,27.3],[96.1,27.2],[95.75,26.9],[95.2,26.7],[95.2,26.05],[95.05,25.6],[94.75,25.05],[94.6,24.6],[94.15,23.85],[93.6,24.0],[93.4,23.7],[93.25,22.6],[93.1,22.0],[92.65,21.95],[92.4,22.4],[92.3,22.9],[92.25,23.7],[91.95,23.05],[91.7,22.95],[91.4,23.15],[91.2,23.6],[91.25,24.05],[91.65,24.2],[91.95,24.35],[92.15,24.5],[92.25,24.85],[92.45,24.95],[92.0,25.15],[91.4,25.15],[90.6,25.2],[89.85,25.3],[89.85,25.95],[89.4,26.05],[88.95,26.25],[88.55,26.35],[88.42,26.62],[88.15,26.25],[88.08,25.9],[88.3,25.55],[88.05,25.3],[88.15,24.85],[88.25,24.5],[88.65,24.25],[88.75,23.9],[88.55,23.6],[88.75,23.2],[88.95,22.9],[88.9,22.6],[89.05,22.1],[89.1,21.65],[88.6,21.6],[88.1,21.62],[87.85,21.7],[87.5,21.62],[87.05,21.45],[86.95,21.1],[86.95,20.8],[86.75,20.4],[86.4,20.05],[85.85,19.8],[85.1,19.4],[84.85,19.25],[84.4,18.75],[84.0,18.3],[83.4,17.85],[83.25,17.65],[82.5,17.1],[82.3,16.65],[82.35,16.55],[81.75,16.3],[81.25,16.0],[80.95,15.75],[80.35,15.85],[80.15,15.4],[80.05,14.85],[80.2,14.4],[80.25,13.85],[80.33,13.4],[80.28,13.05],[80.1,12.5],[79.85,11.9],[79.8,11.2],[79.85,10.3],[79.3,10.3],[79.0,10.0],[79.25,9.35],[78.9,9.25],[78.4,9.0],[78.15,8.8],[77.75,8.25],[77.55,8.08],[77.2,8.3],[76.95,8.5],[76.55,8.95],[76.35,9.5],[76.25,9.95],[76.0,10.5],[75.8,11.2],[75.4,11.85],[75.0,12.5],[74.8,12.9],[74.65,13.4],[74.45,14.1],[74.1,14.85],[73.8,15.5],[73.45,16.1],[73.3,16.95],[73.05,17.9],[72.85,18.9],[72.75,19.5],[72.75,20.4],[72.85,20.9],[72.65,21.15],[72.55,21.65],[72.6,22.25],[72.25,21.9],[72.15,21.6],[72.1,21.2],[71.5,20.9],[71.0,20.7],[70.4,20.9],[70.0,21.3],[69.6,21.65],[69.2,22.05],[68.95,22.3],[69.1,22.45],[69.7,22.4],[70.1,22.55],[70.45,22.85],[70.2,23.0],[69.7,22.8],[69.35,22.82],[68.75,23.15],[68.4,23.45]];

const CITIES = [
  {n:'New Delhi', lat:28.6, lon:77.2, dx:10, dy:-8},
  {n:'Mumbai', lat:19.1, lon:72.9, dx:-12, dy:4, a:'right'},
  {n:'Hyderabad', lat:17.4, lon:78.5, dx:10, dy:-4},
  {n:'Bengaluru', lat:12.97, lon:77.6, dx:-12, dy:4, a:'right'},
  {n:'Chennai', lat:13.1, lon:80.3, dx:10, dy:10},
  {n:'Kochi', lat:9.9, lon:76.3, dx:-12, dy:12, a:'right'}
];
const ORIGINS = [
  {n:'London', lat:51.5, lon:-0.1, to:0},
  {n:'Lagos', lat:6.5, lon:3.4, to:1},
  {n:'Nairobi', lat:-1.3, lon:36.8, to:1},
  {n:'Dar es Salaam', lat:-6.8, lon:39.3, to:4},
  {n:'Baghdad', lat:33.3, lon:44.4, to:0},
  {n:'Riyadh', lat:24.7, lon:46.7, to:2},
  {n:'Dubai', lat:25.2, lon:55.3, to:3},
  {n:'Muscat', lat:23.6, lon:58.4, to:5},
  {n:'Tashkent', lat:41.3, lon:69.2, to:0},
  {n:'Dhaka', lat:23.8, lon:90.4, to:4},
  {n:'Malé', lat:4.2, lon:73.5, to:5},
  {n:'Yangon', lat:16.8, lon:96.2, to:2}
];
const INDV = INDIA.map(([lon,lat])=>[Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180), Math.sin(lat*Math.PI/180), Math.cos(lat*Math.PI/180)*Math.cos(lon*Math.PI/180)]);
// Created lazily so the module can be imported during server rendering.
let PLANE_ = null;
const planePath = () => PLANE_ || (PLANE_ = new Path2D('M12 2c.8 0 1.2 1 1.2 2v5.5L21 14v2l-7.8-2.5v5l2.3 1.8V22L12 21l-3.5 1v-1.7l2.3-1.8v-5L3 16v-2l7.8-4.5V4c0-1 .4-2 1.2-2z'));

function inPoly(x, y, poly){
  let c = false;
  for(let i=0, j=poly.length-1; i<poly.length; j=i++){
    const xi=poly[i][0], yi=poly[i][1], xj=poly[j][0], yj=poly[j][1];
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c;
  }
  return c;
}
const BOX = LAND.map(p=>{let a=[180,90,-180,-90];p.forEach(([x,y])=>{a[0]=Math.min(a[0],x);a[1]=Math.min(a[1],y);a[2]=Math.max(a[2],x);a[3]=Math.max(a[3],y);});return a;});
function isLand(lon, lat){
  for(let k=0;k<LAND.length;k++){const b=BOX[k]; if(lon<b[0]||lon>b[2]||lat<b[1]||lat>b[3]) continue; if(inPoly(lon,lat,LAND[k])) return true;}
  return false;
}
const vec = (lat, lon)=>[Math.cos(lat*D)*Math.sin(lon*D), Math.sin(lat*D), Math.cos(lat*D)*Math.cos(lon*D)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const mix=(a,b,t)=>a+(b-a)*t;

export function createGlobe(canvas, opts){
  opts = opts || {};
  const ctx = canvas.getContext('2d');
  const reduce = !!opts.reduce;
  let W=0, H=0, dpr=1, mobile=false;
  let target = opts.start || 0, prog = target;
  let dots = [], built = 0;

  function build(step){
    dots = [];
    for(let lat=-56; lat<=80; lat+=step){
      const n = Math.max(1, Math.round(360*Math.cos(lat*D)/step));
      for(let i=0;i<n;i++){
        const lon = -180 + (i+ (Math.round(lat/step)%2?0.5:0))*360/n;
        if(isLand(lon,lat)) dots.push({v:vec(lat,lon), india: inPoly(lon,lat,INDIA)});
      }
    }
    built = step;
  }
  function size(){
    dpr = Math.min(2, window.devicePixelRatio||1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    mobile = W < 900;
    const step = mobile ? 2.1 : 1.45;
    if(built !== step) build(step);
  }
  // great-circle arcs (geometry recomputed per frame so they can rise onto raised India)
  const N = 140;
  const arcs = ORIGINS.map((o,i)=>{
    const c = CITIES[o.to], a = vec(o.lat,o.lon), b = vec(c.lat,c.lon);
    const om = Math.acos(clamp(a[0]*b[0]+a[1]*b[1]+a[2]*b[2], -1, 1));
    const base=[];
    for(let k=0;k<=N;k++){ const t=k/N, s1=Math.sin((1-t)*om)/Math.sin(om), s2=Math.sin(t*om)/Math.sin(om); base.push([a[0]*s1+b[0]*s2, a[1]*s1+b[1]*s2, a[2]*s1+b[2]*s2, t]); }
    return {base, h: 0.06 + om*0.16, delay: (i%6)*0.035 + Math.floor(i/6)*0.02, speed: 0.075 + (i%4)*0.012, off: i*0.37};
  });

  let now = 0;
  function view(t){
    const f = ease(seg(t, .56, .84));
    const sway = reduce ? 0 : Math.sin(now/1000*0.12)*10;
    const lon0 = mix(44 + sway, 80, f);
    const lat0 = mix(14, 9, f);              // camera swings south: India seen at an angle
    const P = mix(60, 2.6, f);              // perspective strengthens as we close in
    let R0, cx0, cy0, Rz, cxz, cyz;
    if(mobile){ R0 = Math.min(W*0.4, H*0.21); cx0=W/2; cy0=H*0.27; Rz=R0*1.6; cxz=W*0.5; cyz=H*0.46; }
    else { R0 = Math.min(W*0.27, H*0.39); cx0=W*0.68; cy0=H*0.52; Rz=R0*1.75; cxz=W*0.68; cyz=H*0.9; }
    return {lon0, lat0, P, R: mix(R0,Rz,f), R0, cx: mix(cx0,cxz,f), cy: mix(cy0,cyz,f), f,
      cl:Math.cos(lon0*D), sl:Math.sin(lon0*D), ct:Math.cos(lat0*D), st:Math.sin(lat0*D)};
  }
  function proj(v, cam, e){
    const m = 1 + (e||0);
    const x = v[0]*m, y = v[1]*m, z = v[2]*m;
    const x1 = x*cam.cl - z*cam.sl, z1 = x*cam.sl + z*cam.cl;
    const y2 = y*cam.ct - z1*cam.st, z2 = y*cam.st + z1*cam.ct;
    const s = cam.P/(cam.P - z2);
    return [cam.cx + cam.R*x1*s, cam.cy - cam.R*y2*s, z2, x1*s, y2*s];
  }
  const hidden = (q, cam)=>{ const hz = 1/cam.P, hr = cam.P/Math.sqrt(cam.P*cam.P-1); return q[2] < hz && (q[3]*q[3]+q[4]*q[4]) < hr*hr; };
  const lerpQ = (a,b,u)=>[a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, a[2]+(b[2]-a[2])*u, a[3]+(b[3]-a[3])*u, a[4]+(b[4]-a[4])*u];

  function draw(){
    const t = prog, cam = view(t);
    const {cx,cy,R,P,f} = cam;
    const Rs = R*P/Math.sqrt(P*P-1);         // silhouette radius on screen
    const EP = 0.055;                           // pole / map height
    // India sequence plays on its own clock once the camera arrives, so it stays smooth at any scroll speed
    const rise = ease(seg(indiaT, 0, .38));     // India dots rise into poles
    const fill = ease(seg(indiaT, .28, 1));     // solid map fills from the base of the poles
    const fi = rise;
    const Hp = EP*rise, L = EP*fill;
    const E = Hp;                               // arcs and pins sit on top of the poles
    ctx.clearRect(0,0,W,H);
    // atmosphere
    let g = ctx.createRadialGradient(cx,cy,Rs*0.9,cx,cy,Rs*1.28);
    g.addColorStop(0,'rgba(86,113,212,0.20)'); g.addColorStop(0.35,'rgba(86,113,212,0.08)'); g.addColorStop(1,'rgba(86,113,212,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,Rs*1.3,0,Math.PI*2); ctx.fill();
    // body
    g = ctx.createRadialGradient(cx-Rs*.38, cy-Rs*.42, Rs*.05, cx, cy, Rs);
    g.addColorStop(0,'#FFFFFF'); g.addColorStop(.55,'#F3F6FC'); g.addColorStop(1,'#D9E3F4');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,Rs,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(20,58,102,0.10)'; ctx.lineWidth=1; ctx.stroke();

    // world dots
    const B = 7, paths=[];
    for(let i=0;i<B;i++) paths.push(new Path2D());
    const base = (mobile?0.0105:0.0072) * (cam.R0 + (R-cam.R0)*0.55);
    const hz = 1/P, india=[];
    for(const d of dots){
      if(d.india){ india.push(d); continue; }
      const p = proj(d.v, cam, 0); if(p[2] <= hz+0.01) continue;
      if(p[0] < -10 || p[0] > W+10 || p[1] < -10 || p[1] > H+10) continue;
      const depth = (p[2]-hz)/(1-hz);
      const b = Math.min(B-1, Math.floor(depth*B));
      const r = base*(0.55+0.45*depth)*(P/(P-p[2]))*0.9;
      paths[b].moveTo(p[0]+r,p[1]); paths[b].arc(p[0],p[1],r,0,Math.PI*2);
    }
    for(let i=0;i<B;i++){ ctx.fillStyle=`rgba(20,58,102,${0.1 + 0.72*Math.pow((i+0.5)/B,0.9) - 0.25*f*((i+0.5)/B)})`; ctx.fill(paths[i]); }

    // India: dots become poles, then a solid map fills up from their base
    const indiaOn = 0.35 + 0.65*seg(t,.3,.7);
    const poles = [];
    for(const d of india){
      const pb = proj(d.v, cam, 0); if(pb[2] <= hz+0.01) continue;
      const depth=(pb[2]-hz)/(1-hz);
      poles.push({d, pb, depth, pt: Hp>0.0005 ? proj(d.v, cam, Hp) : pb, pl: L>0.0005 ? proj(d.v, cam, L) : pb});
    }
    poles.sort((a,b)=>a.pt[2]-b.pt[2]);
    const dotR = p=>base*(0.55+0.45*p.depth)*(P/(P-p.pt[2]))*1.05;
    if(rise<0.001){
      for(const p of poles){
        const a = 0.12 + 0.75*Math.pow(p.depth,0.9);
        ctx.fillStyle = `rgba(86,113,212,${Math.min(1,(a*1.25)*indiaOn + (1-indiaOn)*a)})`;
        ctx.beginPath(); ctx.arc(p.pb[0],p.pb[1],dotR(p),0,Math.PI*2); ctx.fill();
      }
    } else {
      // glow under India
      const ic = proj(vec(22,79), cam, Hp);
      g = ctx.createRadialGradient(ic[0], ic[1], 0, ic[0], ic[1], R*0.45);
      g.addColorStop(0, `rgba(86,113,212,${0.18*rise})`); g.addColorStop(1,'rgba(86,113,212,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ic[0],ic[1],R*0.45,0,Math.PI*2); ctx.fill();
      // the solid, filled up to level L
      const solidA = clamp(fill*2.6);
      if(L>0.0005){
        ctx.globalAlpha = solidA;
        const top = INDV.map(v=>proj(v,cam,L)), bot = INDV.map(v=>proj(v,cam,0));
        const walls=[];
        for(let i=0;i<INDV.length;i++){
          const j=(i+1)%INDV.length;
          const ex=top[j][0]-top[i][0], ey=top[j][1]-top[i][1], Lw=Math.hypot(ex,ey)||1;
          walls.push({i,j,z:(top[i][2]+top[j][2])/2,lit:clamp(0.5 + 0.5*((ey/Lw)*-0.55 + (-ex/Lw)*-0.83))});
        }
        walls.sort((a,b)=>a.z-b.z);
        for(const w of walls){
          const l=w.lit;
          ctx.fillStyle=`rgb(${20+42*l|0},${58+37*l|0},${102+58*l|0})`;
          ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=0.6;
          ctx.beginPath(); ctx.moveTo(top[w.i][0],top[w.i][1]); ctx.lineTo(top[w.j][0],top[w.j][1]); ctx.lineTo(bot[w.j][0],bot[w.j][1]); ctx.lineTo(bot[w.i][0],bot[w.i][1]); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
        const face = new Path2D();
        top.forEach((q,i)=>{ i?face.lineTo(q[0],q[1]):face.moveTo(q[0],q[1]); minx=Math.min(minx,q[0]);maxx=Math.max(maxx,q[0]);miny=Math.min(miny,q[1]);maxy=Math.max(maxy,q[1]); }); face.closePath();
        g = ctx.createLinearGradient(minx, miny, maxx, maxy);
        g.addColorStop(0,'#A3B3EE'); g.addColorStop(.45,'#7189E0'); g.addColorStop(1,'#4F67CB');
        ctx.fillStyle=g; ctx.fill(face);
        ctx.save(); ctx.clip(face);
        g = ctx.createLinearGradient(minx, miny, minx+(maxx-minx)*0.75, maxy);
        g.addColorStop(0,'rgba(255,255,255,0.32)'); g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=g; ctx.fillRect(minx,miny,maxx-minx,maxy-miny);
        ctx.restore();
        ctx.lineJoin='round'; ctx.strokeStyle=`rgba(255,255,255,${0.55+0.35*fill})`; ctx.lineWidth=1.3; ctx.stroke(face);
        ctx.globalAlpha = 1;
      }
      // poles: the part still above the fill line, with their caps
      ctx.lineCap='round';
      for(const p of poles){
        const r = dotR(p);
        if(Hp-L > 0.0008){
          ctx.strokeStyle='rgba(20,58,102,0.22)'; ctx.lineWidth=r*1.5;
          ctx.beginPath(); ctx.moveTo(p.pl[0],p.pl[1]); ctx.lineTo(p.pt[0],p.pt[1]); ctx.stroke();
          ctx.strokeStyle='rgba(86,113,212,0.55)'; ctx.lineWidth=r*0.8;
          ctx.beginPath(); ctx.moveTo(p.pl[0],p.pl[1]); ctx.lineTo(p.pt[0],p.pt[1]); ctx.stroke();
        }
        const capA = 1 - solidA*fill*0.82;
        const a = 0.12 + 0.75*Math.pow(p.depth,0.9);
        ctx.fillStyle = `rgba(86,113,212,${Math.min(1,a*1.25+0.15)*capA})`;
        ctx.beginPath(); ctx.arc(p.pt[0],p.pt[1],r,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(255,255,255,${0.5*capA + 0.25*fill})`; ctx.beginPath(); ctx.arc(p.pt[0]-r*.28,p.pt[1]-r*.32,r*.36,0,Math.PI*2); ctx.fill();
      }
    }
    // sheen
    g = ctx.createRadialGradient(cx-Rs*.45, cy-Rs*.5, 0, cx-Rs*.45, cy-Rs*.5, Rs*.9);
    g.addColorStop(0,`rgba(255,255,255,${0.5*(1-f*0.6)})`); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,Rs,0,Math.PI*2); ctx.fill();

    const k = Math.sqrt(R/(mobile?120:220));
    // origins
    const oa = seg(t,.06,.2);
    if(oa>0){
      ctx.font = `500 ${mobile?9.5:10.5}px "DM Mono", ui-monospace, monospace`;
      ORIGINS.forEach((o,i)=>{
        const p = proj(vec(o.lat,o.lon), cam, 0); if(p[2]<=hz+0.03) return;
        const a = oa*clamp(p[2]*1.6)*(1-seg(t,.62,.78)*0.85);
        const pulse = (now/1000*0.8 + i*0.27)%1;
        ctx.strokeStyle=`rgba(20,58,102,${a*(1-pulse)*0.5})`; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(p[0],p[1],3+pulse*12*k,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle=`rgba(20,58,102,${a})`; ctx.beginPath(); ctx.arc(p[0],p[1],2.6,0,Math.PI*2); ctx.fill();
        if(!mobile || i%2===0){ ctx.fillStyle=`rgba(74,98,131,${a})`; ctx.fillText(o.n.toUpperCase(), p[0]+7, p[1]-6); }
      });
    }
    // arcs + flights (sub-sample interpolation for smooth motion)
    const ap = seg(t,.2,.56);
    if(ap>0){
      arcs.forEach(arc=>{
        const local = clamp((ap - arc.delay)/(1-0.24));
        if(local<=0) return;
        const pr = arc.base.map(b=>{ const tt=b[3]; return proj(b, cam, arc.h*Math.sin(Math.PI*tt) + E*tt*tt); });
        const endF = local*N, nEnd = Math.floor(endF);
        ctx.lineWidth = 1.4*k; ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.strokeStyle='rgba(86,113,212,0.72)';
        ctx.beginPath(); let open=false;
        for(let j=0;j<=Math.min(N,nEnd+1);j++){
          const q = j>nEnd ? lerpQ(pr[nEnd], pr[Math.min(N,nEnd+1)], endF-nEnd) : pr[j];
          if(!hidden(q,cam)){ if(!open){ctx.moveTo(q[0],q[1]);open=true;} else ctx.lineTo(q[0],q[1]); } else open=false;
        }
        ctx.stroke();
        const life = local<1 ? local : ((now/1000)*arc.speed + arc.off)%1;
        const at = u=>{ const fi = clamp(u)*N, i0 = Math.min(N-1, Math.floor(fi)); return lerpQ(pr[i0], pr[i0+1], fi-i0); };
        const q = at(life);
        if(!hidden(q,cam)){
          for(let s=1;s<=14;s++){ const qq = at(life - s*0.0045); if(hidden(qq,cam)) break;
            ctx.fillStyle=`rgba(86,113,212,${0.32*(1-s/15)})`; ctx.beginPath(); ctx.arc(qq[0],qq[1],Math.max(0.4,(2.4-s*0.13)*k),0,Math.PI*2); ctx.fill(); }
          const qa = at(life - 0.006), qb = at(life + 0.006);
          const ang = Math.atan2(qb[1]-qa[1], qb[0]-qa[0]) + Math.PI/2;
          ctx.save(); ctx.translate(q[0],q[1]); ctx.rotate(ang); const sc=0.62*k; ctx.scale(sc,sc); ctx.translate(-12,-12);
          ctx.fillStyle='#5671D4'; ctx.strokeStyle='#FFFFFF'; ctx.lineWidth=1.6/sc; ctx.stroke(planePath()); ctx.fill(planePath()); ctx.restore();
        }
      });
    }
    // Indian cities on the raised land
    const ca = seg(t,.6,.82);
    if(ca>0 || ap>0.6){
      const a0 = Math.max(ca, (seg(ap,.6,1))*0.6);
      ctx.font = `600 ${mobile?13:15}px "Instrument Sans", system-ui, sans-serif`;
      CITIES.forEach((c,i)=>{
        const p = proj(vec(c.lat,c.lon), cam, Hp); if(p[2]<=hz+0.02) return;
        const pulse=(now/1000*0.7+i*0.18)%1;
        ctx.strokeStyle=`rgba(86,113,212,${a0*(1-pulse)})`; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.arc(p[0],p[1],4+pulse*16*k,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle='#FFFFFF'; ctx.beginPath(); ctx.arc(p[0],p[1],5.4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(20,58,102,${Math.max(a0,.5)})`; ctx.beginPath(); ctx.arc(p[0],p[1],3.5,0,Math.PI*2); ctx.fill();
        if(ca>0){
          ctx.globalAlpha = ca; ctx.textAlign = c.a==='right'?'right':'left';
          ctx.lineWidth=5; ctx.strokeStyle='rgba(247,249,253,0.92)'; ctx.strokeText(c.n, p[0]+c.dx, p[1]+c.dy);
          ctx.fillStyle='#143A66'; ctx.fillText(c.n, p[0]+c.dx, p[1]+c.dy);
          ctx.textAlign='left'; ctx.globalAlpha=1;
        }
      });
    }
  }
  let running=false, visible=true, last=0, indiaT=0, dead=false;
  function loop(ts){
    const dt = Math.min(0.05, last ? (ts-last)/1000 : 0.016); last = ts; now = ts;
    prog += (target - prog) * (reduce ? 1 : (1 - Math.exp(-dt*5)));
    if(Math.abs(target-prog)<0.0005) prog = target;
    const want = seg(prog, .56, .9);            // India sequence follows the scroll position
    if(reduce) indiaT = want;
    else { indiaT += (want - indiaT) * (1 - Math.exp(-dt*6)); if(Math.abs(want-indiaT)<0.001) indiaT = want; }
    draw();
    if(dead) { running=false; return; }
    if(!reduce && visible) requestAnimationFrame(loop); else { running=false; last=0; }
  }
  function start(){ if(running) return; running=true; requestAnimationFrame(loop); }
  const onResize=()=>{ size(); if(!running) draw(); };
  size(); addEventListener('resize', onResize);
  let io=null;
  if('IntersectionObserver' in window){
    io=new IntersectionObserver(([e])=>{ visible=e.isIntersecting; if(visible) start(); }); io.observe(canvas);
  }
  now = performance.now(); start();
  return {
    setProgress(p){ target = clamp(p); if(reduce){ prog=target; indiaT = seg(prog,.56,.9); draw(); } else start(); },
    redraw(){ size(); draw(); },
    destroy(){ dead=true; removeEventListener('resize', onResize); io&&io.disconnect(); }
  };
}
