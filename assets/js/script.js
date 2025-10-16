// Global variables
let data = [];
let filteredData = [];
let charts = {};

// City coordinates for mapping
const cityCoordinates = {
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.7041, 77.1025],
    'Bengaluru': [12.9716, 77.5946],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Hyderabad': [17.3850, 78.4867],
    'Pune': [18.5204, 73.8567],
    'Ahmedabad': [23.0225, 72.5714],
    'Jaipur': [26.9124, 75.7873],
    'Lucknow': [26.8467, 80.9462],
    'Surat': [21.1702, 72.8311],
    'Kanpur': [26.4499, 80.3319],
    'Nagpur': [21.1458, 79.0882],
    'Patna': [25.5941, 85.1376],
    'Bhopal': [23.2599, 77.4126],
    'Thiruvananthapuram': [8.5241, 76.9366],
    'Indore': [22.7196, 75.8577],
    'Vadodara': [22.3072, 73.1812],
    'Guwahati': [26.1445, 91.7362],
    'Coimbatore': [11.0168, 76.9558],
    'Ranchi': [23.3441, 85.3096],
    'Amritsar': [31.6340, 74.8723],
    'Jodhpur': [26.2389, 73.0243],
    'Varanasi': [25.3176, 82.9739],
    'Ludhiana': [30.9010, 75.8573],
    'Agra': [27.1767, 78.0081],
    'Meerut': [28.9845, 77.7064],
    'Nashik': [20.0059, 73.7910],
    'Rajkot': [22.3039, 70.8022],
    'Madurai': [9.9252, 78.1198],
    'Jabalpur': [23.1815, 79.9864],
    'Allahabad': [25.4358, 81.8463],
    'Visakhapatnam': [17.6868, 83.2185],
    'Gwalior': [26.2183, 78.1828]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeEventListeners();
    showSection('overview');
});

// Load data from JSON file
async function loadData() {
    try {
        showLoading(true);
        const response = await fetch('assets/data/data.json');
        data = await response.json();
        filteredData = [...data];
        
        // Populate filter options
        populateFilterOptions();
        
        // Initialize overview statistics
        updateOverviewStats();
        
        // Initialize charts
        initializeCharts();
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading data:', error);
        showLoading(false);
    }
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

// Populate filter options
function populateFilterOptions() {
    const cities = [...new Set(data.map(item => item.city))].sort();
    const wasteTypes = [...new Set(data.map(item => item.WasteType))].sort();
    const disposalMethods = [...new Set(data.map(item => item.disposal_method))].sort();
    
    // Populate city selects
    populateSelect('awarenessCities', cities);
    populateSelect('costCities', cities);
    populateSelect('landfillCities', cities);
    populateSelect('mapCities', cities);
    populateSelect('cityFilter', cities);
    
    // Populate waste type selects
    populateSelect('wasteTypes', wasteTypes);
    populateSelect('efficiencyWasteTypes', wasteTypes);
    populateSelect('wasteTypeFilter', wasteTypes);
    populateSelect('mapWasteType', ['All', ...wasteTypes]);
    
    // Populate disposal method selects
    populateSelect('disposalMethods', disposalMethods);
    populateSelect('disposalMethodFilter', disposalMethods);
}

// Helper function to populate select elements
function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (select) {
        select.innerHTML = '';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Range sliders
    document.getElementById('rateBinWidth').addEventListener('input', updateAwarenessChart);
    document.getElementById('campaignBinWidth').addEventListener('input', updateAwarenessChart);
    
    // Multi-selects
    document.getElementById('awarenessCities').addEventListener('change', updateAwarenessChart);
    document.getElementById('wasteTypes').addEventListener('change', updateCostCharts);
    document.getElementById('costCities').addEventListener('change', updateCostCharts);
    document.getElementById('efficiencyWasteTypes').addEventListener('change', updateEfficiencyChart);
    document.getElementById('disposalMethods').addEventListener('change', updateEfficiencyChart);
    
    // Checkbox
    document.getElementById('showAllCities').addEventListener('change', toggleCitySelection);
    
    // Map filters
    document.getElementById('mapCities').addEventListener('change', updateMap);
    document.getElementById('mapWasteType').addEventListener('change', updateMap);
    
    // Raw data filters
    document.getElementById('searchInput').addEventListener('input', filterDataTable);
    document.getElementById('cityFilter').addEventListener('change', filterDataTable);
    document.getElementById('wasteTypeFilter').addEventListener('change', filterDataTable);
    document.getElementById('disposalMethodFilter').addEventListener('change', filterDataTable);
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
        
        // Initialize section-specific content
        switch(sectionId) {
            case 'overview':
                updateOverviewStats();
                updateOverviewCharts();
                break;
            case 'awareness':
                updateAwarenessChart();
                break;
            case 'cost':
                updateCostCharts();
                break;
            case 'efficiency':
                updateEfficiencyChart();
                break;
            case 'landfill':
                updateLandfillCharts();
                break;
            case 'geographic':
                initializeMap();
                break;
            case 'rawdata':
                initializeDataTable();
                break;
        }
    }
}

// Update overview statistics
function updateOverviewStats() {
    const totalCities = new Set(data.map(item => item.city)).size;
    const totalWaste = data.reduce((sum, item) => sum + (item.WasteGenerated || 0), 0);
    const avgRecycling = data.reduce((sum, item) => sum + (item.RecyclingRate || 0), 0) / data.length;
    const avgMES = data.reduce((sum, item) => sum + (item.MES || 0), 0) / data.length;
    
    document.getElementById('totalCities').textContent = totalCities;
    document.getElementById('totalWaste').textContent = Math.round(totalWaste).toLocaleString();
    document.getElementById('avgRecycling').textContent = avgRecycling.toFixed(1) + '%';
    document.getElementById('avgMES').textContent = avgMES.toFixed(2);
}

// Initialize all charts
function initializeCharts() {
    updateOverviewCharts();
    updateAwarenessChart();
    updateCostCharts();
    updateEfficiencyChart();
    updateLandfillCharts();
}

// Update overview charts
function updateOverviewCharts() {
    // Top cities by recycling rate
    const cityStats = data.reduce((acc, item) => {
        if (!acc[item.city]) {
            acc[item.city] = { totalRecycling: 0, count: 0 };
        }
        acc[item.city].totalRecycling += item.RecyclingRate || 0;
        acc[item.city].count += 1;
        return acc;
    }, {});
    
    const topCities = Object.entries(cityStats)
        .map(([city, stats]) => ({
            city,
            avgRecycling: stats.totalRecycling / stats.count
        }))
        .sort((a, b) => b.avgRecycling - a.avgRecycling)
        .slice(0, 10);
    
    const ctx1 = document.getElementById('topRecyclingChart');
    if (ctx1) {
        if (charts.topRecyclingChart) {
            charts.topRecyclingChart.destroy();
        }
        charts.topRecyclingChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: topCities.map(item => item.city),
                datasets: [{
                    label: 'Average Recycling Rate (%)',
                    data: topCities.map(item => item.avgRecycling),
                    backgroundColor: 'rgba(0, 204, 136, 0.8)',
                    borderColor: 'rgba(0, 204, 136, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Recycling Rate (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'City'
                        }
                    }
                }
            }
        });
    }
    
    // Waste type distribution
    const wasteTypeStats = data.reduce((acc, item) => {
        acc[item.WasteType] = (acc[item.WasteType] || 0) + (item.WasteGenerated || 0);
        return acc;
    }, {});
    
    const ctx2 = document.getElementById('wasteTypeChart');
    if (ctx2) {
        if (charts.wasteTypeChart) {
            charts.wasteTypeChart.destroy();
        }
        charts.wasteTypeChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(wasteTypeStats),
                datasets: [{
                    data: Object.values(wasteTypeStats),
                    backgroundColor: [
                        'rgba(255, 75, 75, 0.8)',
                        'rgba(0, 204, 136, 0.8)',
                        'rgba(0, 212, 170, 0.8)',
                        'rgba(255, 161, 90, 0.8)',
                        'rgba(108, 117, 125, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Update awareness chart
function updateAwarenessChart() {
    const selectedCities = Array.from(document.getElementById('awarenessCities').selectedOptions)
        .map(option => option.value);
    
    const filteredData = data.filter(item => 
        selectedCities.length === 0 || selectedCities.includes(item.city)
    );
    
    const cityStats = filteredData.reduce((acc, item) => {
        if (!acc[item.city]) {
            acc[item.city] = { totalRecycling: 0, totalCampaigns: 0, count: 0 };
        }
        acc[item.city].totalRecycling += item.RecyclingRate || 0;
        acc[item.city].totalCampaigns += item.AwarenessCampaignsCount || 0;
        acc[item.city].count += 1;
        return acc;
    }, {});
    
    const chartData = Object.entries(cityStats).map(([city, stats]) => ({
        city,
        avgRecycling: stats.totalRecycling / stats.count,
        avgCampaigns: stats.totalCampaigns / stats.count
    }));
    
    const ctx = document.getElementById('awarenessChart');
    if (ctx) {
        if (charts.awarenessChart) {
            charts.awarenessChart.destroy();
        }
        charts.awarenessChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Cities',
                    data: chartData.map(item => ({
                        x: item.avgCampaigns,
                        y: item.avgRecycling
                    })),
                    backgroundColor: 'rgba(255, 75, 75, 0.6)',
                    borderColor: 'rgba(255, 75, 75, 1)',
                    pointRadius: 8,
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Average Awareness Campaigns Count'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Average Recycling Rate (%)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                return `City: ${chartData[dataIndex].city}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Update cost charts
function updateCostCharts() {
    const selectedWasteTypes = Array.from(document.getElementById('wasteTypes').selectedOptions)
        .map(option => option.value);
    const selectedCities = Array.from(document.getElementById('costCities').selectedOptions)
        .map(option => option.value);
    
    const filteredData = data.filter(item => 
        (selectedWasteTypes.length === 0 || selectedWasteTypes.includes(item.WasteType)) &&
        (selectedCities.length === 0 || selectedCities.includes(item.city))
    );
    
    // Cost by city chart
    const cityCosts = filteredData.reduce((acc, item) => {
        if (!acc[item.city]) {
            acc[item.city] = { totalCost: 0, count: 0 };
        }
        acc[item.city].totalCost += item.CostofWasteManagement || 0;
        acc[item.city].count += 1;
        return acc;
    }, {});
    
    const costData = Object.entries(cityCosts).map(([city, stats]) => ({
        city,
        avgCost: stats.totalCost / stats.count
    })).sort((a, b) => b.avgCost - a.avgCost);
    
    const ctx1 = document.getElementById('costChart');
    if (ctx1) {
        if (charts.costChart) {
            charts.costChart.destroy();
        }
        charts.costChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: costData.map(item => item.city),
                datasets: [{
                    label: 'Average Cost (₹/Ton)',
                    data: costData.map(item => item.avgCost),
                    backgroundColor: 'rgba(0, 204, 136, 0.8)',
                    borderColor: 'rgba(0, 204, 136, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cost (₹/Ton)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'City'
                        }
                    }
                }
            }
        });
    }
    
    // Recycling rate by waste type chart
    const wasteTypeRecycling = filteredData.reduce((acc, item) => {
        if (!acc[item.WasteType]) {
            acc[item.WasteType] = { totalRecycling: 0, count: 0 };
        }
        acc[item.WasteType].totalRecycling += item.RecyclingRate || 0;
        acc[item.WasteType].count += 1;
        return acc;
    }, {});
    
    const recyclingData = Object.entries(wasteTypeRecycling).map(([wasteType, stats]) => ({
        wasteType,
        avgRecycling: stats.totalRecycling / stats.count
    }));
    
    const ctx2 = document.getElementById('recyclingByTypeChart');
    if (ctx2) {
        if (charts.recyclingByTypeChart) {
            charts.recyclingByTypeChart.destroy();
        }
        charts.recyclingByTypeChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: recyclingData.map(item => item.wasteType),
                datasets: [{
                    label: 'Average Recycling Rate (%)',
                    data: recyclingData.map(item => item.avgRecycling),
                    backgroundColor: 'rgba(0, 212, 170, 0.8)',
                    borderColor: 'rgba(0, 212, 170, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Recycling Rate (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Waste Type'
                        }
                    }
                }
            }
        });
    }
}

// Update efficiency chart
function updateEfficiencyChart() {
    const selectedWasteTypes = Array.from(document.getElementById('efficiencyWasteTypes').selectedOptions)
        .map(option => option.value);
    const selectedMethods = Array.from(document.getElementById('disposalMethods').selectedOptions)
        .map(option => option.value);
    
    const filteredData = data.filter(item => 
        (selectedWasteTypes.length === 0 || selectedWasteTypes.includes(item.WasteType)) &&
        (selectedMethods.length === 0 || selectedMethods.includes(item.disposal_method))
    );
    
    const efficiencyData = filteredData.reduce((acc, item) => {
        const key = `${item.WasteType}-${item.disposal_method}`;
        if (!acc[key]) {
            acc[key] = { totalMES: 0, count: 0, wasteType: item.WasteType, method: item.disposal_method };
        }
        acc[key].totalMES += item.MES || 0;
        acc[key].count += 1;
        return acc;
    }, {});
    
    const chartData = Object.values(efficiencyData).map(item => ({
        wasteType: item.wasteType,
        method: item.method,
        avgMES: item.totalMES / item.count
    }));
    
    const ctx = document.getElementById('efficiencyChart');
    if (ctx) {
        if (charts.efficiencyChart) {
            charts.efficiencyChart.destroy();
        }
        
        const wasteTypes = [...new Set(chartData.map(item => item.wasteType))];
        const methods = [...new Set(chartData.map(item => item.method))];
        const colors = ['rgba(255, 75, 75, 0.8)', 'rgba(0, 204, 136, 0.8)', 'rgba(0, 212, 170, 0.8)', 'rgba(255, 161, 90, 0.8)'];
        
        const datasets = methods.map((method, index) => ({
            label: method,
            data: wasteTypes.map(wasteType => {
                const item = chartData.find(d => d.wasteType === wasteType && d.method === method);
                return item ? item.avgMES : 0;
            }),
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace('0.8', '1'),
            borderWidth: 1
        }));
        
        charts.efficiencyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: wasteTypes,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Average MES Score'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Waste Type'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
}

// Update landfill charts
function updateLandfillCharts() {
    const showAll = document.getElementById('showAllCities').checked;
    const selectedCities = Array.from(document.getElementById('landfillCities').selectedOptions)
        .map(option => option.value);
    
    let filteredData = data;
    if (!showAll && selectedCities.length > 0) {
        filteredData = data.filter(item => selectedCities.includes(item.city));
    }
    
    const cityStats = filteredData.reduce((acc, item) => {
        if (!acc[item.city]) {
            acc[item.city] = { 
                populationDensity: item.PopulationDensity || 0, 
                landfillCapacity: item.LandfillCapacity || 0 
            };
        }
        return acc;
    }, {});
    
    const chartData = Object.entries(cityStats).map(([city, stats]) => ({
        city,
        populationDensity: stats.populationDensity,
        landfillCapacity: stats.landfillCapacity
    }));
    
    // Scatter plot
    const ctx1 = document.getElementById('landfillScatterChart');
    if (ctx1) {
        if (charts.landfillScatterChart) {
            charts.landfillScatterChart.destroy();
        }
        charts.landfillScatterChart = new Chart(ctx1, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Cities',
                    data: chartData.map(item => ({
                        x: item.populationDensity,
                        y: item.landfillCapacity
                    })),
                    backgroundColor: 'rgba(255, 161, 90, 0.6)',
                    borderColor: 'rgba(255, 161, 90, 1)',
                    pointRadius: 8,
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Population Density (people per sq km)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Landfill Capacity (tons)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                return `City: ${chartData[dataIndex].city}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Bar chart
    const sortedData = chartData.sort((a, b) => b.populationDensity - a.populationDensity);
    const ctx2 = document.getElementById('landfillBarChart');
    if (ctx2) {
        if (charts.landfillBarChart) {
            charts.landfillBarChart.destroy();
        }
        charts.landfillBarChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: sortedData.map(item => item.city),
                datasets: [{
                    label: 'Landfill Capacity (tons)',
                    data: sortedData.map(item => item.landfillCapacity),
                    backgroundColor: 'rgba(255, 161, 90, 0.8)',
                    borderColor: 'rgba(255, 161, 90, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Landfill Capacity (tons)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'City (sorted by population density)'
                        }
                    }
                }
            }
        });
    }
}

// Toggle city selection visibility
function toggleCitySelection() {
    const showAll = document.getElementById('showAllCities').checked;
    const citySelection = document.getElementById('citySelection');
    if (citySelection) {
        citySelection.style.display = showAll ? 'none' : 'block';
    }
    updateLandfillCharts();
}

// Initialize map
function initializeMap() {
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        return;
    }
    
    // Create map
    const map = L.map('map').setView([20.5937, 78.9629], 5);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add markers for cities
    const selectedCities = Array.from(document.getElementById('mapCities').selectedOptions)
        .map(option => option.value);
    const selectedWasteType = document.getElementById('mapWasteType').value;
    
    let filteredData = data;
    if (selectedCities.length > 0) {
        filteredData = data.filter(item => selectedCities.includes(item.city));
    }
    if (selectedWasteType !== 'All') {
        filteredData = filteredData.filter(item => item.WasteType === selectedWasteType);
    }
    
    const cityStats = filteredData.reduce((acc, item) => {
        if (!acc[item.city]) {
            acc[item.city] = { 
                totalWaste: 0, 
                populationDensity: item.PopulationDensity || 0,
                landfillCapacity: item.LandfillCapacity || 0,
            };
        }
        acc[item.city].totalWaste += item.WasteGenerated || 0;
        return acc;
    }, {});
    
    Object.entries(cityStats).forEach(([city, stats]) => {
        const coords = cityCoordinates[city];
        if (coords) {
            const marker = L.circleMarker(coords, {
                radius: Math.sqrt(stats.totalWaste) / 50,
                fillColor: '#ff4b4b',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);
            
            marker.bindPopup(`
                <strong>${city}</strong><br>
                Total Waste: ${Math.round(stats.totalWaste).toLocaleString()} tons/day<br>
                Population Density: ${Math.round(stats.populationDensity).toLocaleString()} people/km²<br>
                Landfill Capacity: ${Math.round(stats.landfillCapacity).toLocaleString()} tons
            `);
        }
    });
    
    // Store map reference for updates
    window.currentMap = map;
}

// Update map
function updateMap() {
    if (window.currentMap) {
        window.currentMap.remove();
    }
    initializeMap();
}

// Initialize data table
function initializeDataTable() {
    const table = document.getElementById('dataTable');
    if (table) {
        // Clear existing table
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        
        // Populate table with data
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.city}</td>
                <td>${item.WasteType}</td>
                <td>${(item.WasteGenerated || 0).toLocaleString()}</td>
                <td>${(item.RecyclingRate || 0).toFixed(1)}%</td>
                <td>${(item.PopulationDensity || 0).toLocaleString()}</td>
                <td>${(item.MES || 0).toFixed(2)}</td>
                <td>${item.disposal_method}</td>
                <td>₹${(item.CostofWasteManagement || 0).toLocaleString()}</td>
                <td>${item.AwarenessCampaignsCount || 0}</td>
                <td>${(item.LandfillCapacity || 0).toLocaleString()}</td>
                <td>${item.Year}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Initialize DataTable
        if ($.fn.DataTable) {
            $('#dataTable').DataTable({
                pageLength: 25,
                responsive: true,
                order: [[0, 'asc']],
                columnDefs: [
                    { targets: [2, 3, 4, 5, 7, 8, 9], className: 'text-end' }
                ]
            });
        }
    }
}

// Filter data table
function filterDataTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cityFilter = document.getElementById('cityFilter').value;
    const wasteTypeFilter = document.getElementById('wasteTypeFilter').value;
    const disposalMethodFilter = document.getElementById('disposalMethodFilter').value;
    
    let filteredData = data.filter(item => {
        const matchesSearch = !searchTerm || 
            Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            );
        const matchesCity = !cityFilter || item.city === cityFilter;
        const matchesWasteType = !wasteTypeFilter || item.WasteType === wasteTypeFilter;
        const matchesDisposalMethod = !disposalMethodFilter || item.disposal_method === disposalMethodFilter;
        
        return matchesSearch && matchesCity && matchesWasteType && matchesDisposalMethod;
    });
    
    // Update table
    const table = document.getElementById('dataTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.city}</td>
            <td>${item.WasteType}</td>
            <td>${(item.WasteGenerated || 0).toLocaleString()}</td>
            <td>${(item.RecyclingRate || 0).toFixed(1)}%</td>
            <td>${(item.PopulationDensity || 0).toLocaleString()}</td>
            <td>${(item.MES || 0).toFixed(2)}</td>
            <td>${item.disposal_method}</td>
            <td>₹${(item.CostofWasteManagement || 0).toLocaleString()}</td>
            <td>${item.AwarenessCampaignsCount || 0}</td>
            <td>${(item.LandfillCapacity || 0).toLocaleString()}</td>
            <td>${item.Year}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Reinitialize DataTable if it exists
    if ($.fn.DataTable && $('#dataTable').hasClass('dataTable')) {
        $('#dataTable').DataTable().destroy();
        $('#dataTable').DataTable({
            pageLength: 25,
            responsive: true,
            order: [[0, 'asc']],
            columnDefs: [
                { targets: [2, 3, 4, 5, 7, 8, 9], className: 'text-end' }
            ]
        });
    }
}

