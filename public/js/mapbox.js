
export const displayMap = (locations) => {

    mapboxgl.accessToken = 'pk.eyJ1Ijoic2hhcmV2aWRlb2NvZGUiLCJhIjoiY2tudnY0cWpwMG10MTJ2bGdzOTBuMDRiOSJ9.UefoJKFeUzE2I0n4R8pBMA';
    var map = new mapboxgl.Map({
     container: 'map',
     style: 'mapbox://styles/sharevideocode/cknwl7r2d08sx17npmiezqge7',
     scrollZoom: false
    });
    
    const bound = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc => {
        // create marker
        const el = document.createElement('div');
        el.className = 'marker';
    
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
    
        // Add popup
        new mapboxgl.Popup({
            offsite: 30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description} </p>`)
        .addTo(map)
    
        // Extends map bound to include current location
        bound.extend(loc.coordinates);
    });
    
    map.fitBounds(bound, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });    
}