import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataPoint {
    year: number;
    sales: number;
}

const BarChart = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        // Данные о продажах iPhone (в миллионах)
        const data: DataPoint[] = [
            { year: 2007, sales: 1.4 },
            { year: 2008, sales: 11.6 },
            { year: 2009, sales: 20.7 },
            { year: 2010, sales: 39.9 },
            { year: 2011, sales: 72.3 },
            { year: 2012, sales: 125.0 },
            { year: 2013, sales: 150.2 },
            { year: 2014, sales: 169.2 },
            { year: 2015, sales: 231.2 },
            { year: 2016, sales: 211.8 },
            { year: 2017, sales: 216.7 },
        ];

        if (!svgRef.current) return;

        // Очищаем предыдущий рендер
        d3.select(svgRef.current).selectAll('*').remove();

        // Размеры SVG
        const width = 800;
        const height = 500;
        const margin = { top: 40, right: 30, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Создаем SVG
        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Создаем группу для графика
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Создаем шкалы
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.year.toString()))
            .range([0, innerWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.sales) || 250])
            .range([innerHeight, 0])
            .nice();

        // Добавляем оси
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-65)');

        g.append('g')
            .call(d3.axisLeft(yScale));

        // Добавляем подписи осей
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .style('text-anchor', 'middle')
            .text('Год');

        svg.append('text')
            .attr('x', -height / 2)
            .attr('y', 15)
            .style('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .text('Продажи (млн. шт.)');

        // Создаем столбцы
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.year.toString()) || 0)
            .attr('y', d => yScale(d.sales))
            .attr('width', xScale.bandwidth())
            .attr('height', d => innerHeight - yScale(d.sales))
            .attr('fill', '#007AFF')
            .attr('rx', 4)
            .on('mouseover', function(_, d) {
                d3.select(this)
                    .attr('fill', '#0056b3')
                    .attr('transform', 'scale(1.02)');

                // Добавляем всплывающую подсказку
                const xPos = (xScale(d.year.toString()) || 0) + margin.left + xScale.bandwidth() / 2;
                const yPos = yScale(d.sales) + margin.top - 10;

                svg.append('text')
                    .attr('id', 'tooltip')
                    .attr('x', xPos)
                    .attr('y', yPos)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '14px')
                    .attr('font-weight', 'bold')
                    .attr('fill', '#333')
                    .text(`${d.sales}M`);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('fill', '#007AFF')
                    .attr('transform', 'scale(1)');
                svg.select('#tooltip').remove();
            });

        // Добавляем заголовок
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .text('Продажи iPhone по годам');

    }, []);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default BarChart;