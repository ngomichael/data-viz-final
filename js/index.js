'use strict';

(function() {
  let data = 'no data';
  let svgLineGraph = ''; // keep SVG reference in global scope
  let selectedCrime = 'Aggravated_assault_rate';
  let svgScatterPlot = '';
  let tooltip = '';

  // load data and make line graph after window loads
  window.onload = function() {
    // make tooltip
    tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    svgScatterPlot = tooltip
      .append('svg')
      .attr('width', 400)
      .attr('height', 300);

    fetch('./data/us_crime.json')
      .then(res => res.json()) // res is returned from the above fetch
      .then(jsonData => {
        data = jsonData;
        makeDropdown();
        makeLineGraph();
      }); // data is returned from last .then
  };

  // // make line graph
  function makeLineGraph() {
    console.log(data);
    svgLineGraph = d3
      .select('body')
      .append('svg')
      .attr('class', 'line-graph')
      .attr('width', 800)
      .attr('height', 500);

    // get arrays of population data and year data
    const crime_rate_data = data.map(row => {
      const parsedNum =
        typeof row[selectedCrime] === 'string' &&
        row[selectedCrime].includes(',')
          ? parseFloat(row[selectedCrime].replace(/,/g, ''))
          : parseFloat(row[selectedCrime]);
      return parsedNum;
    });

    const year_data = data.map(row => parseInt(row['Year']));

    // find data limits
    const axesLimits = findMinMax(year_data, crime_rate_data);

    // draw title and axes labels
    makeLabels();

    // draw axes and return scaling + mapping functions
    const mapFunctions = drawAxes(
      axesLimits,
      'time',
      { selectedCrime },
      svgLineGraph,
      { min: 50, max: 750 },
      { min: 50, max: 450 }
    );
    // plot data as points and add tooltip functionality
    plotData(mapFunctions);
  }

  // make title and axes labels
  function makeLabels() {
    const crimeName = selectedCrime
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    svgLineGraph
      .append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text(`${crimeName} Change Over Time`);

    svgLineGraph
      .append('text')
      .attr('x', 375)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgLineGraph
      .append('text')
      .attr('transform', 'translate(10, 320)rotate(-90)')
      .style('font-size', '10pt')
      .text(crimeName);
  }

  // create dropdown to filter data points
  function makeDropdown() {
    // get all unique countries to include in dropdown
    const dropdownCrimes = [
      'Aggravated Assault Rate',
      'Burglary Rate',
      'Larceny Theft Rate',
      'Motor Vehicle Theft Rate',
      'Murder and Nonnegligent Manslaughter Rate',
      'Property Crime Rate',
      'Rape Rate',
      'Robbery Rate',
      'Violent Crime Rate',
    ].sort();

    // create select element and add an on change event handler to update shown country
    const dropdown = d3
      .select('#filter')
      .append('select')
      .attr('name', 'crime-list')
      .on('change', function() {
        selectedCrime = this.value
          .split(' ')
          .map((word, idx) => {
            return idx === 0
              ? word.charAt(0).toUpperCase() + word.slice(1)
              : word.charAt(0).toLowerCase() + word.slice(1);
          })
          .join('_');

        d3.selectAll('.line').remove();
        d3.select('.line-graph').remove();
        makeLineGraph();
        // plotData(mapFunctions);
      });

    // add dropdown options with the country as text
    dropdown
      .selectAll('option')
      .data(dropdownCrimes)
      .enter()
      .append('option')
      .text(d => d)
      .attr('value', d => d);

    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    // add click event listener to update dropdown value and filter data points by previous country in list
    prevButton.addEventListener('click', () => {
      const select = document.getElementsByTagName('select')[0];

      if (select.selectedIndex > 0) {
        select.selectedIndex--;
        select.dispatchEvent(new Event('change'));
      } else if (select.selectedIndex === 0) {
        select.selectedIndex = dropdownCrimes.length - 1;
        select.dispatchEvent(new Event('change'));
      }
    });

    // add click event listener to update dropdown value and filter data points by next country in list
    nextButton.addEventListener('click', () => {
      const select = document.getElementsByTagName('select')[0];

      if (select.selectedIndex !== dropdownCrimes.length - 1) {
        select.selectedIndex++;
        select.dispatchEvent(new Event('change'));
      } else if (select.selectedIndex === dropdownCrimes.length - 1) {
        select.selectedIndex = 0;
        select.dispatchEvent(new Event('change'));
      }
    });
  }

  // draw lines on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    const xScale = map.xScale;
    const yScale = map.yScale;

    const line = d3
      .line()
      .x(d => xScale(d.Year))
      .y(d => {
        const parsedNum =
          typeof d[selectedCrime] === 'string' && d[selectedCrime].includes(',')
            ? parseFloat(d[selectedCrime].replace(/,/g, ''))
            : parseFloat(d[selectedCrime]);

        return yScale(parsedNum);
      })
      .curve(d3.curveMonotoneX);

    // draw line for chosen country and add tooltip functionality
    svgLineGraph
      .append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line)
      // add tooltip functionality to line
      .on('mouseover', () => {
        tooltip
          .transition()
          .duration(200)
          .style('opacity', 1);

        const yPos =
          d3.event.pageY < 325 ? d3.event.pageY + 15 : d3.event.pageY - 325;

        tooltip
          .style('left', d3.event.pageX + 10 + 'px')
          .style('top', yPos + 'px');

        makeScatterPlot();
      })
      .on('mouseout', () => {
        tooltip
          .transition()
          .duration(500)
          .style('opacity', 0);
      });
  }

  // create scatter plot for tooltip
  function makeScatterPlot() {
    svgScatterPlot.html('');
    const xAxisData = data.map(row => row['Year']);
    const yAxisData = data.map(row => parseInt(row['Rape'].replace(/,/g, '')));
    console.log(xAxisData);
    console.log(yAxisData);

    let minMax = findMinMax(xAxisData, yAxisData);

    minMax = {
      xMin: minMax.xMin,
      xMax: minMax.xMax,
      yMin: minMax.yMin / 1000,
      yMax: minMax.yMax / 1000,
    };

    console.log(minMax);

    const funcs = drawAxes(
      minMax,
      'Year',
      'Rape',
      svgScatterPlot,
      { min: 50, max: 350 },
      { min: 50, max: 250 }
    );

    plotScatterPlot(funcs);
  }

  // plots points on the svg in tooltip and creates labels
  function plotScatterPlot(funcs) {
    svgScatterPlot
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'circles')
      .attr('cx', funcs.x)
      .attr('cy', funcs.y)
      .attr('r', 3)
      .attr('fill', '#4286f4');

    svgScatterPlot
      .append('text')
      .attr('x', 130)
      .attr('y', 290)
      .style('font-size', '10pt')
      .text('Year');

    svgScatterPlot
      .append('text')
      .attr('x', 50)
      .attr('y', 30)
      .style('font-size', '10pt')
      .text('Rape count over time');

    svgScatterPlot
      .append('text')
      .attr('transform', 'translate(15, 220)rotate(-90)')
      .style('font-size', '10pt')
      .text('Rape in thousands');
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    const xValue = function(d) {
      return +d[x];
    };

    // function to scale x value
    const xScale = d3
      .scaleLinear()
      .domain([limits.xMin - 1, limits.xMax + 1]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    const xMap = function(d) {
      return xScale(xValue(d));
    };

    // plot x-axis at bottom of SVG
    const xAxis = d3.axisBottom().scale(xScale);
    svg
      .append('g')
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    const yValue = function(d) {
      let formattedData =
        typeof d[y] === 'string'
          ? parseInt(d['Rape'].replace(/,/g, ''))
          : +d[y];

      formattedData =
        svg === svgScatterPlot ? formattedData / 1000 : formattedData;
      return formattedData;
    };

    // function to scale y
    const yScale = d3
      .scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    const yMap = function(d) {
      return yScale(yValue(d));
    };

    // plot y-axis at the left of SVG
    const yAxis = d3.axisLeft().scale(yScale);
    svg
      .append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale,
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {
    // get min/max x values
    const xMin = d3.min(x);
    const xMax = d3.max(x);

    // get min/max y values
    const yMin = d3.min(y);
    const yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax,
    };
  }
})();
