function setRole(role){

document.getElementById("roleSelect").style.display="none";

if(role === "user"){
document.getElementById("userPanel").style.display="block";
}
else{
document.getElementById("driverPanel").style.display="block";
loadDriverZones();
}

}


/* ================= MAP INIT ================= */

let startMarker=null;
let endMarker=null;
let routeLine=null;

let startCoords=null;
let endCoords=null;

let map = L.map('map').setView([17.3850,78.4867],12);

setTimeout(()=>{
map.invalidateSize();
},500);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map);


/* ================= GEOCODING ================= */

async function geocode(place){

if(!place || place.trim()===""){
alert("Please enter a location");
return null;
}

let url = `/geocode?q=${encodeURIComponent(place)}`;

try{

let res = await fetch(url);
let data = await res.json();

if(!data || data.length===0 || !data[0].lat){
alert("Location not found: "+place);
return null;
}

return {
lat: parseFloat(data[0].lat),
lon: parseFloat(data[0].lon)
};

}catch(err){

console.error("Geocode error:",err);
alert("Location search failed");
return null;

}

}


/* ================= RIDE CALCULATION ================= */

async function calculateRide(){

let pickup=document.getElementById("pickup").value;
let drop=document.getElementById("drop").value;

let start;
let end;

/* Use detected location if available */

if(startCoords){
start = startCoords;
}
else{
start = await geocode(pickup);
}

/* Drop must still be geocoded */

end = await geocode(drop);

if(!start || !end){
return;
}

startCoords = start;
endCoords = end;


/* Remove old markers */

if(startMarker){
map.removeLayer(startMarker);
}

if(endMarker){
map.removeLayer(endMarker);
}


/* Add new markers */

startMarker = L.marker([start.lat,start.lon]).addTo(map);
endMarker = L.marker([end.lat,end.lon]).addTo(map);

map.setView([start.lat,start.lon],13);


/* ================= ROUTE API ================= */

let routeURL=`http://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;

let routeRes=await fetch(routeURL);
let routeData=await routeRes.json();

/* ROUTE SAFETY CHECK */

if(!routeData.routes || routeData.routes.length===0){
alert("Route not found");
return;
}

let coords=routeData.routes[0].geometry.coordinates;

let latlngs=coords.map(c=>[c[1],c[0]]);


/* Remove old route */

if(routeLine){
map.removeLayer(routeLine);
}


/* Draw new route */

routeLine=L.polyline(latlngs,{color:'blue'}).addTo(map);


/* ================= BACKEND API ================= */

let api=`http://127.0.0.1:8000/estimate?start_lat=${start.lat}&start_lon=${start.lon}&end_lat=${end.lat}&end_lon=${end.lon}`;

let rideRes=await fetch(api);
let ride=await rideRes.json();


/* ================= DISPLAY DATA ================= */

document.getElementById("locationName").innerText = pickup;


/* Traffic */

document.getElementById("traffic").innerText =
ride.traffic === 1 ? "Low" :
ride.traffic === 2 ? "Medium" : "High";


/* Weather */

document.getElementById("weather").innerText =
ride.weather === 0 ? "Clear" :
ride.weather === 1 ? "Rain" : "Storm";


/* Event */

document.getElementById("event").innerText =
ride.event === 1 ? "Yes" : "No";


document.getElementById("demand").innerText = ride.demand_score;

document.getElementById("drivers").innerText = ride.drivers_available;

document.getElementById("ratio").innerText = ride.demand_supply_ratio;


/* Fare */

document.getElementById("fare").innerText =
`₹${ride.estimated_fare} (${ride.surge_multiplier}x surge)`;


/* Recommendation */

let recommendation="";

if(ride.demand_supply_ratio > 1.5){
recommendation="⚠ High demand detected. Consider waiting to reduce fare.";
}
else if(ride.demand_supply_ratio > 1){
recommendation="⏳ Demand slightly high. Booking now may cost more.";
}
else{
recommendation="✅ Good time to book. Supply is sufficient.";
}

document.getElementById("advice").innerText = recommendation;

}


/* ================= LOCATION SEARCH ================= */

async function searchLocation(query,listId){

if(query.length < 3) return;

let viewbox = "77.9,17.9,78.9,16.9";

let url = `/geocode?q=${encodeURIComponent(query)}`;

let res = await fetch(url);
let data = await res.json();

let list = document.getElementById(listId);
list.innerHTML = "";

data.forEach(place => {

let item = document.createElement("div");

let name = place.display_name.split(",").slice(0,3).join(",");

item.innerText = name;

item.onclick = () => {

if(listId === "pickupList"){

document.getElementById("pickup").value = name;

startCoords = {
lat: parseFloat(place.lat),
lon: parseFloat(place.lon)
};

}
else{

document.getElementById("drop").value = name;

endCoords = {
lat: parseFloat(place.lat),
lon: parseFloat(place.lon)
};

map.setView([place.lat, place.lon], 14);

}

list.innerHTML = "";

};

list.appendChild(item);

});

}


/* ================= DETECT LOCATION ================= */

async function detectLocation(){

navigator.geolocation.getCurrentPosition(async function(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

startCoords = {lat:lat,lon:lon};

if(startMarker){
map.removeLayer(startMarker);
}

startMarker = L.marker([lat,lon]).addTo(map);

map.setView([lat,lon],15);

let url=`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

let res = await fetch(url);
let data = await res.json();

document.getElementById("pickup").value = data.display_name;

});

}


/* ================= DRIVER DEMAND ================= */

function showDriverDemand(){

for(let i=0;i<20;i++){

let lat = 17.3 + Math.random()*0.2
let lon = 78.4 + Math.random()*0.2

L.circleMarker([lat,lon],{
radius:8,
color:"green"
}).addTo(map)

}

}


/* ================= SURGE HEATMAP ================= */

async function loadSurgeHeatmap(){

let zones = [
[17.3850,78.4867],
[17.4435,78.3772],
[17.4500,78.3900],
[17.3616,78.4747],
[17.4948,78.3996],
[17.4065,78.4772]
];

let heatData=[];

for(let z of zones){

let api=`http://127.0.0.1:8000/estimate?start_lat=${z[0]}&start_lon=${z[1]}&end_lat=${z[0]+0.01}&end_lon=${z[1]+0.01}`;

let res=await fetch(api);
let data=await res.json();

heatData.push([z[0],z[1],data.surge_multiplier]);

}

L.heatLayer(heatData,{
radius:40,
blur:30,
maxZoom:13
}).addTo(map);

}

loadSurgeHeatmap();


/* ================= DRIVER ZONES ================= */

async function loadDriverZones(){

let res = await fetch("http://127.0.0.1:8000/driver/zones");

let zones = await res.json();

let list = document.getElementById("zones");

list.innerHTML="";

zones.forEach(zone => {

let li=document.createElement("li");

li.innerText =
zone.area +
" | Ratio: " + zone.ratio +
" | Surge: " + zone.surge;

list.appendChild(li);

});

}