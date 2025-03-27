const Stats = {
     template: `
       <div class="admin-dashboard-charts" style="display: flex; justify-content: space-between; padding: 20px; background-color: #f4f4f4;">
         <div class="chart-container" style="
           width: 30%;
           background-color: white;
           border-radius: 8px;
           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
           padding: 15px;
           margin-right: 15px;
           border: 1px solid #e0e0e0;
         ">
           <h2 style="
             text-align: center;
             color: #333;
             border-bottom: 2px solid #4a90e2;
             padding-bottom: 10px;
             margin-bottom: 15px;
           ">Top Services</h2>
           <canvas ref="topServicesChart" style="max-height: 300px;"></canvas>
         </div>

         <div class="chart-container" style="
           width: 30%;
           background-color: white;
           border-radius: 8px;
           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
           padding: 15px;
           margin-right: 15px;
           border: 1px solid #e0e0e0;
         ">
           <h2 style="
             text-align: center;
             color: #333;
             border-bottom: 2px solid #4a90e2;
             padding-bottom: 10px;
             margin-bottom: 15px;
           ">Top Professionals</h2>
           <canvas ref="topProfessionalsChart" style="max-height: 300px;"></canvas>
         </div>

         <div class="chart-container" style="
           width: 30%;
           background-color: white;
           border-radius: 8px;
           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
           padding: 15px;
           border: 1px solid #e0e0e0;
         ">
           <h2 style="
             text-align: center;
             color: #333;
             border-bottom: 2px solid #4a90e2;
             padding-bottom: 10px;
             margin-bottom: 15px;
           ">Top Customers</h2>
           <canvas ref="topCustomersChart" style="max-height: 300px;"></canvas>
         </div>
       </div>
     `,
     data() {
       return {
         topServicesChart: null,
         topProfessionalsChart: null,
         topCustomersChart: null
       }
     },
     mounted() {
       // Check if Chart is already loaded
       if (window.Chart) {
         this.fetchAndRenderCharts();
       } else {
         // Load Chart.js from CDN
         const chartScript = document.createElement('script');
         chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
         chartScript.async = true;
         chartScript.onload = () => {
           this.fetchAndRenderCharts();
         };
         chartScript.onerror = () => {
           console.error('Failed to load Chart.js');
         };
         document.head.appendChild(chartScript);
       }
     },
     methods: {
       async fetchAndRenderCharts() {
         try {
           // Fetch data from API endpoints
           const [servicesResponse, professionalsResponse, customersResponse] = await Promise.all([
               axios.get('http://127.0.0.1:5000/admin/top-services'),
               axios.get('http://127.0.0.1:5000/admin/top-professionals'),
               axios.get('http://127.0.0.1:5000/admin/top-customers')
           ]);

           const topServices = await servicesResponse.data;
          //  console.log(topServices);
           const topProfessionals = await professionalsResponse.data;
           const topCustomers = await customersResponse.data;

           // Render charts
           this.renderTopServicesChart(topServices);
           this.renderTopProfessionalsChart(topProfessionals);
           this.renderTopCustomersChart(topCustomers);
         } catch (error) {
           console.error('Error fetching dashboard data:', error);
         }
       },
       renderTopServicesChart(topServices) {
         if (!topServices.length) return;

         const ctx = this.$refs.topServicesChart.getContext('2d');
         // Destroy existing chart if it exists
         if (this.topServicesChart) {
           this.topServicesChart.destroy();
         }

         this.topServicesChart = new Chart(ctx, {
           type: 'bar',
           data: {
             labels: topServices.map(service => service.name),
             datasets: [{
               label: 'Total Completed Requests',
               data: topServices.map(service => service.total_requests),
               backgroundColor: 'rgba(75, 192, 192, 0.6)',
               borderColor: 'rgba(75, 192, 192, 1)',
               borderWidth: 1
             }]
           },
           options: {
             responsive: true,
             maintainAspectRatio: false,
             plugins: {
               legend: {
                 display: false
               }
             },
             scales: {
               y: {
                 beginAtZero: true,
                 title: {
                   display: true,
                   text: 'Number of Requests'
                 }
               }
             }
           }
         });
       },
       renderTopProfessionalsChart(topProfessionals) {
         if (!topProfessionals.length) return;

         const ctx = this.$refs.topProfessionalsChart.getContext('2d');
         // Destroy existing chart if it exists
         if (this.topProfessionalsChart) {
           this.topProfessionalsChart.destroy();
         }

         this.topProfessionalsChart = new Chart(ctx, {
           type: 'bar',
           data: {
             labels: topProfessionals.map(prof => prof.name),
             datasets: [
               {
                 label: 'Completed Requests',
                 data: topProfessionals.map(prof => prof.total_completed_requests),
                 backgroundColor: 'rgba(54, 162, 235, 0.6)',
                 borderColor: 'rgba(54, 162, 235, 1)',
                 borderWidth: 1
               },
               {
                 label: 'Rating',
                 data: topProfessionals.map(prof => prof.rating),
                 type: 'line',
                 borderColor: 'rgba(255, 99, 132, 1)',
                 borderWidth: 2,
                 fill: false
               }
             ]
           },
           options: {
             responsive: true,
             maintainAspectRatio: false,
             plugins: {
               legend: {
                 display: true,
                 position: 'top'
               }
             },
             scales: {
               y: {
                 beginAtZero: true,
                 title: {
                   display: true,
                   text: 'Requests / Rating'
                 }
               }
             }
           }
         });
       },
       renderTopCustomersChart(topCustomers) {
         if (!topCustomers.length) return;

         const ctx = this.$refs.topCustomersChart.getContext('2d');
         // Destroy existing chart if it exists
         if (this.topCustomersChart) {
           this.topCustomersChart.destroy();
         }

         this.topCustomersChart = new Chart(ctx, {
           type: 'bar',
           data: {
             labels: topCustomers.map(customer => customer.name),
             datasets: [{
               label: 'Total Requests',
               data: topCustomers.map(customer => customer.total_requests),
               backgroundColor: 'rgba(255, 206, 86, 0.6)',
               borderColor: 'rgba(255, 206, 86, 1)',
               borderWidth: 1
             }]
           },
           options: {
             responsive: true,
             maintainAspectRatio: false,
             indexAxis: 'y',
             plugins: {
               legend: {
                 display: false
               }
             },
             scales: {
               x: {
                 beginAtZero: true,
                 title: {
                   display: true,
                   text: 'Number of Requests'
                 }
               }
             }
           }
         });
       }
     }
   };
