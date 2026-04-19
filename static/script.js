// ================= BASE URL =================
// IMPORTANT: works both local + render
const BASE_URL = window.location.origin;


// ================= ROLE =================
function setRole(role) {
    document.getElementById("roleSelect").style.display = "none";

    if (role === "user") {
        document.getElementById("userPanel").style.display = "block";
    } else {
        document.getElementById("driverPanel").style.display = "block";
        loadDriverZones();
    }
}


// ================= SEARCH LOCATION =================
async function searchLocation(query, listId) {

    if (!query || query.length < 2) {
        document.getElementById(listId).innerHTML = "";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/geocode?q=${query}`);
        const data = await res.json();

        console.log("Geocode:", data);

        const list = document.getElementById(listId);
        list.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = "<div>No results</div>";
            return;
        }

        data.forEach(place => {
            const div = document.createElement("div");
            div.innerText = place.display_name;

            div.onclick = () => {
                if (listId === "pickupList") {
                    document.getElementById("pickup").value = place.display_name;
                    window.pickupCoords = [place.lat, place.lon];
                } else {
                    document.getElementById("drop").value = place.display_name;
                    window.dropCoords = [place.lat, place.lon];
                }

                list.innerHTML = "";
            };

            list.appendChild(div);
        });

    } catch (err) {
        console.error("Geocode error:", err);
    }
}


// ================= DETECT LOCATION =================
function detectLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        console.log("Detected:", lat, lon);

        window.pickupCoords = [lat, lon];

        document.getElementById("pickup").value = "Current Location";

    }, () => {
        alert("Location access denied");
    });
}


// ================= ESTIMATE =================
async function calculateRide() {

    if (!window.pickupCoords || !window.dropCoords) {
        alert("Select both locations");
        return;
    }

    const [sLat, sLon] = window.pickupCoords;
    const [eLat, eLon] = window.dropCoords;

    try {
        const res = await fetch(
            `${BASE_URL}/estimate?start_lat=${sLat}&start_lon=${sLon}&end_lat=${eLat}&end_lon=${eLon}`
        );

        const data = await res.json();

        console.log("Estimate:", data);

        document.getElementById("traffic").innerText = data.traffic;
        document.getElementById("weather").innerText = data.weather;
        document.getElementById("event").innerText = data.event;
        document.getElementById("demand").innerText = data.demand_score;
        document.getElementById("drivers").innerText = data.drivers_available;
        document.getElementById("ratio").innerText = data.demand_supply_ratio;

        document.getElementById("fare").innerText =
            "₹ " + data.estimated_fare;

    } catch (err) {
        console.error("Estimate error:", err);
    }
}


// ================= DRIVER ZONES =================
async function loadDriverZones() {

    try {
        const res = await fetch(`${BASE_URL}/driver/zones`);
        const data = await res.json();

        const list = document.getElementById("zones");
        list.innerHTML = "";

        data.forEach(zone => {
            const li = document.createElement("li");
            li.innerText =
                `${zone.area} → Surge: ${zone.surge}x (Ratio: ${zone.ratio})`;

            list.appendChild(li);
        });

    } catch (err) {
        console.error("Zones error:", err);
    }
}
