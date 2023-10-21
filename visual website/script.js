(function () {
    const keys = ["0-1", "1-2", "2-3", "3-4", "4-5"];
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(["#b2182b", "#f5d79c", "#ecafa6", "#b55dd4", "#baa8cd"]);
    $(document).ready(function(){
        $('.para span.blod').each(function() {
            var key = $(this).text();
            var colorValue = color(key);
            if (colorValue) {
                $(this).css('color', colorValue);
            }
        });
    });
    const width = 900, height = 500;
    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    svg.append("text")
        .text("Counts of Ratings across each year")
        .attr("font-weight", 600)
        .attr("x", 20)
        .attr("y", 20)
    const margin = {
        left: 50,
        right: 50,
        top: 30,
        bottom: 60
    };
    svg.append("g")
        .attr("transform", `translate(${width - margin.right}, ${margin.top})`)
        .selectAll("circle")
        .data(color.domain())
        .join("circle")
        .attr("r", 6)
        .attr("cx", 10)
        .attr("cy", (d, i) => i * 25)
        .attr("fill", d => color(d))
        .attr("stroke", "#000");
    svg.append("g")
        .attr("font-size", 12)
        .attr("transform", `translate(${width - margin.right}, ${margin.top})`)
        .selectAll("text")
        .data(color.domain())
        .join("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 25)
        .attr("dy", "0.3em")
        .text(d => d)
    d3.csv("./game_ratings_per_year.csv").then(res => {
        const x = d3.scaleBand()
            .domain(res.map(d => d.Year))
            .range([margin.left, width - margin.right]);
        svg.append("text")
            .text("Year")
            .attr("x", width / 2)
            .attr("y", height - 10);
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .call(g => {
                g.selectAll("text")
                    .attr("text-anchor", "start")
                    .attr("transform", `rotate(30)`)
            });
        const y = d3.scaleLinear()
            .domain([0, d3.max(res, d => Math.max(...keys.map(k => d[k])))])
            .range([height - margin.bottom, margin.top])
            .nice();
        svg.append("text")
            .text("Count")
            .attr("x", 15)
            .attr("y", (height + margin.top - margin.bottom) / 2)
            .attr("transform", `rotate(-90,15 ${(height + margin.top - margin.bottom) / 2})`)
        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y));
        svg.append("g")
            .selectAll("g")
            .data(res)
            .join("g")
            .each(function (o) {
                d3.select(this)
                    .selectAll("circle")
                    .data(keys)
                    .join("circle")
                    .attr("cx", x(o.Year) + x.bandwidth() / 2)
                    .attr("cy", height - margin.bottom)
                    .attr("r", 6)
                    .attr("fill-opacity", 0.8)
                    .attr("fill", d => color(d))
                    .attr("stroke", "#000")
                    .style("cursor", "pointer")
                    .on("mousemove", (e, d) => {
                        d3.select(e.target)
                            .attr("r", 8);
                        d3.select("#tooltip")
                            .style("display", "block")
                            .style("left", e.pageX + 10 + "px")
                            .style("top", e.pageY + 10 + "px")
                            .html(`
                                        Year: ${o.Year}
                                        <br />
                                        ${d}: ${o[d]}
                                    `)
                    })
                    .on("mouseleave", (e, d) => {
                        d3.select(e.target)
                            .attr("r", 6);
                        d3.select("#tooltip")
                            .style("display", "none")
                    })
                    .transition()
                    .attr("cy", d => y(o[d]))

            })

    })
})();

(function () {
    const width = 900, height = 800;
    const svg = d3.select("#chart2")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    svg.append("text")
        .text("Relation Among each Genre")
        .attr("font-weight", 600)
        .attr("x", 20)
        .attr("y", 20)
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", ({ transform }) => {
            svg.selectAll("g")
                .attr("transform", transform);
        })
    )
    d3.json("./network_data.json").then(res => {

        res.sort((a, b) => a.year - b.year)
        updateChart(res[0])
        d3.select("#range1")
            .attr("max", res.length - 1)
            .on("change", function (e) {
                updateChart(res[e.target.value]);
            })
    })

    function updateChart(graph) {
        d3.select("#date1")
            .text(graph.year)
        svg.selectAll("g")
            .remove();
        const simulation = d3.forceSimulation(graph.nodes)
            .force("link", d3.forceLink(graph.links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-45))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);
        const scale = d3.scaleLinear()
            .domain(d3.extent(graph.links, d => d.value))
            .range([1, 5])
        const link = svg.append("g")
            .attr("stroke", "#ccc")
            .selectAll("line")
            .data(graph.links)
            .join("line")
            .attr("stroke-width", d => scale(d.value))
            .style("cursor", "pointer")
            .on("mousemove", (e, d) => {
                d3.select(e.target)
                    .attr("stroke", "#000");
                d3.select("#tooltip")
                    .style("display", "block")
                    .style("left", e.pageX + 10 + "px")
                    .style("top", e.pageY + 10 + "px")
                    .html(`
                                source: ${d.source.id}
                                <br />
                                target: ${d.target.id}
                                <br />
                                value: ${d.value}
                            `)
            })
            .on("mouseleave", (e, d) => {
                d3.select(e.target)
                    .attr("stroke", "#ccc");
                d3.select("#tooltip")
                    .style("display", "none")
            })
        const node = svg.append("g")
            .attr("fill", "#baa8cd")
            .selectAll("circle")
            .data(graph.nodes)
            .join("circle")
            .attr("r", 15)
            .style("cursor", "pointer")
            .on("mousemove", (e, d) => {
                d3.select(e.target)
                    .attr("r", 15)
                    .attr("stroke", "#000");
                d3.select("#tooltip")
                    .style("display", "block")
                    .style("left", e.pageX + 10 + "px")
                    .style("top", e.pageY + 10 + "px")
                    .html(`
                                Id: ${d.id}
                            `)
            })
            .on("mouseleave", (e, d) => {
                d3.select(e.target)
                    .attr("r", 15)
                    .attr("stroke", "none");
                d3.select("#tooltip")
                    .style("display", "none")
            })
        const label = svg.append("g")
            .attr("font-size", 10)
            .selectAll("text")
            .data(graph.nodes)
            .join("text")
            .text(d => d.id);
        // update circle's position
        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }
    }

})();
(function () {
    const width = 900, height = 600;
    const svg = d3.select("#chart3")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    svg.append("text")
        .text("Game Sales in major regions")
        .attr("font-weight", 600)
        .attr("x", 20)
        .attr("y", 20)
    let projection = d3
        .geoMercator()
        .scale(100)
        .translate([width / 2, height / 2])
        .center([0, 0]);
    let geoGenerator = d3.geoPath().projection(projection);

    const keys = ["NA_Sales", "EU_Sales", "JP_Sales"];
    const position = {
        NA_Sales: [-100, 40],
        EU_Sales: [10, 51],
        JP_Sales: [139.46, 35.42]
    }
    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(["#b55dd4", "#baa8cd", "#b2182b"]);

    Promise.all([d3.json("./world_countries.json"), d3.json("./sales_per_year.json")]).then(([map, res]) => {
        svg.append("g")
            .selectAll("path")
            .data(map.features)
            .join("path")
            .attr("d", geoGenerator)
            .attr("stroke", "white")
            .attr("fill", "#ccc");
        let rScale = d3.scaleLinear()
            .domain([0, d3.max(res, d => d3.max(keys, k => d[k]))])
            .range([5, 80]);
        let circles = svg.append("g")
            .selectAll("circle")
            .data(keys, d => d)
            .join("circle")
            .attr("cx", d => projection(position[d])[0])
            .attr("cy", d => projection(position[d])[1])
            .attr("fill-opacity", 0.8)
            .attr("fill", d => color(d))
            .attr("stroke", d => color(d))
            .attr("r", d => rScale(res[0][d]))
            .style("cursor", "pointer")
            .on("mousemove", (e, d) => {
                d3.select(e.target)
                d3.select("#tooltip")
                    .style("display", "block")
                    .style("left", e.pageX + 10 + "px")
                    .style("top", e.pageY + 10 + "px")
                    .html(`
                                ${d}: ${res[0][d]}
                            `)
            })
            .on("mouseleave", (e, d) => {
                d3.select("#tooltip")
                    .style("display", "none")
            })

        d3.select("#date2")
            .text(res[0].Year);
        d3.select("#range2")
            .attr("max", res.length - 1)
            .on("change", function (e) {
                let data = res[e.target.value];
                d3.select("#date2")
                    .text(data.Year);
                circles
                    .on("mousemove", (e, d) => {
                        d3.select(e.target)
                        d3.select("#tooltip")
                            .style("display", "block")
                            .style("left", e.pageX + 10 + "px")
                            .style("top", e.pageY + 10 + "px")
                            .html(`
                                ${d}: ${data[d]}
                            `)
                    })
                    .transition()
                    .attr("r", d => rScale(data[d]))
            })
    })

})();
