// Dimensiones del SVG
const baseWidth = 800;
const baseHeight = 600;
let selectedRegion = null;

// Crear el SVG dentro del contenedor "mapa"
const svg = d3.select("#mapa")
              .append("svg")
              .attr("preserveAspectRatio", "xMidYMid meet")
              .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
              .classed("responsive-svg", true);

// Definir la proyección. Se centra aproximadamente en España.
const projection = d3.geoMercator()
                     .center([-3.9, 38.65])
                     .scale(2400)
                     .translate([baseWidth / 2, baseHeight / 2]);

// Crear una función path usando la proyección definida
const path = d3.geoPath().projection(projection);

// Cargar el archivo GeoJSON
d3.json("/resources/spain-communities.geojson").then(data => {
  svg.selectAll("path")
     .data(data.features)
     .enter()
     .append("path")
     // Asignar el atributo "data-region" para identificar cada comunidad
     .attr("data-region", d => getRegionId(d.properties.name))
     .attr("d", path)
     .attr("fill", "#ccc")
     .attr("stroke", "#333")
     .attr("stroke-width", 1)
     // Si la comunidad es Canarias, aplicar transformación para acercarla
     .attr("transform", d => {
         if (d.properties.name && d.properties.name.includes("Canarias")) {
             return "translate(230,-260)";
         }
         return "";
     })
     // Al hacer clic, se actualiza la bandera, descripción y se maneja el color seleccionado
     .on("click", function(event, d) {
         const clickedRegionId = getRegionId(d.properties.name);
         // Si hay una región previamente seleccionada y es distinta de la actual, deseleccionarla
         if (selectedRegion && selectedRegion !== clickedRegionId) {
             svg.select(`path[data-region="${selectedRegion}"]`).attr("fill", "#ccc");
         }
         selectedRegion = clickedRegionId;
         d3.select(this).attr("fill", "green");
         handleRegionClick(d);
     })
     .on("mouseover", function(event, d) {
         const regionId = getRegionId(d.properties.name);
         if (selectedRegion === regionId) return;
         d3.select(this).attr("fill", "orange");
     })
     .on("mouseout", function(event, d) {
         const regionId = getRegionId(d.properties.name);
         if (selectedRegion === regionId) return;
         d3.select(this).attr("fill", "#ccc");
     })
     .append("title")
     .text(d => d.properties.name);
}).catch(error => {
  console.error("Error al cargar el GeoJSON:", error);
});

// Función que maneja el clic en una comunidad
function handleRegionClick(regionData) {
    // Actualizar la imagen de la bandera
    let regionName = regionData.properties.name;
    let regionId = getRegionId(regionName);
    document.getElementById("region-image").src = "images/" + regionId + ".png";
  
    // Realizar la llamada AJAX al servidor para obtener la descripción de la comunidad
    fetch("/descripcion?region=" + encodeURIComponent(regionData.properties.wikipedia))
      .then(response => response.json())
      .then(data => {
        document.getElementById("description").innerHTML = data.extract;
      })
      .catch(error => {
        document.getElementById("description").innerHTML = "Error al cargar la descripción.";
      });
}

// Función para generar un ID basado en el nombre de la comunidad (minúsculas, sin acentos y sin espacios)
const getRegionId = (regionName) => {
    return regionName.toLowerCase()
                     .normalize("NFD")
                     .replace(/[\u0300-\u036f]/g, "")
                     .replace(/\s+/g, '');
};