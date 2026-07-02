import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { invoke } from '@tauri-apps/api/core';

interface IPhoneSale {
    year: number;
    sales: number;
}

const BarChart = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [data, setData] = useState<IPhoneSale[]>([]);
    const [title, setTitle] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Поля формы
    const [yearInput, setYearInput] = useState<string>('');
    const [salesInput, setSalesInput] = useState<string>('');
    const [formError, setFormError] = useState<string | null>(null);

    // Загружаем данные из Rust
    const loadData = async () => {
        try {
            const salesData = await invoke<IPhoneSale[]>('get_sales_data');
            const chartTitle = await invoke<string>('get_chart_info');
            setData(salesData);
            setTitle(chartTitle);
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
            setError('Не удалось загрузить данные');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Рисуем график когда данные обновляются
    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        d3.select(svgRef.current).selectAll('*').remove();

        const width = 1000;
        const height = 550;
        const margin = { top: 40, right: 40, bottom: 70, left: 70 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        const defs = svg.append('defs');

        const gradient = defs.append('linearGradient')
            .attr('id', 'barGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#007AFF');

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#0056b3');

        const hoverGradient = defs.append('linearGradient')
            .attr('id', 'hoverGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        hoverGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#FF9500');

        hoverGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#FF6B00');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleBand()
            .domain(data.map(d => d.year.toString()))
            .range([0, innerWidth])
            .padding(0.2);

        const maxSales = d3.max(data, d => d.sales) || 250;
        const yScale = d3.scaleLinear()
            .domain([0, maxSales * 1.1]) // +10% сверху
            .range([innerHeight, 0])
            .nice();

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale)
                .ticks(10)
                .tickSize(-innerWidth)
                .tickFormat(() => '')
            )
            .style('stroke-dasharray', '3,3')
            .style('stroke-opacity', 0.15);

        const xAxis = g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale));

        xAxis.selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .style('font-size', '11px');

        g.append('g')
            .call(d3.axisLeft(yScale).ticks(10))
            .selectAll('text')
            .style('font-size', '11px');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .style('text-anchor', 'middle')
            .style('font-size', '13px')
            .style('fill', '#555')
            .text('Год');

        svg.append('text')
            .attr('x', -height / 2)
            .attr('y', 18)
            .style('text-anchor', 'middle')
            .style('font-size', '13px')
            .style('fill', '#555')
            .attr('transform', 'rotate(-90)')
            .text('Продажи (млн. шт.)');

        // Tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'd3-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0, 0, 0, 0.85)')
            .style('color', 'white')
            .style('padding', '8px 14px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('opacity', '0')
            .style('transition', 'opacity 0.15s ease-in-out');

        // Столбцы
        g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.year.toString()) || 0)
            .attr('width', xScale.bandwidth())
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('fill', 'url(#barGradient)')
            .attr('rx', 4)
            .style('cursor', 'pointer')
            .on('mouseenter', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('fill', 'url(#hoverGradient)');

                tooltip
                    .style('visibility', 'visible')
                    .style('opacity', '1')
                    .html(`${d.year}: <span style="color: #FF9500">${d.sales}M</span>`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 35) + 'px');
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 35) + 'px');
            })
            .on('mouseleave', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('fill', 'url(#barGradient)');

                tooltip
                    .style('visibility', 'hidden')
                    .style('opacity', '0');
            })
            .transition()
            .duration(600)
            .delay((_, i) => i * 30)
            .attr('y', d => yScale(d.sales))
            .attr('height', d => innerHeight - yScale(d.sales));

        // Значения над столбцами
        g.selectAll('.label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => (xScale(d.year.toString()) || 0) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.sales) - 8)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#333')
            .style('font-weight', '500')
            .style('opacity', 0)
            .text(d => `${d.sales}M`)
            .transition()
            .duration(400)
            .delay((_, i) => i * 30 + 400)
            .style('opacity', 1);

        return () => {
            d3.select('.d3-tooltip').remove();
        };

    }, [data]);

    // Обработчик добавления данных
    const handleAddSale = async () => {
        setFormError(null);

        const year = parseInt(yearInput);
        const sales = parseFloat(salesInput);

        // Валидация
        if (!yearInput || !salesInput) {
            setFormError('Заполните оба поля');
            return;
        }

        if (isNaN(year) || year < 2000 || year > 2100) {
            setFormError('Год должен быть числом от 2000 до 2100');
            return;
        }

        if (isNaN(sales) || sales < 0 || sales > 1000) {
            setFormError('Количество должно быть числом от 0 до 1000');
            return;
        }

        try {
            const updatedData = await invoke<IPhoneSale[]>('add_sale', {
                year,
                sales
            });
            setData(updatedData);
            setYearInput('');
            setSalesInput('');
        } catch (err) {
            console.error('Ошибка добавления:', err);
            setFormError('Не удалось добавить данные');
        }
    };

    // Обработчик удаления
    const handleDeleteSale = async (year: number) => {
        try {
            const updatedData = await invoke<IPhoneSale[]>('delete_sale', { year });
            setData(updatedData);
        } catch (err) {
            console.error('Ошибка удаления:', err);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Загрузка данных из Rust...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error">
                <p>❌ {error}</p>
            </div>
        );
    }

    return (
        <div className="chart-container">
            <h1 className="chart-title">{title}</h1>

            {/* Форма добавления */}
            <div className="form-container">
                <div className="form-row">
                    <div className="input-group">
                        <label>Год</label>
                        <input
                            type="number"
                            placeholder="Например: 2024"
                            value={yearInput}
                            onChange={(e) => setYearInput(e.target.value)}
                            min="2000"
                            max="2100"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSale()}
                        />
                    </div>
                    <div className="input-group">
                        <label>Продажи (млн. шт.)</label>
                        <input
                            type="number"
                            placeholder="Например: 250.5"
                            value={salesInput}
                            onChange={(e) => setSalesInput(e.target.value)}
                            min="0"
                            max="1000"
                            step="0.1"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSale()}
                        />
                    </div>
                    <button onClick={handleAddSale} className="add-button">
                        + Добавить
                    </button>
                </div>
                {formError && <p className="form-error">{formError}</p>}
            </div>

            {/* График */}
            <div className="chart-wrapper">
                <svg ref={svgRef}></svg>
            </div>

            {/* Список данных */}
            <div className="data-list">
                <h3>Данные ({data.length} записей)</h3>
                <div className="data-grid">
                    {data.map((item) => (
                        <div key={item.year} className="data-item">
                            <span className="data-year">{item.year}</span>
                            <span className="data-sales">{item.sales}M</span>
                            <button
                                onClick={() => handleDeleteSale(item.year)}
                                className="delete-button"
                                title="Удалить"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chart-footer">
                <p>🦀 Данные хранятся в Rust • Динамическое обновление графика</p>
            </div>
        </div>
    );
};

export default BarChart;