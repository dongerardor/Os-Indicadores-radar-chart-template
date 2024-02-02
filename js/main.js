window.onload = () => {
    const placeholder = document.getElementById('radar-chart-container');
    const jsonFile = './js/data.json';
    const chart = new Radar(placeholder, jsonFile);
}


