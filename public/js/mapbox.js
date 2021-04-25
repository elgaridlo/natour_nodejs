const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log('helllooooooooo = ', locations)

mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhcmV2aWRlb2NvZGUiLCJhIjoiY2tudnY0cWpwMG10MTJ2bGdzOTBuMDRiOSJ9.UefoJKFeUzE2I0n4R8pBMA';
var map = new mapboxgl.Map({
 container: 'map',
 style: 'mapbox://styles/mapbox/streets-v11'
});
