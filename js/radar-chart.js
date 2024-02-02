class Radar {
  constructor(placeholder, jsonFile) {
    this.data = {};
    this.placeholder = placeholder;
    this.loadJson(jsonFile);
  }

  loadJson = jsonFile => {
    if (!jsonFile || !this.placeholder) {
      console.warn("no json file or placeholder defined");
      return;
    }

    d3.json(jsonFile).then(incomingData => {
      this.data = incomingData["Resultado serviço"];
      this.draw();
    });
  }

  draw() {
    const data = this.data;
    const container = d3.select(this.placeholder);
    const divTooltip = d3.select("body").append("div").attr("class", "tooltip");
    const that = this;

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    function getBounds() { return container.node().getBoundingClientRect(); }
    function getWidth() { return getBounds().width - margin.left - margin.right; }
    function getHeight() { return getBounds().height - margin.top - margin.bottom; }
    function getLegendYPosition() { return getBounds().height - 20; }
    function getLegendXPosition() { return getBounds().width / 2 - 140; }

    container.selectAll("svg").remove();

    const svg = container.append("svg")
      .attr("width", getBounds().width)
      .attr("height", getBounds().height);
    const g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const chartContainer = g.append("g").attr("class", "chart").attr("transform", "translate(" + getWidth() / 2 + ", " + getHeight() / 2 + ")")

    const cfg = {
      w: getWidth(),				        //Width of the circle
      h: getHeight(),				        //Height of the circle
      levels: 6,				            //How many levels or inner circles should there be drawn
      maxValue: this.getMax(data), 	    //What is the value that the biggest circle will represent
      labelFactor: 1.25, 	          //How much farther than the radius of the outer circle should the labels be placed
      wrapWidth: 60, 		            //The number of pixels after which a label needs to be given a new line
      opacityArea: 0.35, 	          //The opacity of the area of the blob
      dotRadius: 4, 			          //The size of the colored circles of each blog
      opacityCircles: 0.1, 	        //The opacity of the circles of each blob
      strokeWidth: 2, 		          //The width of the stroke around each blob
      roundStrokes: false,	        //If true the area and stroke will follow a round path (cardinal-closed)
    };

    const maxValue = this.getMax(data);
    const qtyAxis = this.getAxisQty(data);
    const descAxis = this.getAxisDescription(data);
    const angleSlice = Math.PI * 2 / qtyAxis;
    const radius = Math.min(cfg.w / 2, cfg.h / 2)
    const axisGrid = chartContainer.append("g").attr("class", "axis-wrapper");
    const gChart = chartContainer.append("g").attr("class", "g-chart");

    //Scale for the radius
    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, maxValue]);

    const axis = axisGrid.selectAll(".axis")
      .data(descAxis)
      .enter()
      .append("g")
      .attr("class", "axis");

    //Append the lines
    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(maxValue) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(maxValue) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("class", "line");

    //CHART!
    const arrItems = Object.values(data);

    arrItems.map(item => {
      const categoryName = Object.keys(item)[0];
      const categoryKeys = Object.keys(Object.values(item)[0]);
      const categoryData = Object.values(Object.values(item)[0]);
      const dataValues = [];
      gChart.selectAll()
        .data(categoryData, function (d, i) {
          dataValues.push([
            rScale(d) * Math.cos(angleSlice * i - Math.PI / 2),
            rScale(d) * Math.sin(angleSlice * i - Math.PI / 2)
          ]);
          return dataValues;
        }).data([dataValues])
        .enter()
        .append("polygon")
        .attr("class", function () {
          const categoryLabel = categoryName.toLowerCase() === "custo total" ? "despesas" : categoryName.toLowerCase();
          return "radar-chart-serie " + categoryLabel;
        })
        .attr("points", function (d) {
          let str = "";
          for (const x in d) {
            const horizontal = d[x][0];
            const vertical = d[x][1];
            str = `${str}${horizontal}, ${vertical} `;
          }
          return str;
        })
        .on("mouseover", function () {
          divTooltip.style("visibility", "visible");
        })
        .on("mousemove", function (e, data) {
          const className = this.className.baseVal;
          const tooltipContent = that.getTooltipData(className, arrItems);

          divTooltip.style("opacity", .8);

          divTooltip.html(tooltipContent)
            .style("left", function () {
              const leftPosition = `${e.pageX + 15}px`;
              return leftPosition;
            })
            .style("top", function () {
              const topPosition = `${e.pageY - 50}px`;
              return topPosition;
            });
        })

        .on("mouseout", function (d) {
          divTooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
    });

    //Scale polygons
    const axisScale2 = axisGrid.append("g")
      .attr("class", "axis-scale")
      .selectAll(".levels")
      .data(d3.range(1, (qtyAxis + 1)).reverse())
      .enter()
      .append("polygon")
      .attr("class", "gridPolygons")
      .attr("points", function (d) {
        const dataValues = [];
        for (let i = 0; i < qtyAxis; i++) {
          const value = (maxValue / qtyAxis) * d;
          dataValues.push([
            rScale((value) * Math.cos(angleSlice * i - Math.PI / 2)),
            rScale((value) * Math.sin(angleSlice * i - Math.PI / 2))
          ]);
        }
        return dataValues;
      });

    ///AXIS LEGENDS
    axisGrid.append("g")
      .attr("class", "axis-legend")
      .selectAll()
      .data(descAxis)
      .enter()
      .append("text")
      .attr("class", "legend")
      .text(d => d)
      .attr("dy", "1.5em")
      .attr("transform", function (d, i) { return "translate(0, -10)" })
      .attr("x", function (d, i) {
        return rScale((maxValue) * Math.cos(angleSlice * i - Math.PI / 2)) * 1.2;
      })
      .attr("y", function (d, i) {
        return rScale((maxValue) * Math.sin(angleSlice * i - Math.PI / 2)) * 1.2;
      })
      .attr("text-anchor", "middle")

    const legendContainer = svg.append("g")
      .attr("class", "legend")
      .attr("transform", function () {
        return `translate(${getLegendXPosition()}, ${getLegendYPosition()})`
      });

    legendContainer
      .append("g")
      .attr("class", "receita")
      .append("rect")
      .attrs({ x: 0, y: 0, width: 10, height: 10 })
      .select(function () { return this.parentNode; })
      .append("text")
      .text("Receita")
      .attr("x", "20")
      .attr("y", "10");

    legendContainer
      .append("g")
      .attr("class", "despesas")
      .attr("transform", 'translate(100, 0)')
      .append("rect")
      .attrs({ x: 0, y: 0, width: 10, height: 10 })
      .select(function () { return this.parentNode; })
      .append("text")
      .text("Despesas")
      .attr("x", "20")
      .attr("y", "10");

    legendContainer
      .append("g")
      .attr("class", "resultado")
      .attr("transform", 'translate(200, 0)')
      .append("rect")
      .attrs({ x: 0, y: 0, width: 10, height: 10 })
      .select(function () { return this.parentNode; })
      .append("text")
      .text("Resultado")
      .attr("x", "20")
      .attr("y", "10");
  }

  getTooltipData(className, arrItems) {
    let objItems = {};
    arrItems.forEach(function (item) {
      objItems = { ...objItems, ...item };
    });

    const itemsHash = { despesas: "Custo total", receita: "Receita", resultado: "Resultado" };
    const category = itemsHash[className.split(" ")[1]];
    const categoryData = objItems[category];

    let tooltipDataParsed = "";
    const categoryDataEntries = Object.entries(categoryData);
    for (const [label, value] of categoryDataEntries) {
      tooltipDataParsed += `</br>${label}: ${value}`;
    }

    return `<p>${category.toUpperCase()}${tooltipDataParsed}</p>`;
  }

  getMax = data => {
    let nums = [];
    data.map(item => {
      Object.values(item).map(itemValue => {
        Object.values(itemValue).map(subItemValue => {
          nums.push(subItemValue);
        });
      });
    });
    return d3.max(nums);
  }

  //premise is that all the entries has equal # of items
  getAxisQty = data => {
    return this.getAxisDescription(data).length;
  };

  //premise is that all the entries has equal item names
  getAxisDescription = data => {
    const firstItem = data[0];
    const firstItemArrContent = Object.values(firstItem)[0];
    return Object.keys(firstItemArrContent);
  }
}
