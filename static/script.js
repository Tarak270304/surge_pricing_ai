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


/* ================= DETECT LOCATION (FIXED) ================= */

function detectLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log("Detected:", lat, lon);

            startCoords = { lat: lat, lon: lon };

            if (startMarker) map.removeLayer(startMarker);

            startMarker = L.marker([lat, lon]).addTo(map);
            map.setView([lat, lon], 14);

            document.getElementById("pickup").value = "Current Location";
        },
        (error) => {
            console.error(error);
            alert("Location access denied");
        }
    );
}


/* ================= GEOCODING ================= */

async function geocode(place){

    let url=`/geocode?q=${encodeURIComponent(place)}`;

    try{

        let res=await fetch(url);
        let data=await res.json();

        if(!Array.isArray(data) || data.length === 0){
            console.warn("Location not found:", place);
            return null;
        }

        return {
            lat:parseFloat(data[0].lat),
            lon:parseFloat(data[0].lon)
        };

    }catch(err){

        console.error("Geocode error:",err);
        return null;

    }

}


/* ================= RIDE CALCULATION ================= */

async function calculateRide(){

    let pickup=document.getElementById("pickup").value;
    let drop=document.getElementById("drop").value;

    let start;
    let end;

    if(startCoords){
        start = startCoords;
    }
    else{
        start = await geocode(pickup);
    }

    end = await geocode(drop);

    if(!start || !end){
        alert("Invalid locations");
        return;
    }

    startCoords = start;
    endCoords = end;

    if(startMarker){
        map.removeLayer(startMarker);
    }

    if(endMarker){
        map.removeLayer(endMarker);
    }

    startMarker = L.marker([start.lat,start.lon]).addTo(map);
    endMarker = L.marker([end.lat,end.lon]).addTo(map);

    map.setView([start.lat,start.lon],13);


    /* ROUTE API */

    let routeURL=`http://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;

    let routeRes=await fetch(routeURL);
    let routeData=await routeRes.json();

    if(!routeData.routes || routeData.routes.length===0){
        alert("Route not found");
        return;
    }

    let coords=routeData.routes[0].geometry.coordinates;
    let latlngs=coords.map(c=>[c[1],c[0]]);

    if(routeLine){
        map.removeLayer(routeLine);
    }

    routeLine=L.polyline(latlngs,{color:'blue'}).addTo(map);


    /* BACKEND API */

    let api=`/estimate?start_lat=${start.lat}&start_lon=${start.lon}&end_lat=${end.lat}&end_lon=${end.lon}`;

    let rideRes=await fetch(api);
    let ride=await rideRes.json();


    /* DISPLAY */

    document.getElementById("locationName").innerText = pickup;

    document.getElementById("traffic").innerText =
    ride.traffic === 1 ? "Low" :
    ride.traffic === 2 ? "Medium" : "High";

    document.getElementById("weather").innerText =
    ride.weather === 0 ? "Clear" :
    ride.weather === 1 ? "Rain" : "Storm";

    document.getElementById("event").innerText =
    ride.event === 1 ? "Yes" : "No";

    document.getElementById("demand").innerText = ride.demand_score;
    document.getElementById("drivers").innerText = ride.drivers_available;
    document.getElementById("ratio").innerText = ride.demand_supply_ratio;

    document.getElementById("fare").innerText =
    `₹${ride.estimated_fare} (${ride.surge_multiplier}x surge)`;


    let recommendation="";

    if(ride.demand_supply_ratio > 1.5){
        recommendation="⚠ High demand detected. Consider waiting.";
    }
    else if(ride.demand_supply_ratio > 1){
        recommendation="⏳ Demand slightly high.";
    }
    else{
        recommendation="✅ Good time to book.";
    }

    document.getElementById("advice").innerText = recommendation;

}


/* ================= SEARCH ================= */

async function searchLocation(query,listId){

    if(query.length < 2) return;

    let url = `/geocode?q=${encodeURIComponent(query)}`;

    try{

        let res = await fetch(url);
        let data = await res.json();

        let list = document.getElementById(listId);
        list.innerHTML = "";

        if(!Array.isArray(data)){
            console.warn("Geocode error:", data);
            return;
        }

        data.forEach(place => {

            if(!place.lat || !place.lon) return;

            let item = document.createElement("div");

            let name = place.display_name.split(",").slice(0,3).join(",");

            item.innerText = name;

            item.onclick = () => {

                if(listId === "pickupList"){
                    document.getElementById("pickup").value = name;
                    startCoords = {
                        lat:parseFloat(place.lat),
                        lon:parseFloat(place.lon)
                    };
                }
                else{
                    document.getElementById("drop").value = name;
                    endCoords = {
                        lat:parseFloat(place.lat),
                        lon:parseFloat(place.lon)
                    };

                    map.setView([
                        parseFloat(place.lat),
                        parseFloat(place.lon)
                    ], 14);
                }

                list.innerHTML = "";
            };

            list.appendChild(item);

        });

    }catch(err){
        console.error("Search failed:", err);
    }

}


/* ================= DRIVER ZONES ================= */

async function loadDriverZones(){

    let res = await fetch("/driver/zones");
    let zones = await res.json();

    let list = document.getElementById("zones");
    list.innerHTML="";

    zones.forEach(zone => {
        let li=document.createElement("li");
        li.innerText = `${zone.area} | Ratio: ${zone.ratio} | Surge: ${zone.surge}`;
        list.appendChild(li);
    });

}
